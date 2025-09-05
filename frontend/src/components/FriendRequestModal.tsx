import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useFriends } from '../hooks/useFriends';
import { FriendRequest, RespondFriendRequestRequest } from '../types/friend';

interface FriendRequestModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const FriendRequestModal: React.FC<FriendRequestModalProps> = ({ isOpen, onClose }) => {
  const { receivedRequests, respondToFriendRequest, isLoading } = useFriends();
  const [processingRequest, setProcessingRequest] = useState<string | null>(null);

  const handleRespond = async (requestId: string, status: 'accepted' | 'declined') => {
    try {
      setProcessingRequest(requestId);
      const response: RespondFriendRequestRequest = {
        requestId,
        status
      };
      await respondToFriendRequest(response);
    } catch (error) {
      console.error('Failed to respond to friend request:', error);
    } finally {
      setProcessingRequest(null);
    }
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 1) {
      return 'Vừa xong';
    } else if (diffInHours < 24) {
      return `${diffInHours} giờ trước`;
    } else {
      const diffInDays = Math.floor(diffInHours / 24);
      return `${diffInDays} ngày trước`;
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
        >
          <motion.div
            className="bg-white rounded-lg shadow-xl max-w-md w-full max-h-[80vh] overflow-hidden"
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="p-4 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-gray-900">
                  Lời mời kết bạn
                </h2>
                <button
                  onClick={onClose}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <i className="fas fa-times text-xl"></i>
                </button>
              </div>
            </div>

            {/* Content */}
            <div className="p-4 overflow-y-auto max-h-[60vh]">
              {isLoading ? (
                <div className="flex justify-center items-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
                </div>
              ) : receivedRequests.length === 0 ? (
                <div className="text-center py-8">
                  <i className="fas fa-user-plus text-4xl text-gray-300 mb-4"></i>
                  <p className="text-gray-500">Chưa có lời mời kết bạn nào</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {receivedRequests.map((request) => (
                    <motion.div
                      key={request.id}
                      className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg"
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                    >
                      {/* Avatar */}
                      <img
                        src={request.sender.avatarUrl || 'https://via.placeholder.com/48x48/3b82f6/ffffff?text=U'}
                        alt={request.sender.displayName || request.sender.username}
                        className="w-12 h-12 rounded-full object-cover"
                      />

                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <h3 className="text-sm font-medium text-gray-900 truncate">
                          {request.sender.displayName || request.sender.username}
                        </h3>
                        <p className="text-xs text-gray-500">
                          {formatTime(request.createdAt)}
                        </p>
                        {request.message && (
                          <p className="text-xs text-gray-600 mt-1 line-clamp-2">
                            {request.message}
                          </p>
                        )}
                      </div>

                      {/* Actions */}
                      <div className="flex space-x-2">
                        <motion.button
                          onClick={() => handleRespond(request.id, 'declined')}
                          disabled={processingRequest === request.id}
                          className="px-3 py-1 text-xs font-medium text-gray-600 bg-gray-200 rounded-md hover:bg-gray-300 transition-colors disabled:opacity-50"
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                        >
                          {processingRequest === request.id ? (
                            <i className="fas fa-spinner fa-spin"></i>
                          ) : (
                            'Từ chối'
                          )}
                        </motion.button>
                        <motion.button
                          onClick={() => handleRespond(request.id, 'accepted')}
                          disabled={processingRequest === request.id}
                          className="px-3 py-1 text-xs font-medium text-white bg-blue-500 rounded-md hover:bg-blue-600 transition-colors disabled:opacity-50"
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                        >
                          {processingRequest === request.id ? (
                            <i className="fas fa-spinner fa-spin"></i>
                          ) : (
                            'Chấp nhận'
                          )}
                        </motion.button>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default FriendRequestModal;
