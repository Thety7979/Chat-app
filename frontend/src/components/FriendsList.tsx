import React, { useState } from 'react';
import { useFriends } from '../hooks/useFriends';
import { useChat } from '../hooks/useChat';
import { useCall } from '../hooks/useCall';
import chatApi from '../api/chatApi';
import ConfirmDialog from './ConfirmDialog';

interface FriendsListProps {
  onSelectFriend?: (friend: any) => void;
  onFriendRemoved?: () => void;
}

const FriendsList: React.FC<FriendsListProps> = ({ onSelectFriend, onFriendRemoved }) => {
  const { friends, isLoading, error, removeFriend, loadFriends } = useFriends();
  const { selectConversation, loadConversations } = useChat();
  const { startCall } = useCall();
  
  const [isStartingChat, setIsStartingChat] = useState<string | null>(null);
  const [isRemovingFriend, setIsRemovingFriend] = useState<string | null>(null);
  const [showConfirmDialog, setShowConfirmDialog] = useState<boolean>(false);
  const [friendToRemove, setFriendToRemove] = useState<any>(null);
  const [showErrorDialog, setShowErrorDialog] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string>('');

  const handleFriendClick = async (friend: any) => {
    if (onSelectFriend) {
      onSelectFriend(friend);
    } else {
      // Try to get or create direct conversation with this friend
      try {
        setIsStartingChat(friend.id);
        const conversation = await chatApi.getOrCreateDirectConversation(friend.id);
        
        // Select the conversation (this will also add it to the conversations list)
        selectConversation(conversation);
        
        // Switch back to chats view
        // This would need to be passed as a prop or handled by parent
        console.log('Started conversation with:', friend.displayName || friend.email);
      } catch (error) {
        console.error('Failed to start conversation:', error);
        setErrorMessage(`Không thể bắt đầu trò chuyện với ${friend.displayName || friend.email}`);
        setShowErrorDialog(true);
      } finally {
        setIsStartingChat(null);
      }
    }
  };

  const handleRemoveFriendClick = (friend: any) => {
    console.log('handleRemoveFriendClick called with friend:', friend);
    setFriendToRemove(friend);
    setShowConfirmDialog(true);
  };

  const handleConfirmRemoveFriend = async () => {
    if (!friendToRemove) return;
    
    try {
      console.log('Starting to remove friend:', friendToRemove.id);
      setIsRemovingFriend(friendToRemove.id);
      await removeFriend(friendToRemove.id);
      // Note: removeFriend already updates the friends state, no need to call loadFriends()
      // Reload conversations to remove any direct conversations with this friend
      await loadConversations();
      // Notify parent component that a friend was removed
      if (onFriendRemoved) {
        onFriendRemoved();
      }
      console.log('Successfully removed friend:', friendToRemove.displayName || friendToRemove.email);
    } catch (error) {
      console.error('Failed to remove friend:', error);
      setErrorMessage(`Không thể hủy kết bạn với ${friendToRemove.displayName || friendToRemove.email}`);
      setShowErrorDialog(true);
    } finally {
      setIsRemovingFriend(null);
      setShowConfirmDialog(false);
      setFriendToRemove(null);
    }
  };

  const handleCancelRemoveFriend = () => {
    setShowConfirmDialog(false);
    setFriendToRemove(null);
  };

  const handleCallFriend = async (friend: any) => {
    try {
      console.log('FriendsList - Starting call with friend:', friend);
      console.log('FriendsList - Friend ID:', friend.id);
      await startCall(friend.id);
      console.log('FriendsList - Call started successfully');
    } catch (error) {
      console.error('FriendsList - Failed to start call:', error);
      setErrorMessage(`Không thể gọi ${friend.displayName || friend.email}`);
      setShowErrorDialog(true);
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
            <div
              key={friend.id}
              className="w-full flex items-center gap-3 p-3 hover:bg-[#f3f4f6] rounded-lg transition-colors text-left"
            >
              <div className="relative">
                <img
                  src={friend.avatarUrl || 'https://ui-avatars.com/api/?name=' + encodeURIComponent(friend.displayName || friend.email) + '&background=3b82f6&color=ffffff&size=48'}
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
                <button
                  className="p-2 text-[#6b7280] hover:text-[#3b82f6] transition-colors disabled:opacity-50"
                  title="Bắt đầu trò chuyện"
                  onClick={() => handleFriendClick(friend)}
                  disabled={isStartingChat === friend.id}
                >
                  {isStartingChat === friend.id ? (
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-[#3b82f6]"></div>
                  ) : (
                    <i className="fas fa-comment text-sm"></i>
                  )}
                </button>
                <button
                  className="p-2 text-[#6b7280] hover:text-[#3b82f6] transition-colors"
                  title="Gọi thoại"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    handleCallFriend(friend);
                  }}
                >
                  <i className="fas fa-phone text-sm"></i>
                </button>
                <button
                  className="p-2 text-red-600 hover:text-red-800 hover:bg-red-50 transition-colors"
                  title="Hủy kết bạn"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    console.log('Remove friend button clicked for:', friend);
                    handleRemoveFriendClick(friend);
                  }}
                  disabled={isRemovingFriend === friend.id}
                >
                  {isRemovingFriend === friend.id ? (
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-red-600"></div>
                  ) : (
                    <i className="fas fa-user-times text-sm"></i>
                  )}
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
      
      {/* Confirm Dialog */}
      <ConfirmDialog
        isOpen={showConfirmDialog}
        onClose={handleCancelRemoveFriend}
        onConfirm={handleConfirmRemoveFriend}
        title="Hủy kết bạn"
        message={`Bạn có chắc chắn muốn hủy kết bạn với ${friendToRemove?.displayName || friendToRemove?.email}?`}
        confirmText="Hủy kết bạn"
        cancelText="Không"
        confirmButtonColor="red"
        isLoading={isRemovingFriend === friendToRemove?.id}
      />

      <ConfirmDialog
        isOpen={showErrorDialog}
        onClose={() => setShowErrorDialog(false)}
        onConfirm={() => setShowErrorDialog(false)}
        title="Lỗi"
        message={errorMessage}
        confirmText="OK"
        cancelText=""
        confirmButtonColor="blue"
        isLoading={false}
      />
    </div>
  );
};

export default FriendsList;
