import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useFriends } from '../hooks/useFriends';
import { useChat } from '../hooks/useChat';
import chatApi from '../api/chatApi';

interface FriendsListProps {
  onSelectFriend?: (friend: any) => void;
}

const FriendsList: React.FC<FriendsListProps> = ({ onSelectFriend }) => {
  const { friends, isLoading, error } = useFriends();
  const { selectConversation, loadConversations } = useChat();
  const [isStartingChat, setIsStartingChat] = useState<string | null>(null);

  const handleFriendClick = async (friend: any) => {
    if (onSelectFriend) {
      onSelectFriend(friend);
    } else {
      // Try to get or create direct conversation with this friend
      try {
        setIsStartingChat(friend.id);
        const conversation = await chatApi.getOrCreateDirectConversation(friend.id);
        
        // Select the conversation
        selectConversation(conversation);
        
        // Reload conversations to update the list
        await loadConversations();
        
        // Switch back to chats view
        // This would need to be passed as a prop or handled by parent
        console.log('Started conversation with:', friend.displayName || friend.email);
      } catch (error) {
        console.error('Failed to start conversation:', error);
        alert(`Không thể bắt đầu trò chuyện với ${friend.displayName || friend.email}`);
      } finally {
        setIsStartingChat(null);
      }
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-32">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#3b82f6]"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex justify-center items-center h-32 text-red-500">
        <p>Lỗi khi tải danh sách bạn bè: {error}</p>
      </div>
    );
  }

  if (friends.length === 0) {
    return (
      <div className="flex flex-col justify-center items-center h-32 text-[#6b7280]">
        <i className="fas fa-users text-4xl mb-2"></i>
        <p>Chưa có bạn bè nào</p>
        <p className="text-sm">Hãy thêm bạn bè để bắt đầu trò chuyện</p>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto">
      <div className="p-4">
        <h3 className="font-semibold text-[#1a1a1a] mb-4">
          Bạn bè ({friends.length})
        </h3>
        <div className="space-y-2">
          {friends.map((friend, index) => (
            <motion.div
              key={friend.id}
              className="w-full flex items-center gap-3 p-3 hover:bg-[#f3f4f6] rounded-lg transition-colors text-left"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <div className="relative">
                <img
                  src={friend.avatarUrl || 'https://via.placeholder.com/48x48/3b82f6/ffffff?text=U'}
                  alt={friend.displayName || friend.email}
                  className="w-12 h-12 rounded-full object-cover"
                />
                <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-white"></div>
              </div>
              <div className="flex-1">
                <h4 className="font-semibold text-[#1a1a1a] text-sm">
                  {friend.displayName || friend.email}
                </h4>
                <p className="text-xs text-[#6b7280]">
                  {friend.email}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <motion.button
                  className="p-2 text-[#6b7280] hover:text-[#3b82f6] transition-colors disabled:opacity-50"
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  title="Bắt đầu trò chuyện"
                  onClick={() => handleFriendClick(friend)}
                  disabled={isStartingChat === friend.id}
                >
                  {isStartingChat === friend.id ? (
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-[#3b82f6]"></div>
                  ) : (
                    <i className="fas fa-comment text-sm"></i>
                  )}
                </motion.button>
                <motion.button
                  className="p-2 text-[#6b7280] hover:text-[#3b82f6] transition-colors"
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  title="Gọi thoại"
                >
                  <i className="fas fa-phone text-sm"></i>
                </motion.button>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default FriendsList;
