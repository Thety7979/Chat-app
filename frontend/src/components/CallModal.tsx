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
  callerName = 'Unknown'
}) => {
  const [isMuted, setIsMuted] = useState(false);
  const [callDuration, setCallDuration] = useState(0);
  const localAudioRef = useRef<HTMLAudioElement>(null);
  const remoteAudioRef = useRef<HTMLAudioElement>(null);
  const durationIntervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (callState.isCallActive && callState.localStream) {
      if (localAudioRef.current) {
        localAudioRef.current.srcObject = callState.localStream;
        localAudioRef.current.muted = true; // Mute local audio to prevent echo
      }
    }
  }, [callState.isCallActive, callState.localStream]);

  useEffect(() => {
    if (callState.isCallActive && callState.remoteStream) {
      if (remoteAudioRef.current) {
        remoteAudioRef.current.srcObject = callState.remoteStream;
      }
    }
  }, [callState.isCallActive, callState.remoteStream]);

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
          className="relative bg-white rounded-2xl shadow-2xl max-w-md w-full mx-4 overflow-hidden"
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 20 }}
          transition={{ duration: 0.3 }}
        >
          {/* Header */}
          <div className="bg-gradient-to-r from-blue-500 to-purple-600 p-6 text-white text-center">
            <div className="w-20 h-20 bg-white bg-opacity-20 rounded-full mx-auto mb-4 flex items-center justify-center">
              <i className="fas fa-phone text-3xl"></i>
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

          {/* Content */}
          <div className="p-6">
            {/* Call Status */}
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

            {/* Call Controls */}
            <div className="flex justify-center space-x-4">
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


