import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import webrtcService, { CallState, CallEvent } from '../services/webrtcService';

interface CallModalProps {
  isOpen: boolean;
  onClose: () => void;
  callState: CallState;
  onAcceptCall: () => void;
  onRejectCall: () => void;
  onEndCall: () => void;
  onToggleMute: () => void;
  onToggleVideo?: () => void;
  onSwitchCamera?: () => void;
  callerName?: string;
}

const CallModal: React.FC<CallModalProps> = ({
  isOpen,
  onClose,
  callState,
  onAcceptCall,
  onRejectCall,
  onEndCall,
  onToggleMute,
  onToggleVideo,
  onSwitchCamera,
  callerName = 'Unknown'
}) => {
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoEnabled, setIsVideoEnabled] = useState(false);
  const [callDuration, setCallDuration] = useState(0);
  const localAudioRef = useRef<HTMLAudioElement>(null);
  const remoteAudioRef = useRef<HTMLAudioElement>(null);
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const durationIntervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (callState.isCallActive && callState.localStream) {
      if (localAudioRef.current) {
        localAudioRef.current.srcObject = callState.localStream;
        localAudioRef.current.muted = true; // Mute local audio to prevent echo
      }
      
      // Handle video stream for video calls
      if (callState.callType === 'video' && localVideoRef.current) {
        localVideoRef.current.srcObject = callState.localStream;
      }
    }
  }, [callState.isCallActive, callState.localStream, callState.callType]);

  useEffect(() => {
    if (callState.isCallActive && callState.remoteStream) {
      if (remoteAudioRef.current) {
        remoteAudioRef.current.srcObject = callState.remoteStream;
      }
      
      // Handle remote video stream for video calls
      if (callState.callType === 'video' && remoteVideoRef.current) {
        remoteVideoRef.current.srcObject = callState.remoteStream;
      }
    }
  }, [callState.isCallActive, callState.remoteStream, callState.callType]);

  useEffect(() => {
    if (callState.isCallActive) {
      // Start call duration timer
      setCallDuration(0);
      durationIntervalRef.current = setInterval(() => {
        setCallDuration(prev => prev + 1);
      }, 1000);
    } else {
      // Stop call duration timer
      if (durationIntervalRef.current) {
        clearInterval(durationIntervalRef.current);
        durationIntervalRef.current = null;
      }
      setCallDuration(0);
    }

    return () => {
      if (durationIntervalRef.current) {
        clearInterval(durationIntervalRef.current);
      }
    };
  }, [callState.isCallActive]);

  const formatDuration = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleToggleMute = () => {
    const newMutedState = webrtcService.toggleMute();
    setIsMuted(newMutedState);
    onToggleMute();
  };

  const handleToggleVideo = () => {
    if (onToggleVideo) {
      const newVideoState = webrtcService.toggleVideo();
      setIsVideoEnabled(newVideoState);
      onToggleVideo();
    }
  };

  const handleSwitchCamera = () => {
    if (onSwitchCamera) {
      webrtcService.switchCamera();
      onSwitchCamera();
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center">
        {/* Backdrop */}
        <motion.div
          className="absolute inset-0 bg-black bg-opacity-50"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
        />
        
        {/* Call Modal */}
        <motion.div
          className={`relative bg-white rounded-2xl shadow-2xl mx-4 overflow-hidden ${
            callState.callType === 'video' && callState.isCallActive 
              ? 'max-w-4xl w-full h-[80vh]' 
              : 'max-w-md w-full'
          }`}
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 20 }}
          transition={{ duration: 0.3 }}
        >
          {/* Header - Only show for audio calls or when call is not active */}
          {(!callState.isCallActive || callState.callType === 'audio') && (
            <div className="bg-gradient-to-r from-blue-500 to-purple-600 p-6 text-white text-center">
              <div className="w-20 h-20 bg-white bg-opacity-20 rounded-full mx-auto mb-4 flex items-center justify-center">
                <i className={`fas ${callState.callType === 'video' ? 'fa-video' : 'fa-phone'} text-3xl`}></i>
              </div>
              <h2 className="text-xl font-semibold mb-2">
                {callState.isCallIncoming ? 'Cuộc gọi đến' : 
                 callState.isCallOutgoing ? 'Đang gọi...' : 
                 'Đang gọi'}
              </h2>
              <p className="text-blue-100">{callerName}</p>
              {callState.isCallActive && (
                <p className="text-blue-100 text-sm mt-2">
                  {formatDuration(callDuration)}
                </p>
              )}
            </div>
          )}

          {/* Video Content for Video Calls */}
          {callState.callType === 'video' && callState.isCallActive && (
            <div className="relative h-full flex">
              {/* Remote Video - Main View */}
              <div className="flex-1 relative bg-black">
                <video
                  ref={remoteVideoRef}
                  autoPlay
                  playsInline
                  className="w-full h-full object-cover"
                />
                {/* Remote video placeholder if no stream */}
                {!callState.remoteStream && (
                  <div className="absolute inset-0 flex items-center justify-center bg-gray-800">
                    <div className="text-center text-white">
                      <div className="w-20 h-20 bg-gray-600 rounded-full mx-auto mb-4 flex items-center justify-center">
                        <i className="fas fa-user text-2xl"></i>
                      </div>
                      <p className="text-lg font-semibold">{callerName}</p>
                      <p className="text-sm text-gray-300">Đang kết nối video...</p>
                    </div>
                  </div>
                )}
                
                {/* Call Duration Overlay */}
                <div className="absolute top-4 left-4 bg-black bg-opacity-50 text-white px-3 py-1 rounded-full text-sm">
                  {formatDuration(callDuration)}
                </div>
              </div>

              {/* Local Video - Picture in Picture */}
              <div className="absolute top-4 right-4 w-32 h-24 bg-black rounded-lg overflow-hidden border-2 border-white shadow-lg">
                <video
                  ref={localVideoRef}
                  autoPlay
                  playsInline
                  muted
                  className="w-full h-full object-cover"
                />
                {/* Local video placeholder if no stream */}
                {!callState.localStream && (
                  <div className="w-full h-full flex items-center justify-center bg-gray-600">
                    <i className="fas fa-user text-white"></i>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Content */}
          <div className={`${callState.callType === 'video' && callState.isCallActive ? 'absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-black to-transparent' : 'p-6'}`}>
            {/* Call Status - Only for audio calls or when call is not active */}
            {(!callState.isCallActive || callState.callType === 'audio') && (
              <div className="text-center mb-6">
              {callState.isCallIncoming && (
                <div className="flex items-center justify-center space-x-2 text-gray-600">
                  <div className="animate-pulse">
                    <i className="fas fa-phone text-2xl text-green-500"></i>
                  </div>
                  <span>Cuộc gọi đến từ {callerName}</span>
                </div>
              )}
              
              {callState.isCallOutgoing && (
                <div className="flex items-center justify-center space-x-2 text-gray-600">
                  <div className="animate-spin">
                    <i className="fas fa-phone text-2xl text-blue-500"></i>
                  </div>
                  <span>Đang gọi {callerName}...</span>
                </div>
              )}

              {callState.isCallActive && (
                <div className="flex items-center justify-center space-x-2 text-gray-600">
                  <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                  <span>Đang gọi với {callerName}</span>
                </div>
              )}
              </div>
            )}

            {/* Call Controls */}
            <div className={`flex justify-center space-x-4 ${callState.callType === 'video' && callState.isCallActive ? 'text-white' : ''}`}>
              {callState.isCallIncoming && (
                <>
                  {/* Reject Button */}
                  <motion.button
                    className="w-16 h-16 bg-red-500 hover:bg-red-600 rounded-full flex items-center justify-center text-white shadow-lg"
                    onClick={onRejectCall}
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                  >
                    <i className="fas fa-phone-slash text-xl"></i>
                  </motion.button>

                  {/* Accept Button */}
                  <motion.button
                    className="w-16 h-16 bg-green-500 hover:bg-green-600 rounded-full flex items-center justify-center text-white shadow-lg"
                    onClick={onAcceptCall}
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                  >
                    <i className="fas fa-phone text-xl"></i>
                  </motion.button>
                </>
              )}

              {callState.isCallOutgoing && (
                <motion.button
                  className="w-16 h-16 bg-red-500 hover:bg-red-600 rounded-full flex items-center justify-center text-white shadow-lg"
                  onClick={onEndCall}
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                >
                  <i className="fas fa-phone-slash text-xl"></i>
                </motion.button>
              )}

              {callState.isCallActive && (
                <>
                  {/* Mute Button */}
                  <motion.button
                    className={`w-16 h-16 rounded-full flex items-center justify-center text-white shadow-lg ${
                      isMuted ? 'bg-red-500 hover:bg-red-600' : 'bg-gray-500 hover:bg-gray-600'
                    }`}
                    onClick={handleToggleMute}
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                  >
                    <i className={`fas ${isMuted ? 'fa-microphone-slash' : 'fa-microphone'} text-xl`}></i>
                  </motion.button>

                  {/* Video Toggle Button - Only for video calls */}
                  {callState.callType === 'video' && (
                    <motion.button
                      className={`w-16 h-16 rounded-full flex items-center justify-center text-white shadow-lg ${
                        callState.isVideoEnabled ? 'bg-gray-500 hover:bg-gray-600' : 'bg-red-500 hover:bg-red-600'
                      }`}
                      onClick={handleToggleVideo}
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                    >
                      <i className={`fas ${callState.isVideoEnabled ? 'fa-video' : 'fa-video-slash'} text-xl`}></i>
                    </motion.button>
                  )}

                  {/* Switch Camera Button - Only for video calls */}
                  {callState.callType === 'video' && callState.isVideoEnabled && (
                    <motion.button
                      className="w-16 h-16 bg-gray-500 hover:bg-gray-600 rounded-full flex items-center justify-center text-white shadow-lg"
                      onClick={handleSwitchCamera}
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                    >
                      <i className="fas fa-sync-alt text-xl"></i>
                    </motion.button>
                  )}

                  {/* End Call Button */}
                  <motion.button
                    className="w-16 h-16 bg-red-500 hover:bg-red-600 rounded-full flex items-center justify-center text-white shadow-lg"
                    onClick={onEndCall}
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                  >
                    <i className="fas fa-phone-slash text-xl"></i>
                  </motion.button>
                </>
              )}
            </div>
          </div>

          {/* Audio Elements (Hidden) */}
          <audio
            ref={localAudioRef}
            autoPlay
            playsInline
            style={{ display: 'none' }}
          />
          <audio
            ref={remoteAudioRef}
            autoPlay
            playsInline
            style={{ display: 'none' }}
          />
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default CallModal;


