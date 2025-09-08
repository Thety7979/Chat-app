import websocketService from './websocketService';
import callApi from '../api/callApi';
import chatApi from '../api/chatApi';

export interface CallState {
  isInCall: boolean;
  isCallActive: boolean;
  isCallIncoming: boolean;
  isCallOutgoing: boolean;
  callId: string | null;
  callerId: string | null;
  calleeId: string | null;
  localStream: MediaStream | null;
  remoteStream: MediaStream | null;
  peerConnection: RTCPeerConnection | null;
  pendingOffer?: RTCSessionDescriptionInit;
  pendingIceCandidates: RTCIceCandidateInit[];
  callType: 'audio' | 'video';
  isVideoEnabled: boolean;
  isAudioEnabled: boolean;
}

export interface CallEvent {
  type: 'call_incoming' | 'call_outgoing' | 'call_accepted' | 'call_rejected' | 'call_ended' | 'call_failed' | 'offer' | 'answer' | 'ice_candidate';
  callId: string;
  callerId: string;
  calleeId: string;
  data?: any;
  offer?: RTCSessionDescriptionInit;
  answer?: RTCSessionDescriptionInit;
  callType?: 'audio' | 'video';
}

class WebRTCService {
  private callState: CallState = {
    isInCall: false,
    isCallActive: false,
    isCallIncoming: false,
    isCallOutgoing: false,
    callId: null,
    callerId: null,
    calleeId: null,
    localStream: null,
    remoteStream: null,
    peerConnection: null,
    pendingIceCandidates: [],
    callType: 'audio',
    isVideoEnabled: false,
    isAudioEnabled: true
  };

  private callHandlers: Map<string, (event: CallEvent) => void> = new Map();
  private audioContext: AudioContext | null = null;
  private ringtoneAudio: HTMLAudioElement | null = null;
  private callTimeout: NodeJS.Timeout | null = null;
  private ringtoneInterval: NodeJS.Timeout | null = null;

  constructor() {
    this.initializeAudioContext();
    this.enableAudioContext();
    // Don't setup WebSocket handlers here - wait for WebSocket to be ready
    // Ensure we signal call end if the tab/window is closed while in a call
    if (typeof window !== 'undefined') {
      const handleBeforeUnload = () => {
        try {
          const state = this.getCallState();
          if (state.isInCall && state.callId) {
            // Fire-and-forget best-effort notification
            try {
              websocketService.sendCallEvent({
                type: 'call_ended',
                callId: state.callId,
                callerId: state.callerId || websocketService.getCurrentUserId() || '',
                calleeId: state.calleeId || ''
              });
            } catch {}
          }
        } catch {}
      };
      window.addEventListener('beforeunload', handleBeforeUnload);
    }
  }

  private initializeAudioContext() {
    try {
      this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    } catch (error) {
      console.error('Failed to initialize audio context:', error);
    }
  }

  private enableAudioContext() {
    // Enable audio context on first user interaction
    const enableAudio = () => {
      if (this.audioContext && this.audioContext.state === 'suspended') {
        this.audioContext.resume().then(() => {
          console.log('AudioContext resumed');
        });
      }
      
      // Also force unmute remote audio on user interaction
      this.forceUnmuteRemoteAudio();
    };

    // Add event listeners for user interaction
    document.addEventListener('click', enableAudio, { once: true });
    document.addEventListener('touchstart', enableAudio, { once: true });
    document.addEventListener('keydown', enableAudio, { once: true });
  }

  private debugAudioState(): void {
    try {
      const localAudio = document.getElementById('local-audio') as HTMLAudioElement;
      const remoteAudio = document.getElementById('remote-audio') as HTMLAudioElement;
      
      console.log('=== AUDIO DEBUG INFO ===');
      console.log('Local audio:', {
        exists: !!localAudio,
        muted: localAudio?.muted,
        volume: localAudio?.volume,
        paused: localAudio?.paused,
        srcObject: !!localAudio?.srcObject,
        readyState: localAudio?.readyState
      });
      
      console.log('Remote audio:', {
        exists: !!remoteAudio,
        muted: remoteAudio?.muted,
        volume: remoteAudio?.volume,
        paused: remoteAudio?.paused,
        srcObject: !!remoteAudio?.srcObject,
        readyState: remoteAudio?.readyState
      });
      
      if (remoteAudio?.srcObject) {
        const stream = remoteAudio.srcObject as MediaStream;
        console.log('Remote stream:', {
          active: stream.active,
          audioTracks: stream.getAudioTracks().length,
          audioTrackEnabled: stream.getAudioTracks()[0]?.enabled,
          audioTrackMuted: stream.getAudioTracks()[0]?.muted
        });
      }
      
      console.log('=== END AUDIO DEBUG ===');
    } catch (error) {
      console.error('Error debugging audio state:', error);
    }
  }

  private forceUnmuteRemoteAudio(): void {
    try {
      const remoteAudio = document.getElementById('remote-audio') as HTMLAudioElement;
      if (remoteAudio) {
        remoteAudio.muted = false;
        remoteAudio.volume = 1.0;
        
        // Try to play again
        remoteAudio.play().catch(error => {
          console.log('Still cannot play remote audio after unmute:', error);
        });
        
        console.log('WebRTC Service - Forced remote audio unmute');
      }
    } catch (error) {
      console.error('Error forcing remote audio unmute:', error);
    }
  }

  // Public method to setup WebSocket handlers when WebSocket is ready
  public setupWebSocketHandlers() {
    // Subscribe to call events when WebSocket is ready
    this.subscribeToCallEvents();
  }

  // Public method for debugging audio state
  public debugAudio(): void {
    this.debugAudioState();
  }

  // Public method to force unmute remote audio
  public unmuteRemoteAudio(): void {
    this.forceUnmuteRemoteAudio();
  }

  private async subscribeToCallEvents() {
    try {
      await websocketService.subscribeToCallEvents((event: CallEvent) => {
        this.handleCallEvent(event);
      });
      console.log('WebRTC service subscribed to call events');
    } catch (error) {
      console.error('Failed to subscribe to call events:', error);
      // Retry after a delay
      setTimeout(() => {
        this.subscribeToCallEvents();
      }, 2000);
    }
  }

  private hasVideoInSdp(sdp?: RTCSessionDescriptionInit | string): boolean {
    try {
      const s = typeof sdp === 'string' ? sdp : sdp?.sdp || '';
      return /\nm=video\s/i.test(s);
    } catch {
      return false;
    }
  }

  private handleCallEvent(event: CallEvent) {
    console.log('WebRTC Service - Call event received:', event);
    
    switch (event.type) {
      case 'call_incoming':
        console.log('WebRTC Service - Handling incoming call:', event);
        this.handleIncomingCall(event);
        break;
      case 'call_accepted':
        console.log('WebRTC Service - Handling call accepted:', event);
        this.handleCallAccepted(event).catch(error => {
          console.error('Failed to handle call accepted:', error);
        });
        break;
      case 'call_rejected':
        console.log('WebRTC Service - Handling call rejected:', event);
        this.handleCallRejected(event);
        break;
      case 'call_ended':
        console.log('WebRTC Service - Handling call ended:', event);
        this.handleCallEnded(event);
        break;
      case 'call_failed':
        console.log('WebRTC Service - Handling call failed:', event);
        this.handleCallFailed(event);
        break;
      case 'offer':
        console.log('WebRTC Service - Handling offer:', event);
        this.handleIncomingOffer(event.offer!).catch(error => {
          console.error('Failed to handle offer:', error);
        });
        break;
      case 'answer':
        console.log('WebRTC Service - Handling answer:', event);
        this.handleIncomingAnswer(event.answer!).catch(error => {
          console.error('Failed to handle answer:', error);
        });
        break;
      case 'ice_candidate':
        console.log('WebRTC Service - Handling ICE candidate:', event);
        this.handleIncomingIceCandidate(event.data!).catch(error => {
          console.error('Failed to handle ICE candidate:', error);
        });
        break;
      default:
        console.log('WebRTC Service - Unknown call event type:', event.type);
    }

    // Notify all handlers
    console.log('WebRTC Service - Notifying handlers, count:', this.callHandlers.size);
    this.callHandlers.forEach((handler, id) => {
      console.log('WebRTC Service - Calling handler:', id);
      handler(event);
    });
  }

  private async handleIncomingCall(event: CallEvent) {
    this.callState = {
      ...this.callState,
      isInCall: true,
      isCallIncoming: true,
      callId: event.callId,
      callerId: event.callerId,
      calleeId: event.calleeId,
      callType: event.callType || 'audio',
      isVideoEnabled: event.callType === 'video',
      isAudioEnabled: true
    };
    
    // If there's an offer in the incoming call event, store it for later
    if (event.offer) {
      console.log('WebRTC Service - Incoming call has offer, storing it for later...');
      this.callState.pendingOffer = event.offer;
    }
    
    this.playRingtone();
  }

  private async handleCallAccepted(event: CallEvent) {
    // Keep video UI if answer SDP still contains a video m-line
    const answerHasVideo = this.hasVideoInSdp(event.answer);
    const nextCallType = answerHasVideo ? 'video' : (event.callType ? event.callType : this.callState.callType);

    this.callState = {
      ...this.callState,
      isCallIncoming: false,
      isCallOutgoing: false,
      isCallActive: true,
      callType: nextCallType,
      isVideoEnabled: nextCallType === 'video' ? this.callState.isVideoEnabled : false
    };
    this.stopRingtone();
    
    // Clear call timeout since call was accepted
    if (this.callTimeout) {
      clearTimeout(this.callTimeout);
      this.callTimeout = null;
    }

    // If there's an answer in the call_accepted event, handle it
    if (event.answer) {
      console.log('WebRTC Service - Call accepted with answer, handling it...');
      try {
        await this.handleIncomingAnswer(event.answer);
      } catch (error) {
        console.error('Failed to handle answer in call_accepted:', error);
      }
    } else {
      console.log('WebRTC Service - Call accepted without answer');
    }
  }

  private handleCallRejected(event: CallEvent) {
    this.endCall();
  }

  private handleCallEnded(event: CallEvent) {
    // Do not rebroadcast when we received a remote end; just cleanup locally
    this.endCall(false);
  }

  private handleCallFailed(event: CallEvent) {
    this.endCall();
  }

  private playRingtone() {
    if (this.ringtoneAudio) {
      this.ringtoneAudio.pause();
    }

    // Clear any existing ringtone interval
    if (this.ringtoneInterval) {
      clearInterval(this.ringtoneInterval);
    }

    // Create a simple ringtone using Web Audio API
    if (this.audioContext) {
      const playRing = () => {
        if (!this.callState.isCallIncoming) return;
        
        const oscillator = this.audioContext!.createOscillator();
        const gainNode = this.audioContext!.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(this.audioContext!.destination);
        
        oscillator.frequency.setValueAtTime(800, this.audioContext!.currentTime);
        oscillator.frequency.setValueAtTime(600, this.audioContext!.currentTime + 0.5);
        
        gainNode.gain.setValueAtTime(0.3, this.audioContext!.currentTime);
        gainNode.gain.setValueAtTime(0, this.audioContext!.currentTime + 1);
        
        oscillator.start(this.audioContext!.currentTime);
        oscillator.stop(this.audioContext!.currentTime + 1);
      };

      // Play immediately
      playRing();
      
      // Repeat ringtone every 2 seconds
      this.ringtoneInterval = setInterval(playRing, 2000);
    }
  }

  private stopRingtone() {
    if (this.ringtoneAudio) {
      this.ringtoneAudio.pause();
    }
    if (this.ringtoneInterval) {
      clearInterval(this.ringtoneInterval);
      this.ringtoneInterval = null;
    }
  }

  // Public methods
  async checkMediaPermissions(callType: 'audio' | 'video'): Promise<{audio: boolean, video: boolean}> {
    try {
      const permissions = { audio: false, video: false };
      
      // Check audio permission
      try {
        const audioStream = await navigator.mediaDevices.getUserMedia({ audio: true });
        permissions.audio = true;
        audioStream.getTracks().forEach(track => track.stop());
      } catch (error) {
        console.warn('Audio permission denied:', error);
      }
      
      // Check video permission if needed
      if (callType === 'video') {
        try {
          const videoStream = await navigator.mediaDevices.getUserMedia({ video: true });
          permissions.video = true;
          videoStream.getTracks().forEach(track => track.stop());
        } catch (error) {
          console.warn('Video permission denied:', error);
        }
      }
      
      return permissions;
    } catch (error) {
      console.error('Error checking media permissions:', error);
      return { audio: false, video: false };
    }
  }

  async startCall(calleeId: string, callType: 'audio' | 'video' = 'audio'): Promise<void> {
    try {
      console.log('WebRTC Service - startCall called with calleeId:', calleeId);
      
      // First, get or create conversation with the callee
      console.log('WebRTC Service - Getting or creating conversation...');
      const conversation = await this.getOrCreateConversation(calleeId);
      console.log('WebRTC Service - Conversation:', conversation);
      
      // Create call record in database
      console.log('WebRTC Service - Creating call record...');
      let callRecord;
      try {
        callRecord = await callApi.createCall(conversation.id, callType);
      console.log('WebRTC Service - Call record created:', callRecord);
      } catch (error: any) {
        if (error.response?.status === 400 && error.response?.data?.includes('ongoing call')) {
          console.log('WebRTC Service - Ongoing call detected, attempting cleanup...');
          try {
            // Try to cleanup expired calls
            await callApi.cleanupExpiredCalls();
            console.log('WebRTC Service - Cleanup completed, retrying call creation...');
            callRecord = await callApi.createCall(conversation.id, callType);
            console.log('WebRTC Service - Call record created after cleanup:', callRecord);
          } catch (cleanupError) {
            console.error('WebRTC Service - Cleanup failed:', cleanupError);
            throw error; // Throw original error
          }
        } else {
          throw error; // Re-throw if it's not the ongoing call error
        }
      }
      
      // Ensure any existing local tracks are fully stopped before requesting new media
      try {
        if (this.callState.localStream) {
          this.callState.localStream.getTracks().forEach(t => {
            try { t.stop(); } catch {}
          });
        }
      } catch {}

      // Get user media with fallback for video calls
      console.log('WebRTC Service - Getting user media...');
      let stream: MediaStream;
      let actualCallType = callType;
      
      try {
        if (callType === 'video') {
          // Try to get both audio and video first
          stream = await navigator.mediaDevices.getUserMedia({
            audio: true,
            video: { facingMode: 'user' }
          });
          console.log('WebRTC Service - Got both audio and video streams');
        } else {
          // Audio only call
          stream = await navigator.mediaDevices.getUserMedia({
            audio: true,
            video: false
          });
          console.log('WebRTC Service - Got audio stream');
        }
      } catch (videoError) {
        console.warn('WebRTC Service - Failed to get video stream, falling back to audio only:', videoError);
        
        if (callType === 'video') {
          // For video calls, try audio only as fallback
          try {
            stream = await navigator.mediaDevices.getUserMedia({
              audio: true,
              video: false
            });
            console.log('WebRTC Service - Fallback to audio-only local stream but keep video call UI');
            // Keep call as video but disable local video
            actualCallType = 'video';
          } catch (audioError) {
            console.error('WebRTC Service - Failed to get any media stream:', audioError);
            throw new Error('Could not access microphone. Please check your permissions.');
          }
        } else {
          // For audio calls, this is a real error
          throw new Error('Could not access microphone. Please check your permissions.');
        }
      }
      
      console.log('WebRTC Service - User media obtained');

      this.callState = {
        ...this.callState,
        isInCall: true,
        isCallOutgoing: true,
        localStream: stream,
        calleeId: calleeId,
        callId: callRecord.id,
        callType: actualCallType,
        isVideoEnabled: actualCallType === 'video' && stream.getVideoTracks().length > 0,
        isAudioEnabled: true
      };
      console.log('WebRTC Service - Call state updated:', this.callState);

      // Create peer connection
      console.log('WebRTC Service - Creating peer connection...');
      await this.createPeerConnection();
      console.log('WebRTC Service - Peer connection created');

      // Play local audio
      this.playLocalAudio(stream);

      // Create and send offer
      // If this is a video call but we don't have a local video track, ensure SDP still has a video m-line
      if (this.callState.callType === 'video' && (!this.callState.localStream || this.callState.localStream.getVideoTracks().length === 0)) {
        try {
          this.callState.peerConnection!.addTransceiver('video', { direction: 'recvonly' });
          console.log('WebRTC Service - Added recvonly video transceiver for video call without local camera');
        } catch (e) {
          console.warn('WebRTC Service - Failed to add recvonly video transceiver:', e);
        }
      }

      console.log('WebRTC Service - Creating offer...');
      const offer = await this.callState.peerConnection!.createOffer();
      await this.callState.peerConnection!.setLocalDescription(offer);
      console.log('WebRTC Service - Offer created and set as local description');

      // Send call request via WebSocket
      const callEvent: CallEvent = {
        type: 'call_outgoing',
        callId: callRecord.id,
        callerId: websocketService.getCurrentUserId() || '',
        calleeId: calleeId,
        offer: offer,
        callType: actualCallType
      };
      console.log('WebRTC Service - Sending call event with offer:', callEvent);
      websocketService.sendCallEvent(callEvent);

      // Also trigger local event handler for UI update, but ensure UI knows actual type
      console.log('WebRTC Service - Triggering local call_outgoing event');
      this.handleCallEvent(callEvent);

      // Set timeout for call (60 seconds)
      this.callTimeout = setTimeout(() => {
        if (this.callState.isCallOutgoing && !this.callState.isCallActive) {
          console.log('Call timeout - ending call after 60 seconds');
          this.endCall();
        }
      }, 60000);

    } catch (error) {
      console.error('WebRTC Service - Failed to start call:', error);
      throw error;
    }
  }

  async acceptCall(): Promise<void> {
    if (!this.callState.isCallIncoming || !this.callState.callId) {
      throw new Error('No incoming call to accept');
    }

    try {
      // Update call status to ongoing
      await callApi.updateCallStatus(this.callState.callId, 'ongoing');
      
      // Ensure any existing local tracks are fully stopped before requesting new media
      try {
        if (this.callState.localStream) {
          this.callState.localStream.getTracks().forEach(t => {
            try { t.stop(); } catch {}
          });
        }
      } catch {}

      // Get user media with fallback for video calls
      let stream: MediaStream;
      try {
        if (this.callState.callType === 'video') {
          // Try to get both audio and video first
          stream = await navigator.mediaDevices.getUserMedia({
            audio: true,
            video: { facingMode: 'user' }
          });
          console.log('WebRTC Service - Got both audio and video streams');
        } else {
          // Audio only call
          stream = await navigator.mediaDevices.getUserMedia({
            audio: true,
            video: false
          });
          console.log('WebRTC Service - Got audio stream');
        }
      } catch (videoError) {
        console.warn('WebRTC Service - Failed to get video stream, falling back to audio only:', videoError);
        
        if (this.callState.callType === 'video') {
          // For video calls, try audio only as fallback
          try {
            stream = await navigator.mediaDevices.getUserMedia({
              audio: true,
              video: false
            });
            console.log('WebRTC Service - Fallback to audio-only local stream; keep video call UI');
            // Keep call as video but without local camera
            this.callState.isVideoEnabled = false;
          } catch (audioError) {
            console.error('WebRTC Service - Failed to get any media stream:', audioError);
            throw new Error('Could not access microphone. Please check your permissions.');
          }
        } else {
          // For audio calls, this is a real error
          throw new Error('Could not access microphone. Please check your permissions.');
        }
      }

      this.callState.localStream = stream;
      await this.createPeerConnection();

      // Play local audio
      this.playLocalAudio(stream);

      // If we have a pending offer, set it as remote description and create answer
      if (this.callState.pendingOffer) {
        // Ensure a recvonly video transceiver exists BEFORE setting remote description
        if (this.callState.callType === 'video' && (!this.callState.localStream || this.callState.localStream.getVideoTracks().length === 0)) {
          try {
            const existingVideo = this.callState.peerConnection!.getTransceivers().some(t => t.receiver.track && t.receiver.track.kind === 'video');
            if (!existingVideo) {
              this.callState.peerConnection!.addTransceiver('video', { direction: 'recvonly' });
              console.log('WebRTC Service - Pre-added recvonly video transceiver before setRemoteDescription');
            }
          } catch (e) {
            console.warn('WebRTC Service - Failed to pre-add recvonly transceiver on accept:', e);
          }
        }

        console.log('WebRTC Service - Setting pending offer as remote description...');
        await this.callState.peerConnection!.setRemoteDescription(this.callState.pendingOffer);
        console.log('WebRTC Service - Remote description set');

        // Process any pending ICE candidates
        await this.processPendingIceCandidates();
        
        console.log('WebRTC Service - Creating answer...');
        const answer = await this.callState.peerConnection!.createAnswer();
        await this.callState.peerConnection!.setLocalDescription(answer);
        console.log('WebRTC Service - Answer created and set as local description');

        // Mark call as active on callee side once local description is set
        this.callState = {
          ...this.callState,
          isCallIncoming: false,
          isCallOutgoing: false,
          isCallActive: true
        };

        // Send call accepted with answer via WebSocket
        websocketService.sendCallEvent({
          type: 'call_accepted',
          callId: this.callState.callId,
          callerId: this.callState.callerId || '',
          calleeId: websocketService.getCurrentUserId() || '',
          answer: answer,
          callType: this.callState.callType
        });
        
        // Clear pending offer
        this.callState.pendingOffer = undefined;
      } else {
        console.log('WebRTC Service - No pending offer, sending call accepted without answer');
        
        // Send call accepted without answer
      websocketService.sendCallEvent({
        type: 'call_accepted',
        callId: this.callState.callId,
        callerId: this.callState.callerId || '',
        calleeId: websocketService.getCurrentUserId() || '',
        callType: this.callState.callType
      });
      }

    } catch (error) {
      console.error('Failed to accept call:', error);
      throw error;
    }
  }

  async rejectCall(): Promise<void> {
    if (!this.callState.isCallIncoming || !this.callState.callId) {
      throw new Error('No incoming call to reject');
    }

    try {
      // Update call status to rejected
      await callApi.updateCallStatus(this.callState.callId, 'canceled');
      
      // Send call rejected via WebSocket
      websocketService.sendCallEvent({
        type: 'call_rejected',
        callId: this.callState.callId,
        callerId: this.callState.callerId || '',
        calleeId: websocketService.getCurrentUserId() || ''
      });

      this.endCall();
    } catch (error) {
      console.error('Failed to reject call:', error);
      throw error;
    }
  }

  async endCall(broadcast: boolean = true): Promise<void> {
    const prevCallId = this.callState.callId;
    const prevCallerId = this.callState.callerId;
    const prevCalleeId = this.callState.calleeId;
    // Clear any pending timeouts
    if (this.callTimeout) {
      clearTimeout(this.callTimeout);
      this.callTimeout = null;
    }

    // Stop audio
    this.stopAudio();

    if (this.callState.callId) {
      const callId = this.callState.callId;
      const calleeId = this.callState.calleeId || '';
      const callerId = this.callState.callerId || websocketService.getCurrentUserId() || '';
      // Only notify the peer if this side initiated the end
      if (broadcast) {
        try {
          websocketService.sendCallEvent({
            type: 'call_ended',
            callId,
            callerId,
            calleeId
          });
        } catch (e) {
          console.error('Failed to send call_ended event:', e);
        }
      }

      // Best-effort backend update
      try {
        await callApi.endCall(callId);
      } catch (error) {
        console.error('Failed to update call end status on server:', error);
      }
    }

    // Clean up
    if (this.callState.localStream) {
      this.callState.localStream.getTracks().forEach(track => track.stop());
    }

    if (this.callState.peerConnection) {
      this.callState.peerConnection.close();
    }

    this.callState = {
      isInCall: false,
      isCallActive: false,
      isCallIncoming: false,
      isCallOutgoing: false,
      callId: null,
      callerId: null,
      calleeId: null,
      localStream: null,
      remoteStream: null,
      peerConnection: null,
      pendingIceCandidates: [],
      callType: 'audio',
      isVideoEnabled: false,
      isAudioEnabled: true
    };

    this.stopRingtone();

    // Immediately notify local handlers so UI closes without waiting for network
    try {
      if (prevCallId) {
        const localEvent: CallEvent = {
          type: 'call_ended',
          callId: prevCallId,
          callerId: prevCallerId || websocketService.getCurrentUserId() || '',
          calleeId: prevCalleeId || ''
        };
        this.callHandlers.forEach((handler) => handler(localEvent));
      }
    } catch {}
  }

  private async createPeerConnection(): Promise<void> {
    const configuration = {
      iceServers: [
        { urls: 'stun:stun.l.google.com:19302' },
        { urls: 'stun:stun1.l.google.com:19302' }
      ]
    };

    this.callState.peerConnection = new RTCPeerConnection(configuration);

    // Add local stream
    if (this.callState.localStream) {
      this.callState.localStream.getTracks().forEach(track => {
        this.callState.peerConnection!.addTrack(track, this.callState.localStream!);
      });
    }

    // Handle remote stream
    this.callState.peerConnection.ontrack = (event) => {
      console.log('WebRTC Service - Remote stream received:', event.streams[0]);
      this.callState.remoteStream = event.streams[0];
      
      // Play remote audio
      this.playRemoteAudio(event.streams[0]);
    };

    // Close UI when connection is closed/disconnected by peer
    this.callState.peerConnection.onconnectionstatechange = () => {
      const state = this.callState.peerConnection?.connectionState;
      if (state === 'disconnected' || state === 'failed' || state === 'closed') {
        // Peer hung up or connection dropped; cleanup locally without rebroadcast
        this.endCall(false).catch(() => {});
      }
    };

    // Handle ICE candidates
    this.callState.peerConnection.onicecandidate = (event) => {
      if (event.candidate) {
        // Send ICE candidate via WebSocket
        websocketService.sendCallEvent({
          type: 'ice_candidate',
          callId: this.callState.callId!,
          callerId: this.callState.callerId || '',
          calleeId: this.callState.calleeId || '',
          data: event.candidate
        });
      }
    };
  }

  private playLocalAudio(stream: MediaStream): void {
    try {
      // Find or create local audio element
      let localAudio = document.getElementById('local-audio') as HTMLAudioElement;
      if (!localAudio) {
        localAudio = document.createElement('audio');
        localAudio.id = 'local-audio';
        localAudio.muted = true; // Mute local audio to prevent feedback
        localAudio.autoplay = true;
        document.body.appendChild(localAudio);
      }
      
      localAudio.srcObject = stream;
      localAudio.play().catch(error => {
        console.log('Could not play local audio:', error);
      });
      
      console.log('WebRTC Service - Local audio playing');
    } catch (error) {
      console.error('Error playing local audio:', error);
    }
  }

  private playRemoteAudio(stream: MediaStream): void {
    try {
      // Find or create remote audio element
      let remoteAudio = document.getElementById('remote-audio') as HTMLAudioElement;
      if (!remoteAudio) {
        remoteAudio = document.createElement('audio');
        remoteAudio.id = 'remote-audio';
        remoteAudio.autoplay = true;
        remoteAudio.volume = 1.0;
        remoteAudio.muted = false;
        remoteAudio.controls = false;
        remoteAudio.style.display = 'none';
        document.body.appendChild(remoteAudio);
        console.log('WebRTC Service - Created remote audio element');
      }
      
      remoteAudio.srcObject = stream;
      
      // Try to play with user interaction fallback
      const playPromise = remoteAudio.play();
      if (playPromise !== undefined) {
        playPromise.then(() => {
          console.log('WebRTC Service - Remote audio playing successfully');
        }).catch(error => {
          console.log('Could not play remote audio automatically:', error);
          // Try to resume AudioContext if suspended
          try {
            const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
            if (audioContext.state === 'suspended') {
              audioContext.resume().then(() => {
                console.log('AudioContext resumed for remote audio');
                remoteAudio.play().catch(e => console.log('Still cannot play remote audio:', e));
              });
            }
          } catch (e) {
            console.log('Could not resume AudioContext:', e);
          }
        });
      }
      
      console.log('WebRTC Service - Remote audio setup complete, stream tracks:', stream.getAudioTracks().length);
      
      // Debug audio state after setup
      setTimeout(() => {
        this.debugAudioState();
      }, 1000);
    } catch (error) {
      console.error('Error playing remote audio:', error);
    }
  }

  private stopAudio(): void {
    try {
      const localAudio = document.getElementById('local-audio') as HTMLAudioElement;
      const remoteAudio = document.getElementById('remote-audio') as HTMLAudioElement;
      
      if (localAudio) {
        localAudio.pause();
        localAudio.srcObject = null;
      }
      
      if (remoteAudio) {
        remoteAudio.pause();
        remoteAudio.srcObject = null;
      }
      
      console.log('WebRTC Service - Audio stopped');
    } catch (error) {
      console.error('Error stopping audio:', error);
    }
  }

  async handleIncomingOffer(offer: RTCSessionDescriptionInit): Promise<void> {
    if (!this.callState.peerConnection) {
      throw new Error('No peer connection available');
    }

    console.log('WebRTC Service - Handling incoming offer:', offer);
    await this.callState.peerConnection.setRemoteDescription(offer);
    console.log('WebRTC Service - Remote description set');
    
    // Process any pending ICE candidates
    await this.processPendingIceCandidates();
  }

  async handleIncomingAnswer(answer: RTCSessionDescriptionInit): Promise<void> {
    if (!this.callState.peerConnection) {
      throw new Error('No peer connection available');
    }

    console.log('WebRTC Service - Handling incoming answer:', answer);
    await this.callState.peerConnection.setRemoteDescription(answer);
    console.log('WebRTC Service - Remote description set');
    
    // Process any pending ICE candidates
    await this.processPendingIceCandidates();
  }

  async createAnswerAfterOffer(): Promise<void> {
    if (!this.callState.peerConnection) {
      throw new Error('No peer connection available');
    }

    if (this.callState.peerConnection.signalingState === 'have-remote-offer') {
      console.log('WebRTC Service - Creating answer after offer...');
      const answer = await this.callState.peerConnection.createAnswer();
      await this.callState.peerConnection.setLocalDescription(answer);
      console.log('WebRTC Service - Answer created and set as local description');

      // Send answer via WebSocket
      websocketService.sendCallEvent({
        type: 'answer',
        callId: this.callState.callId!,
        callerId: this.callState.callerId || '',
        calleeId: this.callState.calleeId || '',
        answer: answer
      });
    }
  }

  async handleIncomingIceCandidate(candidate: RTCIceCandidateInit): Promise<void> {
    if (!this.callState.peerConnection) {
      console.log('WebRTC Service - No peer connection available, queueing ICE candidate');
      this.callState.pendingIceCandidates.push(candidate);
      return;
    }

    console.log('WebRTC Service - Handling incoming ICE candidate:', candidate);
    
    try {
      await this.callState.peerConnection.addIceCandidate(candidate);
      console.log('WebRTC Service - ICE candidate added');
    } catch (error) {
      console.log('WebRTC Service - Failed to add ICE candidate, queueing it:', error);
      this.callState.pendingIceCandidates.push(candidate);
    }
  }

  private async processPendingIceCandidates(): Promise<void> {
    if (!this.callState.peerConnection) {
      console.log('WebRTC Service - No peer connection available for processing pending ICE candidates');
      return;
    }

    console.log('WebRTC Service - Processing pending ICE candidates:', this.callState.pendingIceCandidates.length);
    
    for (const candidate of this.callState.pendingIceCandidates) {
      try {
        await this.callState.peerConnection.addIceCandidate(candidate);
        console.log('WebRTC Service - Pending ICE candidate added:', candidate);
      } catch (error) {
        console.log('WebRTC Service - Failed to add pending ICE candidate:', error);
      }
    }
    
    // Clear the queue
    this.callState.pendingIceCandidates = [];
    console.log('WebRTC Service - All pending ICE candidates processed');
  }

  private async getOrCreateConversation(userId: string): Promise<any> {
    try {
      const conversation = await chatApi.getOrCreateDirectConversation(userId);
      return conversation;
    } catch (error) {
      console.error('Failed to get or create conversation:', error);
      throw error;
    }
  }

  // Getters
  getCallState(): CallState {
    return { ...this.callState };
  }

  // Event handlers
  onCallEvent(handler: (event: CallEvent) => void): string {
    const id = Date.now().toString();
    this.callHandlers.set(id, handler);
    return id;
  }

  offCallEvent(handlerId: string): void {
    this.callHandlers.delete(handlerId);
  }

  // Audio controls
  toggleMute(): boolean {
    if (this.callState.localStream) {
      const audioTrack = this.callState.localStream.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
        this.callState.isAudioEnabled = audioTrack.enabled;
        return !audioTrack.enabled;
      }
    }
    return false;
  }

  // Video controls
  toggleVideo(): boolean {
    if (this.callState.localStream) {
      const videoTrack = this.callState.localStream.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = !videoTrack.enabled;
        this.callState.isVideoEnabled = videoTrack.enabled;
        return videoTrack.enabled;
      }
    }
    return false;
  }

  // Switch camera (for video calls)
  async switchCamera(): Promise<void> {
    if (this.callState.callType !== 'video' || !this.callState.localStream) {
      return;
    }

    try {
      const videoTrack = this.callState.localStream.getVideoTracks()[0];
      if (!videoTrack) return;

      // Get all available devices
      const devices = await navigator.mediaDevices.enumerateDevices();
      const videoDevices = devices.filter(device => device.kind === 'videoinput');
      
      if (videoDevices.length < 2) {
        console.log('Only one camera available');
        return;
      }

      // Find current device
      const currentDeviceId = videoTrack.getSettings().deviceId;
      const currentIndex = videoDevices.findIndex(device => device.deviceId === currentDeviceId);
      const nextIndex = (currentIndex + 1) % videoDevices.length;
      const nextDeviceId = videoDevices[nextIndex].deviceId;

      // Stop current video track
      videoTrack.stop();

      // Get new video stream
      const newStream = await navigator.mediaDevices.getUserMedia({
        video: { deviceId: { exact: nextDeviceId } }
      });

      // Replace video track in local stream
      const newVideoTrack = newStream.getVideoTracks()[0];
      const sender = this.callState.peerConnection?.getSenders().find(s => 
        s.track && s.track.kind === 'video'
      );
      
      if (sender) {
        await sender.replaceTrack(newVideoTrack);
      }

      // Update local stream
      this.callState.localStream.removeTrack(videoTrack);
      this.callState.localStream.addTrack(newVideoTrack);

      // Update video element if it exists
      const localVideo = document.getElementById('local-video') as HTMLVideoElement;
      if (localVideo) {
        localVideo.srcObject = this.callState.localStream;
      }

      console.log('Camera switched successfully');
    } catch (error) {
      console.error('Failed to switch camera:', error);
    }
  }

  setVolume(volume: number): void {
    // This would typically be handled by the audio element in the UI
    console.log('Set volume to:', volume);
  }

}

export const webrtcService = new WebRTCService();

// Expose to window for debugging
if (typeof window !== 'undefined') {
  (window as any).webrtcService = webrtcService;
}

export default webrtcService;
