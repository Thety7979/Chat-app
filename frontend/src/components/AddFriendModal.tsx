import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useFriends } from '../hooks/useFriends';
import { SearchUser, SendFriendRequestRequest } from '../types/friend';

interface AddFriendModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const AddFriendModal: React.FC<AddFriendModalProps> = ({ isOpen, onClose }) => {
  const { searchUsers, sendFriendRequest, hasPendingRequest, isLoading } = useFriends();
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SearchUser[]>([]);
  const [sendingRequest, setSendingRequest] = useState<string | null>(null);
  const [message, setMessage] = useState('');
  const [showMessageInput, setShowMessageInput] = useState<string | null>(null);

  // Search users when query changes
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (searchQuery.trim()) {
        searchUsers(searchQuery.trim()).then(setSearchResults);
      } else {
        setSearchResults([]);
      }
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [searchQuery, searchUsers]);

  const handleSendRequest = async (userId: string) => {
    try {
      setSendingRequest(userId);
      const request: SendFriendRequestRequest = {
        receiverId: userId,
        message: message.trim() || undefined
      };
      await sendFriendRequest(request);
      setMessage('');
      setShowMessageInput(null);
      // Remove from search results
      setSearchResults(prev => prev.filter(user => user.id !== userId));
    } catch (error) {
      console.error('Failed to send friend request:', error);
    } finally {
      setSendingRequest(null);
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
                  Thêm bạn bè
                </h2>
                <button
                  onClick={onClose}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <i className="fas fa-times text-xl"></i>
                </button>
              </div>
            </div>

            {/* Search Input */}
            <div className="p-4 border-b border-gray-200">
              <div className="relative">
                <input
                  type="text"
                  placeholder="Tìm kiếm theo tên hoặc username..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full px-4 py-2 pl-10 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <i className="fas fa-search absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"></i>
              </div>
            </div>

            {/* Content */}
            <div className="p-4 overflow-y-auto max-h-[50vh]">
              {isLoading ? (
                <div className="flex justify-center items-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
                </div>
              ) : searchResults.length === 0 ? (
                <div className="text-center py-8">
                  {searchQuery ? (
                    <>
                      <i className="fas fa-search text-4xl text-gray-300 mb-4"></i>
                      <p className="text-gray-500">Không tìm thấy người dùng nào</p>
                    </>
                  ) : (
                    <>
                      <i className="fas fa-user-plus text-4xl text-gray-300 mb-4"></i>
                      <p className="text-gray-500">Nhập tên hoặc username để tìm kiếm</p>
                    </>
                  )}
                </div>
              ) : (
                <div className="space-y-3">
                  {searchResults.map((user) => (
                    <motion.div
                      key={user.id}
                      className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg"
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                    >
                      {/* Avatar */}
                      <img
                        src={user.avatarUrl || 'https://via.placeholder.com/48x48/3b82f6/ffffff?text=U'}
                        alt={user.displayName || user.username}
                        className="w-12 h-12 rounded-full object-cover"
                      />

                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <h3 className="text-sm font-medium text-gray-900 truncate">
                          {user.displayName || user.username}
                        </h3>
                        <p className="text-xs text-gray-500">
                          @{user.username}
                        </p>
                        {user.about && (
                          <p className="text-xs text-gray-600 mt-1 line-clamp-1">
                            {user.about}
                          </p>
                        )}
                        <p className="text-xs text-gray-400">
                          Tham gia {formatTime(user.createdAt)}
                        </p>
                      </div>

                      {/* Action */}
                      <div className="flex flex-col space-y-2">
                        {showMessageInput === user.id ? (
                          <div className="space-y-2">
                            <input
                              type="text"
                              placeholder="Tin nhắn (tùy chọn)"
                              value={message}
                              onChange={(e) => setMessage(e.target.value)}
                              className="w-32 px-2 py-1 text-xs border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                            />
                            <div className="flex space-x-1">
                              <button
                                onClick={() => {
                                  setShowMessageInput(null);
                                  setMessage('');
                                }}
                                className="px-2 py-1 text-xs text-gray-600 bg-gray-200 rounded hover:bg-gray-300"
                              >
                                Hủy
                              </button>
                              <button
                                onClick={() => handleSendRequest(user.id)}
                                disabled={sendingRequest === user.id}
                                className="px-2 py-1 text-xs text-white bg-blue-500 rounded hover:bg-blue-600 disabled:opacity-50"
                              >
                                {sendingRequest === user.id ? (
                                  <i className="fas fa-spinner fa-spin"></i>
                                ) : (
                                  'Gửi'
                                )}
                              </button>
                            </div>
                          </div>
                        ) : (
                          <motion.button
                            onClick={() => setShowMessageInput(user.id)}
                            disabled={sendingRequest === user.id}
                            className="px-3 py-1 text-xs font-medium text-white bg-blue-500 rounded-md hover:bg-blue-600 transition-colors disabled:opacity-50"
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                          >
                            {sendingRequest === user.id ? (
                              <i className="fas fa-spinner fa-spin"></i>
                            ) : (
                              'Kết bạn'
                            )}
                          </motion.button>
                        )}
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

export default AddFriendModal;
