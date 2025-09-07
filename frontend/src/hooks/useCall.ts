import { useState, useEffect, useCallback } from 'react';
import webrtcService, { CallState, CallEvent } from '../services/webrtcService';
import { useAuth } from '../contexts/AuthContext';
import chatApi from '../api/chatApi';

export const useCall = () => {
  const { user } = useAuth();
  const [callState, setCallState] = useState<CallState>(webrtcService.getCallState());
  const [isCallModalOpen, setIsCallModalOpen] = useState(false);
  const [callerName, setCallerName] = useState<string>('');
  const [callerInfo, setCallerInfo] = useState<{name: string, avatar?: string} | null>(null);
  const [showIncomingCallNotification, setShowIncomingCallNotification] = useState(false);

  // Update call state when WebRTC service state changes
  useEffect(() => {
    const updateCallState = () => {
      setCallState(webrtcService.getCallState());
    };

    // Update immediately
    updateCallState();

    // Set up interval to check for state changes
    const interval = setInterval(updateCallState, 100);

    return () => clearInterval(interval);
  }, []);

  // Handle call events
  useEffect(() => {
    const handleCallEvent = async (event: CallEvent) => {
      console.log('useCall Hook - Call event received:', event);
      console.log('useCall Hook - Event type:', event.type);
      console.log('useCall Hook - Event data:', JSON.stringify(event, null, 2));
      
      switch (event.type) {
        case 'call_incoming':
          console.log('useCall Hook - Processing incoming call for caller:', event.callerId);
          console.log('useCall Hook - Current user ID:', user?.id);
          console.log('useCall Hook - Caller ID from event:', event.callerId);
          console.log('useCall Hook - Callee ID from event:', event.calleeId);
          
          // Fetch caller information
          try {
            console.log('useCall Hook - Fetching conversation for caller:', event.callerId);
            const conversation = await chatApi.getOrCreateDirectConversation(event.callerId);
            console.log('useCall Hook - Conversation fetched:', conversation);
            const caller = conversation.members.find(member => member.userId === event.callerId);
            console.log('useCall Hook - Caller found:', caller);
            
            if (caller) {
              const displayName = caller.displayName || caller.username || 'Unknown';
              console.log('useCall Hook - Setting caller info:', { displayName, avatar: caller.avatarUrl });
              setCallerInfo({
                name: displayName,
                avatar: caller.avatarUrl
              });
              setCallerName(displayName);
            } else {
              console.log('useCall Hook - Caller not found, using caller ID');
              setCallerInfo({ name: event.callerId });
              setCallerName(event.callerId);
            }
          } catch (error) {
            console.error('useCall Hook - Failed to fetch caller info:', error);
            setCallerInfo({ name: event.callerId });
            setCallerName(event.callerId);
          }
          console.log('useCall Hook - Setting showIncomingCallNotification to true');
          setShowIncomingCallNotification(true);
          break;
        case 'call_outgoing':
          console.log('useCall Hook - Processing outgoing call for callee:', event.calleeId);
          // For outgoing calls, we need to fetch the callee's information
          try {
            const conversation = await chatApi.getOrCreateDirectConversation(event.calleeId);
            const callee = conversation.members.find(member => member.userId === event.calleeId);
            if (callee) {
              const displayName = callee.displayName || callee.username || 'Unknown';
              setCallerName(displayName);
            } else {
              setCallerName(event.calleeId);
            }
          } catch (error) {
            console.error('Failed to fetch callee info:', error);
            setCallerName(event.calleeId);
          }
          console.log('useCall Hook - Setting isCallModalOpen to true');
          setIsCallModalOpen(true);
          break;
        case 'call_accepted':
          console.log('useCall Hook - Processing call accepted event');
          console.log('useCall Hook - Current user ID:', user?.id);
          console.log('useCall Hook - Caller ID from event:', event.callerId);
          console.log('useCall Hook - Callee ID from event:', event.calleeId);
          setShowIncomingCallNotification(false);
          setIsCallModalOpen(true);
          break;
        case 'call_rejected':
        case 'call_ended':
        case 'call_failed':
          console.log('useCall Hook - Processing call event:', event.type);
          console.log('useCall Hook - Current user ID:', user?.id);
          console.log('useCall Hook - Caller ID from event:', event.callerId);
          console.log('useCall Hook - Callee ID from event:', event.calleeId);
          setIsCallModalOpen(false);
          setShowIncomingCallNotification(false);
          setCallerName('');
          setCallerInfo(null);
          break;
      }
    };

    const handlerId = webrtcService.onCallEvent(handleCallEvent);

    return () => {
      webrtcService.offCallEvent(handlerId);
    };
  }, []);

  // Call actions
  const startCall = useCallback(async (calleeId: string) => {
    try {
      console.log('useCall Hook - Starting call to:', calleeId);
      await webrtcService.startCall(calleeId);
      console.log('useCall Hook - Call started successfully');
      
      // Fetch callee information for display
      try {
        const conversation = await chatApi.getOrCreateDirectConversation(calleeId);
        const callee = conversation.members.find(member => member.userId === calleeId);
        if (callee) {
          const displayName = callee.displayName || callee.username || 'Unknown';
          setCallerName(displayName);
        } else {
          setCallerName(calleeId);
        }
      } catch (error) {
        console.error('Failed to fetch callee info:', error);
        setCallerName(calleeId);
      }
      
      console.log('useCall Hook - Setting isCallModalOpen to true for outgoing call');
      setIsCallModalOpen(true);
    } catch (error) {
      console.error('useCall Hook - Failed to start call:', error);
      throw error;
    }
  }, []);

  const acceptCall = useCallback(async () => {
    try {
      // Hide the incoming call notification immediately
      setShowIncomingCallNotification(false);
      await webrtcService.acceptCall();
    } catch (error) {
      console.error('Failed to accept call:', error);
      throw error;
    }
  }, []);

  const rejectCall = useCallback(async () => {
    try {
      await webrtcService.rejectCall();
      setIsCallModalOpen(false);
      setShowIncomingCallNotification(false);
      setCallerName('');
      setCallerInfo(null);
    } catch (error) {
      console.error('Failed to reject call:', error);
      throw error;
    }
  }, []);

  const endCall = useCallback(async () => {
    try {
      await webrtcService.endCall();
      setIsCallModalOpen(false);
      setShowIncomingCallNotification(false);
      setCallerName('');
      setCallerInfo(null);
    } catch (error) {
      console.error('Failed to end call:', error);
      throw error;
    }
  }, []);

  const toggleMute = useCallback(() => {
    webrtcService.toggleMute();
  }, []);

  const closeCallModal = useCallback(() => {
    setIsCallModalOpen(false);
  }, []);

  return {
    callState,
    isCallModalOpen,
    callerName,
    callerInfo,
    showIncomingCallNotification,
    startCall,
    acceptCall,
    rejectCall,
    endCall,
    toggleMute,
    closeCallModal
  };
};


