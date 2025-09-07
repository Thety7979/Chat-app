import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../contexts/AuthContext';

interface IncomingCallNotificationProps {
  isVisible: boolean;
  callerName: string;
  callerAvatar?: string;
  onAccept: () => void;
  onReject: () => void;
}

const IncomingCallNotification: React.FC<IncomingCallNotificationProps> = ({
  isVisible,
  callerName,
  callerAvatar,
  onAccept,
  onReject
}) => {
  const { user } = useAuth();
  const [timeElapsed, setTimeElapsed] = useState(0);
  const [audio, setAudio] = useState<HTMLAudioElement | null>(null);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isVisible) {
      setTimeElapsed(0);
      interval = setInterval(() => {
        setTimeElapsed(prev => prev + 1);
      }, 1000);

      // Play incoming call sound using Web Audio API
      const playIncomingCallSound = () => {
        try {
          // Create a simple beep sound using Web Audio API
          const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
          
          // Resume audio context if suspended
          if (audioContext.state === 'suspended') {
            audioContext.resume().then(() => {
              console.log('AudioContext resumed for incoming call sound');
            });
          }
          
          const oscillator = audioContext.createOscillator();
          const gainNode = audioContext.createGain();
          
          oscillator.connect(gainNode);
          gainNode.connect(audioContext.destination);
          
          // Create a phone ring-like sound
          oscillator.frequency.setValueAtTime(800, audioContext.currentTime);
          oscillator.frequency.setValueAtTime(600, audioContext.currentTime + 0.1);
          oscillator.frequency.setValueAtTime(800, audioContext.currentTime + 0.2);
          
          oscillator.type = 'sine';
          
          gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
          gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3);
          
          oscillator.start(audioContext.currentTime);
          oscillator.stop(audioContext.currentTime + 0.3);
        } catch (error) {
          console.log('Could not play incoming call sound:', error);
        }
      };

      // Play sound immediately and then every 2 seconds
      playIncomingCallSound();
      const soundInterval = setInterval(playIncomingCallSound, 2000);

      return () => {
        if (interval) clearInterval(interval);
        if (soundInterval) clearInterval(soundInterval);
      };
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isVisible]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  if (!isVisible) return null;

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      >
        <motion.div
          className="bg-white rounded-2xl p-6 max-w-sm w-full mx-4 shadow-2xl"
          initial={{ scale: 0.8, opacity: 0, y: 50 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.8, opacity: 0, y: 50 }}
          transition={{ type: "spring", damping: 20, stiffness: 300 }}
        >
          {/* Caller Info */}
          <div className="text-center mb-6">
            <div className="relative mx-auto mb-4">
              <img
                src={callerAvatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(callerName)}&background=3b82f6&color=ffffff&size=80`}
                alt={callerName}
                className="w-20 h-20 rounded-full object-cover mx-auto border-4 border-blue-500"
              />
              <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-green-500 rounded-full border-2 border-white"></div>
            </div>
            
            <h3 className="text-xl font-bold text-gray-900 mb-1">
              {callerName}
            </h3>
            <p className="text-gray-600 text-sm">
              Cuộc gọi thoại đến
            </p>
            <p className="text-gray-500 text-xs mt-1">
              {formatTime(timeElapsed)}
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-center gap-6">
            {/* Reject Button */}
            <motion.button
              className="w-14 h-14 bg-red-500 rounded-full flex items-center justify-center text-white shadow-lg"
              onClick={onReject}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              title="Từ chối"
            >
              <i className="fas fa-phone-slash text-lg"></i>
            </motion.button>

            {/* Accept Button */}
            <motion.button
              className="w-14 h-14 bg-green-500 rounded-full flex items-center justify-center text-white shadow-lg"
              onClick={onAccept}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              title="Chấp nhận"
            >
              <i className="fas fa-phone text-lg"></i>
            </motion.button>
          </div>

          {/* Additional Info */}
          <div className="mt-4 text-center">
            <p className="text-xs text-gray-500">
              Vuốt lên để trả lời, vuốt xuống để từ chối
            </p>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default IncomingCallNotification;
