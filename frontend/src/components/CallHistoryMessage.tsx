import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { CallDTO } from '../types/call';

interface CallHistoryMessageProps {
  call: CallDTO;
  isOutgoing: boolean;
  onCallBack: (callId: string) => void;
}

const CallHistoryMessage: React.FC<CallHistoryMessageProps> = ({ 
  call, 
  isOutgoing, 
  onCallBack 
}) => {
  const [showCallBackPopup, setShowCallBackPopup] = useState(false);

  const formatDuration = (duration: number): string => {
    if (duration < 60) {
      return `${duration}s`;
    }
    const minutes = Math.floor(duration / 60);
    const seconds = duration % 60;
    return `${minutes}m ${seconds}s`;
  };

  const formatCallTime = (date: string): string => {
    const callDate = new Date(date);
    const now = new Date();
    const diffInHours = (now.getTime() - callDate.getTime()) / (1000 * 60 * 60);
    
    if (diffInHours < 1) {
      const diffInMinutes = Math.floor(diffInHours * 60);
      return `${diffInMinutes} phút trước`;
    } else if (diffInHours < 24) {
      const diffInHoursRounded = Math.floor(diffInHours);
      return `${diffInHoursRounded} giờ trước`;
    } else {
      return callDate.toLocaleDateString('vi-VN', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    }
  };

  const getCallStatusText = (): string => {
    switch (call.status) {
      case 'ended':
        return `Cuộc gọi kết thúc • ${formatDuration(call.duration || 0)}`;
      case 'canceled':
        return 'Cuộc gọi bị hủy';
      case 'failed':
        return 'Cuộc gọi thất bại';
      case 'ringing':
        return 'Cuộc gọi đang đổ chuông';
      case 'ongoing':
        return 'Cuộc gọi đang diễn ra';
      default:
        return 'Cuộc gọi';
    }
  };

  const getCallStatusColor = (): string => {
    switch (call.status) {
      case 'ended':
        return 'text-green-600';
      case 'canceled':
        return 'text-gray-500';
      case 'failed':
        return 'text-red-500';
      case 'ringing':
        return 'text-blue-500';
      case 'ongoing':
        return 'text-green-500';
      default:
        return 'text-gray-500';
    }
  };

  const getCallIcon = (): string => {
    switch (call.type) {
      case 'video':
        return 'fas fa-video';
      case 'audio':
      default:
        return 'fas fa-phone';
    }
  };

  const handleCallBack = () => {
    onCallBack(call.id);
    setShowCallBackPopup(false);
  };

  return (
    <div className="relative">
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className={`max-w-[280px] ${isOutgoing ? 'ml-auto' : ''}`}
      >
        <div 
          className={`bg-gray-100 rounded-2xl p-4 cursor-pointer hover:bg-gray-200 transition-colors ${
            isOutgoing ? 'rounded-br-md' : 'rounded-bl-md'
          }`}
          onClick={() => setShowCallBackPopup(true)}
        >
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
              call.status === 'ended' ? 'bg-green-100' : 
              call.status === 'failed' ? 'bg-red-100' : 
              'bg-blue-100'
            }`}>
              <i className={`${getCallIcon()} ${
                call.status === 'ended' ? 'text-green-600' : 
                call.status === 'failed' ? 'text-red-600' : 
                'text-blue-600'
              }`}></i>
            </div>
            
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <i className={`${getCallIcon()} text-sm ${getCallStatusColor()}`}></i>
                <span className={`text-sm font-medium ${getCallStatusColor()}`}>
                  {getCallStatusText()}
                </span>
              </div>
              
              <div className="text-xs text-gray-500">
                {formatCallTime(call.createdAt)}
              </div>
            </div>
            
            <div className="flex items-center gap-1">
              <i className="fas fa-redo text-gray-400 text-sm"></i>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Call Back Popup */}
      {showCallBackPopup && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
          onClick={() => setShowCallBackPopup(false)}
        >
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-2xl p-6 mx-4 max-w-sm w-full"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="text-center">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <i className={`${getCallIcon()} text-2xl text-blue-600`}></i>
              </div>
              
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Gọi lại
              </h3>
              
              <p className="text-sm text-gray-600 mb-6">
                Bạn có muốn gọi lại {isOutgoing ? 'người nhận' : 'người gọi'} không?
              </p>
              
              <div className="flex gap-3">
                <button
                  onClick={() => setShowCallBackPopup(false)}
                  className="flex-1 px-4 py-2 text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  Hủy
                </button>
                <button
                  onClick={handleCallBack}
                  className="flex-1 px-4 py-2 text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Gọi lại
                </button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </div>
  );
};

export default CallHistoryMessage;

