import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../contexts/AuthContext';
import { useChat } from '../hooks/useChat';
import { useFriends } from '../hooks/useFriends';
import { useCall } from '../hooks/useCall';
import { useCallHistory } from '../hooks/useCallHistory';
import FriendRequestModal from './FriendRequestModal';
import AddFriendModal from './AddFriendModal';
import FriendsList from './FriendsList';
import MessagePopupMenu from './MessagePopupMenu';
import CallModal from './CallModal';
import ConfirmDialog from './ConfirmDialog';
import IncomingCallNotification from './IncomingCallNotification';
import CallHistoryMessage from './CallHistoryMessage';
import chatApi from '../api/chatApi';
import '../assets/css/ChatUI.css';
import websocketService from '../services/websocketService';
import webrtcService from '../services/webrtcService';
import PermissionInstructionsModal from './PermissionInstructionsModal';

const ChatUI: React.FC = () => {
  const { user, logout } = useAuth();
  const {
    conversations,
    currentConversation,
    messages,
    isLoading,
    error,
    isConnected,
    typingUsers,
    messagesEndRef,
    justSelectedConversation,
    sendMessage,
    selectConversation,
    sendTypingIndicator,
    scrollToBottom
  } = useChat();

  const {
    friends,
    pendingCount,
    loadFriends,
    searchUsers,
    searchFriends
  } = useFriends();

  const {
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
    toggleVideo,
    switchCamera,
    closeCallModal
  } = useCall();

  const {
    callHistory,
    isLoading: isCallHistoryLoading,
    error: callHistoryError,
    addCallToHistory,
    updateCallInHistory,
    loadCallHistory
  } = useCallHistory(currentConversation?.id || null);

  const [message, setMessage] = useState<string>('');
  const [isCalling, setIsCalling] = useState<boolean>(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState<boolean>(false);
  const [activeSidebarItem, setActiveSidebarItem] = useState<string>('chats');
  const [showContactsOnMobile, setShowContactsOnMobile] = useState<boolean>(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState<boolean>(false);
  const [isTyping, setIsTyping] = useState<boolean>(false);
  const [showFriendRequestModal, setShowFriendRequestModal] = useState<boolean>(false);
  const [showAddFriendModal, setShowAddFriendModal] = useState<boolean>(false);
  const [showCallAlert, setShowCallAlert] = useState<boolean>(false);
  const [callAlertMessage, setCallAlertMessage] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState<boolean>(false);
  const [showMoreMenu, setShowMoreMenu] = useState<string | null>(null);
  const [presenceText, setPresenceText] = useState<string>('');
  const [showPermissionModal, setShowPermissionModal] = useState<boolean>(false);
  const [permissionType, setPermissionType] = useState<'camera' | 'microphone' | 'both'>('both');
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const likeTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const handleTyping = () => {
    if (!isTyping && currentConversation) {
      setIsTyping(true);
      sendTypingIndicator(true);
    }

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    typingTimeoutRef.current = setTimeout(() => {
      if (isTyping && currentConversation) {
        setIsTyping(false);
        sendTypingIndicator(false);
      }
    }, 1000);
  };

  useEffect(() => {
    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
      if (likeTimeoutRef.current) {
        clearTimeout(likeTimeoutRef.current);
      }
    };
  }, []);

  useEffect(() => {
    const performSearch = async () => {
      if (searchQuery.trim().length < 2) {
        setSearchResults([]);
        return;
      }

      setIsSearching(true);
      try {
        // Chỉ tìm kiếm trong danh sách bạn bè, không tìm tất cả người dùng
        const friendResults = await searchFriends(searchQuery);

        const combinedResults = [
          ...friendResults.map(friend => ({ ...friend, type: 'friend' }))
        ];

        setSearchResults(combinedResults);
      } catch (error) {
        console.error('Search error:', error);
        setSearchResults([]);
      } finally {
        setIsSearching(false);
      }
    };

    const timeoutId = setTimeout(performSearch, 300);
    return () => clearTimeout(timeoutId);
  }, [searchQuery, searchFriends]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (showMoreMenu) {
        setShowMoreMenu(null);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showMoreMenu]);

  // Close popup when conversation changes
  useEffect(() => {
    setShowMoreMenu(null);
  }, [currentConversation?.id]);

  // Close popup when scrolling
  useEffect(() => {
    const handleScroll = () => {
      if (showMoreMenu) {
        setShowMoreMenu(null);
      }
    };

    const messagesContainer = document.querySelector('.messages-container');
    if (messagesContainer) {
      messagesContainer.addEventListener('scroll', handleScroll);
      return () => {
        messagesContainer.removeEventListener('scroll', handleScroll);
      };
    }
  }, [showMoreMenu]);

  const handleSendMessage = () => {
    if (message.trim() && currentConversation) {
      const messageToSend = message.trim();
      console.log('Sending message:', messageToSend);

      setMessage('');

      if (isTyping) {
        setIsTyping(false);
        sendTypingIndicator(false);
      }

      sendMessage(messageToSend);
    }
  };

  const handleSendLike = () => {
    if (currentConversation) {
      if (likeTimeoutRef.current) {
        clearTimeout(likeTimeoutRef.current);
      }

      likeTimeoutRef.current = setTimeout(() => {
        sendMessage('👍');
      }, 100);
    }
  };

  const handleReplyToMessage = (message: any) => {
    console.log('Reply to message:', message);
  };

  const handleReactionToMessage = (message: any) => {
    console.log('React to message:', message);
  };

  const handleRecallMessage = (messageId: string) => {
    console.log('Recall message:', messageId);
    setShowMoreMenu(null);
  };

  const handleForwardMessage = (message: any) => {
    console.log('Forward message:', message);
    setShowMoreMenu(null);
  };

  const handleCall = async (type: 'audio' | 'video') => {
    console.log('ChatUI - handleCall called with type:', type);
    console.log('ChatUI - currentContact:', currentContact);
    if (currentContact) {
      console.log('ChatUI - Starting call to:', currentContact.id);
      
      try {
        // Check media permissions before starting call
        const permissions = await webrtcService.checkMediaPermissions(type);
        
        if (!permissions.audio) {
          setPermissionType('microphone');
          setShowPermissionModal(true);
          return;
        }
        
        if (type === 'video' && !permissions.video) {
          // Thông báo lỗi quyền camera, nhưng vẫn giữ cuộc gọi video (hiển thị UI video)
          setPermissionType('camera');
          setShowPermissionModal(true);
          setCallAlertMessage('Không truy cập được camera. Hệ thống sẽ thử kết nối video một chiều.');
          setShowCallAlert(true);
          // Tiếp tục startCall dưới dạng video; phía service sẽ thêm transceiver recvonly
        }
        
        await startCall(currentContact.id, type);
      } catch (error) {
        console.error('ChatUI - Failed to start call:', error);
        setCallAlertMessage('Không thể bắt đầu cuộc gọi. Vui lòng thử lại.');
        setShowCallAlert(true);
      }
    } else {
      console.log('ChatUI - No current contact to call');
    }
  };

  const handleCallBack = async (callId: string) => {
    try {
      if (!currentConversation) return;
      
      // Find the call to get the other participant
      const call = callHistory.find(c => c.id === callId);
      if (!call) return;
      
      // Determine who to call back
      const otherParticipantId = call.initiatorId === user?.id ? 
        currentConversation.members.find((member: any) => member.userId !== user?.id)?.userId :
        call.initiatorId;
      
      if (otherParticipantId) {
        await startCall(otherParticipantId, 'audio'); // Default to audio for call back
        setIsCalling(true);
      }
    } catch (error) {
      console.error('Error calling back:', error);
    }
  };

  const handleSearchResultClick = async (result: any) => {
    if (result.type === 'friend') {
      try {
        const conversation = await chatApi.getOrCreateDirectConversation(result.id);
        selectConversation(conversation);
        setSearchQuery('');
        setSearchResults([]);
      } catch (error) {
        console.error('Failed to start conversation with friend:', error);
        setCallAlertMessage(`Không thể bắt đầu trò chuyện với ${result.displayName || result.email}`);
        setShowCallAlert(true);
      }
    }
  };

  const getCurrentContact = () => {
    if (!currentConversation) return null;

    if (currentConversation.type === 'direct') {
      const otherMember = currentConversation.members.find(member => member.userId !== user?.id);
      return otherMember ? {
        id: otherMember.userId,
        name: otherMember.displayName || otherMember.username,
        avatarUrl: otherMember.avatarUrl || 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDgiIGhlaWdodD0iNDgiIHZpZXdCb3g9IjAgMCA0OCA0OCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPGNpcmNsZSBjeD0iMjQiIGN5PSIyNCIgcj0iMjQiIGZpbGw9IiMzYjgyZjYiLz4KPHN2ZyB4PSIxMiIgeT0iMTIiIHdpZHRoPSIyNCIgaGVpZ2h0PSIyNCIgdmlld0JveD0iMCAwIDI0IDI0IiBmaWxsPSJub25lIj4KPHBhdGggZD0iTTEyIDEyQzE0LjIwOTEgMTIgMTYgMTAuMjA5MSAxNiA4QzE2IDUuNzkwODYgMTQuMjA5MSA0IDEyIDRDOS43OTA4NiA0IDggNS43OTA4NiA4IDhDOCAxMC4yMDkxIDkuNzkwODYgMTIgMTIgMTJaIiBmaWxsPSJ3aGl0ZSIvPgo8cGF0aCBkPSJNMTIgMTRDOC42ODYyOSAxNCA2IDE2LjY4NjMgNiAyMFYyMkgxOFYyMEMxOCAxNi42ODYzIDE1LjMxMzcgMTQgMTIgMTRaIiBmaWxsPSJ3aGl0ZSIvPgo8L3N2Zz4KPC9zdmc+',
        isActive: otherMember.isOnline
      } : null;
    } else {
      return {
        id: currentConversation.id,
        name: currentConversation.title || 'Group Chat',
        avatarUrl: currentConversation.avatarUrl || 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDgiIGhlaWdodD0iNDgiIHZpZXdCb3g9IjAgMCA0OCA0OCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPGNpcmNsZSBjeD0iMjQiIGN5PSIyNCIgcj0iMjQiIGZpbGw9IiMzYjgyZjYiLz4KPHN2ZyB4PSIxMiIgeT0iMTIiIHdpZHRoPSIyNCIgaGVpZ2h0PSIyNCIgdmlld0JveD0iMCAwIDI0IDI0IiBmaWxsPSJub25lIj4KPHBhdGggZD0iTTEyIDEyQzE0LjIwOTEgMTIgMTYgMTAuMjA5MSAxNiA4QzE2IDUuNzkwODYgMTQuMjA5MSA0IDEyIDRDOS43OTA4NiA0IDggNS43OTA4NiA4IDhDOCAxMC4yMDkxIDkuNzkwODYgMTIgMTIgMTJaIiBmaWxsPSJ3aGl0ZSIvPgo8cGF0aCBkPSJNMTIgMTRDOC42ODYyOSAxNCA2IDE2LjY4NjMgNiAyMFYyMkgxOFYyMEMxOCAxNi42ODYzIDE1LjMxMzcgMTQgMTIgMTRaIiBmaWxsPSJ3aGl0ZSIvPgo8L3N2Zz4KPC9zdmc+',
        isActive: currentConversation.isOnline
      };
    }
  };

  const currentContact = getCurrentContact();

  // Helper: format thời gian tương đối
  const formatLastSeen = (iso?: string) => {
    if (!iso) return '';
    const ts = new Date(iso).getTime();
    const now = Date.now();
    const diff = Math.max(0, now - ts);
    const m = Math.floor(diff / 60000);
    if (m < 1) return 'vừa xong';
    if (m < 60) return `${m} phút trước`;
    const h = Math.floor(m / 60);
    if (h < 24) return `${h} giờ trước`;
    const d = Math.floor(h / 24);
    return `${d} ngày trước`;
  };

  // Khởi tạo trạng thái hiện thị hoạt động theo cuộc trò chuyện hiện tại
  useEffect(() => {
    if (!currentConversation) return;
    if (currentConversation.type === 'direct') {
      const otherMember = currentConversation.members.find(m => m.userId !== user?.id);
      if (otherMember?.isOnline) {
        setPresenceText('Đang hoạt động');
      } else {
        setPresenceText(`Hoạt động ${formatLastSeen(otherMember?.lastSeenAt)}`);
      }
    } else {
      setPresenceText('');
    }
  }, [currentConversation?.id, user?.id]);

  // Cập nhật lại trạng thái hoạt động khi server đẩy bản cập nhật cuộc trò chuyện
  useEffect(() => {
    if (!currentConversation) return;
    const latest = conversations.find(c => c.id === currentConversation.id);
    if (!latest || latest.type !== 'direct') return;
    const other = latest.members.find(m => m.userId !== user?.id);
    if (!other) return;
    setPresenceText(other.isOnline ? 'Đang hoạt động' : `Hoạt động ${formatLastSeen(other.lastSeenAt)}`);
  }, [conversations, currentConversation?.id, user?.id]);

  // Lắng nghe cập nhật hiện diện real-time
  useEffect(() => {
    if (!currentConversation) return;
    const otherMemberId = currentConversation.type === 'direct'
      ? currentConversation.members.find(m => m.userId !== user?.id)?.userId
      : undefined;
    if (!otherMemberId) return;

    const handlePresence = (update: any) => {
      if (update.userId !== otherMemberId) return;
      if (update.status === 'online') {
        setPresenceText('Đang hoạt động');
      } else {
        const iso = new Date(update.timestamp).toISOString();
        setPresenceText(`Hoạt động ${formatLastSeen(iso)}`);
      }
    };

    websocketService.subscribeToPresence(currentConversation.id, handlePresence);
    return () => {
      websocketService.unsubscribe(`/topic/conversation/${currentConversation.id}/presence`);
    };
  }, [currentConversation?.id, user?.id]);

  // Refresh call history immediately after a call ends (no manual reload needed)
  useEffect(() => {
    // Only trigger when we actually have a conversation selected
    if (!currentConversation) return;

    // When a call ends, callState.isInCall becomes false
    if (callState && callState.isInCall === false) {
      loadCallHistory();
    }
  }, [callState.isInCall, currentConversation?.id, loadCallHistory]);

  // Hide "Đang kết nối..." popup when call starts, incoming modal shows, or call ends
  useEffect(() => {
    if (callState.isInCall || isCallModalOpen || !callState.isInCall) {
      // Either a call is in progress (modal will take over) or it has ended
      if (isCalling) setIsCalling(false);
    }
  }, [callState.isInCall, isCallModalOpen]);

  // Debug logging for call notifications
  useEffect(() => {
    if (showIncomingCallNotification) {
      console.log('ChatUI - Incoming call notification should be visible:', {
        isVisible: showIncomingCallNotification,
        callerInfo,
        callerName,
        finalName: callerInfo?.name || callerName || 'Unknown'
      });
    }
  }, [showIncomingCallNotification, callerInfo, callerName]);

  const sidebarItems = [
    { id: 'chats', label: 'Cuộc trò chuyện', icon: 'fas fa-comments' },
    { id: 'friends', label: 'Bạn bè', icon: 'fas fa-users', badge: friends.length },
    { id: 'requests', label: 'Lời mời kết bạn', icon: 'fas fa-user-plus', badge: pendingCount },
    { id: 'add-friend', label: 'Thêm bạn bè', icon: 'fas fa-user-plus' },
    { id: 'settings', label: 'Cài đặt', icon: 'fas fa-cog' },
    { id: 'history', label: 'Lịch sử', icon: 'fas fa-history' },
    { id: 'notifications', label: 'Thông báo', icon: 'fas fa-bell' },
    { id: 'help', label: 'Trợ giúp', icon: 'fas fa-question-circle' }
  ];

  return (
    <div className="chat-container bg-[#f9fafc] h-screen flex font-sans text-sm text-[#1a1a1a] overflow-hidden">
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            className="fixed inset-0 bg-black/50 z-40 lg:hidden"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsMobileMenuOpen(false)}
          />
        )}
      </AnimatePresence>

      <motion.div
        className={`user-sidebar ${isSidebarCollapsed ? 'lg:w-16 lg:collapsed' : 'w-64'} h-screen bg-white border-r border-[#e5e7eb] flex flex-col fixed lg:relative z-50 lg:z-auto transition-all duration-300 ${isMobileMenuOpen ? 'open' : ''
          }`}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.1 }}
      >
        <div className="hidden lg:block p-2 border-b border-[#e5e7eb] flex justify-end">
          <motion.button
            className="p-2 text-[#6b7280] hover:text-[#3b82f6] transition-colors rounded-md hover:bg-[#f3f4f6]"
            onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            title={isSidebarCollapsed ? "Mở rộng sidebar" : "Thu gọn sidebar"}
          >
            <i className={`fas ${isSidebarCollapsed ? 'fa-chevron-right' : 'fa-chevron-left'} text-sm`}></i>
          </motion.button>
        </div>

        <motion.div
          className={`p-4 border-b border-[#e5e7eb] ${isSidebarCollapsed ? 'lg:px-2' : ''}`}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.1 }}
        >
          <div className={`flex items-center ${isSidebarCollapsed ? 'lg:justify-center' : 'gap-3'} mb-4`}>
            <img
              alt="User profile"
              className={`${isSidebarCollapsed ? 'lg:w-8 lg:h-8 w-12 h-12' : 'w-12 h-12'} rounded-full object-cover`}
              src={user?.avatarUrl ? `https://images.weserv.nl/?url=${encodeURIComponent(user.avatarUrl)}` : `https://ui-avatars.com/api/?name=${encodeURIComponent(user?.displayName || user?.email || 'User')}&background=3b82f6&color=ffffff&size=48`}
              onError={(e) => {
                const target = e.target as HTMLImageElement;
                const fallbackUrl = `https://ui-avatars.com/api/?name=${encodeURIComponent(user?.displayName || user?.email || 'User')}&background=3b82f6&color=ffffff&size=48`;
                target.src = fallbackUrl;
              }}
            />
            {!isSidebarCollapsed && (
              <div className="flex-1">
                <h3 className="font-bold text-[#1a1a1a] text-sm">
                  {user?.displayName || user?.email || 'User'}
                </h3>
                <p className="text-xs text-[#6b7280]">Đang hoạt động</p>
              </div>
            )}
          </div>
          <motion.button
            className={`${isSidebarCollapsed ? 'lg:w-10 lg:h-10 lg:p-0 w-full py-2 px-3' : 'w-full py-2 px-3'} bg-red-500 hover:bg-red-600 text-white rounded-md text-xs font-semibold transition-colors flex items-center justify-center`}
            onClick={logout}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            title={isSidebarCollapsed ? "Đăng xuất" : ""}
          >
            <i className="fas fa-sign-out-alt"></i>
            {!isSidebarCollapsed && <span className="ml-2">Đăng xuất</span>}
          </motion.button>
        </motion.div>

        <div className="flex-1 overflow-y-auto">
          {sidebarItems.map((item, index) => (
            <motion.button
              key={item.id}
              className={`w-full flex items-center ${isSidebarCollapsed ? 'lg:justify-center lg:px-2 gap-3 px-4' : 'gap-3 px-4'} py-3 hover:bg-[#f3f4f6] focus:outline-none transition-colors ${activeSidebarItem === item.id
                  ? 'border-l-4 border-[#3b82f6] bg-[#f9fafc] text-[#3b82f6]'
                  : 'border-l-4 border-transparent text-[#6b7280]'
                }`}
              type="button"
              onClick={() => {
                setActiveSidebarItem(item.id);
                if (window.innerWidth < 1024) {
                  setIsMobileMenuOpen(false);
                }

                if (item.id === 'requests') {
                  setShowFriendRequestModal(true);
                } else if (item.id === 'add-friend') {
                  setShowAddFriendModal(true);
                }
              }}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 + index * 0.05 }}
              whileHover={{ x: 2 }}
              whileTap={{ scale: 0.98 }}
              title={isSidebarCollapsed ? item.label : ""}
            >
              <i className={`${item.icon} text-sm`}></i>
              {!isSidebarCollapsed && (
                <div className="flex items-center justify-between w-full">
                  <span className="text-sm font-medium">{item.label}</span>
                  {item.badge && item.badge > 0 && (
                    <span className="inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-white bg-red-500 rounded-full">
                      {item.badge}
                    </span>
                  )}
                </div>
              )}
            </motion.button>
          ))}
        </div>
      </motion.div>

      <div className="main-content flex-1 flex flex-col h-full overflow-hidden">
        <div className="lg:hidden flex items-center justify-between p-4 bg-white border-b border-[#e5e7eb]">
          <motion.button
            className="p-2 text-[#6b7280] hover:text-[#3b82f6] transition-colors"
            onClick={() => setIsMobileMenuOpen(true)}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
          >
            <i className="fas fa-bars text-lg"></i>
          </motion.button>
          <h1 className="font-bold text-[#1a1a1a] text-lg">Chat App</h1>
          <motion.button
            className="p-2 text-[#6b7280] hover:text-[#3b82f6] transition-colors"
            onClick={() => setShowContactsOnMobile(!showContactsOnMobile)}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
          >
            <i className="fas fa-users text-lg"></i>
          </motion.button>
        </div>

        <AnimatePresence>
          {showContactsOnMobile && (
            <motion.div
              className="fixed inset-0 bg-black/50 z-40 lg:hidden"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowContactsOnMobile(false)}
            >
              <motion.div
                className="fixed top-0 right-0 w-80 h-full bg-white shadow-lg"
                initial={{ x: 320 }}
                animate={{ x: 0 }}
                exit={{ x: 320 }}
                transition={{ duration: 0.3 }}
                onClick={(e) => e.stopPropagation()}
              >
                <div className="p-4 border-b border-[#e5e7eb] flex items-center justify-between">
                  <h2 className="font-extrabold text-[#1a1a1a] text-base">Cuộc trò chuyện</h2>
                  <motion.button
                    className="p-2 text-[#6b7280] hover:text-[#3b82f6] transition-colors"
                    onClick={() => setShowContactsOnMobile(false)}
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                  >
                    <i className="fas fa-times text-lg"></i>
                  </motion.button>
                </div>

                <div className="flex-1 overflow-y-auto">
                  {isLoading ? (
                    <div className="flex justify-center items-center h-32">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#3b82f6]"></div>
                    </div>
                  ) : conversations.length === 0 ? (
                    <div className="flex justify-center items-center h-32 text-[#6b7280]">
                      <p>Chưa có cuộc trò chuyện nào</p>
                    </div>
                  ) : (
                    conversations.map((conversation, index) => {
                      const otherMember = conversation.type === 'direct'
                        ? conversation.members.find(member => member.userId !== user?.id)
                        : null;

                      const displayName = conversation.type === 'direct'
                        ? (otherMember?.displayName || otherMember?.username || 'Unknown')
                        : (conversation.title || 'Group Chat');

                      const avatar = conversation.type === 'direct'
                        ? (otherMember?.avatarUrl || 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDgiIGhlaWdodD0iNDgiIHZpZXdCb3g9IjAgMCA0OCA0OCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPGNpcmNsZSBjeD0iMjQiIGN5PSIyNCIgcj0iMjQiIGZpbGw9IiMzYjgyZjYiLz4KPHN2ZyB4PSIxMiIgeT0iMTIiIHdpZHRoPSIyNCIgaGVpZ2h0PSIyNCIgdmlld0JveD0iMCAwIDI0IDI0IiBmaWxsPSJub25lIj4KPHBhdGggZD0iTTEyIDEyQzE0LjIwOTEgMTIgMTYgMTAuMjA5MSAxNiA4QzE2IDUuNzkwODYgMTQuMjA5MSA0IDEyIDRDOS43OTA4NiA0IDggNS43OTA4NiA4IDhDOCAxMC4yMDkxIDkuNzkwODYgMTIgMTIgMTJaIiBmaWxsPSJ3aGl0ZSIvPgo8cGF0aCBkPSJNMTIgMTRDOC42ODYyOSAxNCA2IDE2LjY4NjMgNiAyMFYyMkgxOFYyMEMxOCAxNi42ODYzIDE1LjMxMzcgMTQgMTIgMTRaIiBmaWxsPSJ3aGl0ZSIvPgo8L3N2Zz4KPC9zdmc+')
                        : (conversation.avatarUrl || 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDgiIGhlaWdodD0iNDgiIHZpZXdCb3g9IjAgMCA0OCA0OCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPGNpcmNsZSBjeD0iMjQiIGN5PSIyNCIgcj0iMjQiIGZpbGw9IiMzYjgyZjYiLz4KPHN2ZyB4PSIxMiIgeT0iMTIiIHdpZHRoPSIyNCIgaGVpZ2h0PSIyNCIgdmlld0JveD0iMCAwIDI0IDI0IiBmaWxsPSJub25lIj4KPHBhdGggZD0iTTEyIDEyQzE0LjIwOTEgMTIgMTYgMTAuMjA5MSAxNiA4QzE2IDUuNzkwODYgMTQuMjA5MSA0IDEyIDRDOS43OTA4NiA0IDggNS43OTA4NiA4IDhDOCAxMC4yMDkxIDkuNzkwODYgMTIgMTIgMTJaIiBmaWxsPSJ3aGl0ZSIvPgo8cGF0aCBkPSJNMTIgMTRDOC42ODYyOSAxNCA2IDE2LjY4NjMgNiAyMFYyMkgxOFYyMEMxOCAxNi42ODYzIDE1LjMxMzcgMTQgMTIgMTRaIiBmaWxsPSJ3aGl0ZSIvPgo8L3N2Zz4KPC9zdmc+');

                      const isActive = conversation.type === 'direct'
                        ? otherMember?.isOnline
                        : conversation.isOnline;

                      const lastMessage = conversation.lastMessage?.content || 'Chưa có tin nhắn';
                      const lastMessageTime = conversation.lastMessage?.createdAt
                        ? new Date(conversation.lastMessage.createdAt).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' })
                        : '';

                      return (
                        <motion.button
                          key={conversation.id}
                          className={`w-full flex items-center gap-3 px-3 py-2 hover:bg-[#f3f4f6] focus:outline-none transition-colors ${currentConversation?.id === conversation.id
                              ? 'border-l-4 border-[#3b82f6] bg-[#f9fafc]'
                              : 'border-l-4 border-transparent'
                            }`}
                          type="button"
                          onClick={() => {
                            selectConversation(conversation);
                            setShowContactsOnMobile(false);
                          }}
                          initial={{ opacity: 0, x: 20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: 0.1 + index * 0.05 }}
                          whileHover={{ x: -2 }}
                          whileTap={{ scale: 0.98 }}
                        >
                          <div className="relative">
                            <img
                              alt={`Profile picture of ${displayName}`}
                              className="w-10 h-10 rounded-full object-cover"
                              height="40"
                              src={avatar}
                              width="40"
                            />
                            {isActive && (
                              <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-green-500 rounded-full border-2 border-white"></div>
                            )}
                          </div>
                          <div className="flex-1 text-left">
                            <p className="font-extrabold text-xs text-[#1a1a1a] leading-5">
                              {displayName}
                            </p>
                            <p className="text-xs text-[#6b7280] truncate max-w-[160px]">
                              {lastMessage}
                            </p>
                          </div>
                          <div className="flex flex-col items-end text-[10px] text-[#9ca3af]">
                            <span>{lastMessageTime}</span>
                            {conversation.unreadCount > 0 && (
                              <span className="mt-1 inline-block min-w-[18px] h-5 text-center text-white text-xs font-semibold rounded-full bg-[#3b82f6]">
                                {conversation.unreadCount}
                              </span>
                            )}
                          </div>
                        </motion.button>
                      );
                    })
                  )}
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="flex-1 flex h-full overflow-hidden">
          <motion.div
            className="contacts-sidebar w-80 border-r border-[#e5e7eb] bg-white flex flex-col hidden lg:flex"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
          >
            <div className="p-4 border-b border-[#e5e7eb]">
              <h2 className="font-extrabold text-[#1a1a1a] text-base leading-5">
                Cuộc trò chuyện
              </h2>
            </div>

            <div className="p-3 border-b border-[#e5e7eb]">
              <div className="relative">
                <input
                  className="w-full rounded-md border border-[#e5e7eb] bg-white py-2 pl-10 pr-3 text-xs text-[#6b7280] placeholder-[#6b7280] focus:outline-none focus:ring-1 focus:ring-[#3b82f6]"
                  placeholder="Tìm kiếm bạn bè hoặc cuộc trò chuyện..."
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
                <i className="fas fa-search absolute left-3 top-1/2 -translate-y-1/2 text-[#6b7280] text-xs"></i>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto scrollbar-thin">
              {isLoading ? (
                <div className="flex justify-center items-center h-32">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#3b82f6]"></div>
                </div>
              ) : searchQuery.trim().length >= 2 ? (
                <div>
                  {isSearching ? (
                    <div className="flex justify-center items-center h-32">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#3b82f6]"></div>
                    </div>
                  ) : searchResults.length === 0 ? (
                    <div className="flex justify-center items-center h-32 text-[#6b7280]">
                      <p>Không tìm thấy kết quả nào</p>
                    </div>
                  ) : (
                    <div className="p-2">
                      <h4 className="text-xs font-semibold text-[#6b7280] mb-2 px-2">
                        Kết quả tìm kiếm ({searchResults.length})
                      </h4>
                      {searchResults.map((result, index) => (
                        <motion.button
                          key={`${result.type}-${result.id}`}
                          className="w-full flex items-center gap-3 px-3 py-2 hover:bg-[#f3f4f6] focus:outline-none transition-colors border-l-4 border-transparent"
                          type="button"
                          onClick={() => handleSearchResultClick(result)}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: 0.1 + index * 0.05 }}
                          whileHover={{ x: 2 }}
                          whileTap={{ scale: 0.98 }}
                        >
                          <div className="relative">
                            <img
                              alt={`Profile picture of ${result.displayName || result.email}`}
                              className="w-10 h-10 rounded-full object-cover"
                              height="40"
                              src={result.avatarUrl || 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDgiIGhlaWdodD0iNDgiIHZpZXdCb3g9IjAgMCA0OCA0OCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPGNpcmNsZSBjeD0iMjQiIGN5PSIyNCIgcj0iMjQiIGZpbGw9IiMzYjgyZjYiLz4KPHN2ZyB4PSIxMiIgeT0iMTIiIHdpZHRoPSIyNCIgaGVpZ2h0PSIyNCIgdmlld0JveD0iMCAwIDI0IDI0IiBmaWxsPSJub25lIj4KPHBhdGggZD0iTTEyIDEyQzE0LjIwOTEgMTIgMTYgMTAuMjA5MSAxNiA4QzE2IDUuNzkwODYgMTQuMjA5MSA0IDEyIDRDOS43OTA4NiA0IDggNS43OTA4NiA4IDhDOCAxMC4yMDkxIDkuNzkwODYgMTIgMTIgMTJaIiBmaWxsPSJ3aGl0ZSIvPgo8cGF0aCBkPSJNMTIgMTRDOC42ODYyOSAxNCA2IDE2LjY4NjMgNiAyMFYyMkgxOFYyMEMxOCAxNi42ODYzIDE1LjMxMzcgMTQgMTIgMTRaIiBmaWxsPSJ3aGl0ZSIvPgo8L3N2Zz4KPC9zdmc+'}
                              width="40"
                            />
                            <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-green-500 rounded-full border-2 border-white"></div>
                          </div>
                          <div className="flex-1 text-left">
                            <p className="font-extrabold text-xs text-[#1a1a1a] leading-5">
                              {result.displayName || result.email}
                            </p>
                            <p className="text-xs text-[#6b7280]">
                              Bạn bè
                            </p>
                          </div>
                          <div className="text-[10px] text-[#9ca3af]">
                            <i className="fas fa-user"></i>
                          </div>
                        </motion.button>
                      ))}
                    </div>
                  )}
                </div>
              ) : conversations.length === 0 ? (
                <div className="flex justify-center items-center h-32 text-[#6b7280]">
                  <p>Chưa có cuộc trò chuyện nào</p>
                </div>
              ) : (
                conversations.map((conversation, index) => {
                  const otherMember = conversation.type === 'direct'
                    ? conversation.members.find(member => member.userId !== user?.id)
                    : null;

                  const displayName = conversation.type === 'direct'
                    ? (otherMember?.displayName || otherMember?.username || 'Unknown')
                    : (conversation.title || 'Group Chat');

                  const avatar = conversation.type === 'direct'
                    ? (otherMember?.avatarUrl || 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDgiIGhlaWdodD0iNDgiIHZpZXdCb3g9IjAgMCA0OCA0OCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPGNpcmNsZSBjeD0iMjQiIGN5PSIyNCIgcj0iMjQiIGZpbGw9IiMzYjgyZjYiLz4KPHN2ZyB4PSIxMiIgeT0iMTIiIHdpZHRoPSIyNCIgaGVpZ2h0PSIyNCIgdmlld0JveD0iMCAwIDI0IDI0IiBmaWxsPSJub25lIj4KPHBhdGggZD0iTTEyIDEyQzE0LjIwOTEgMTIgMTYgMTAuMjA5MSAxNiA4QzE2IDUuNzkwODYgMTQuMjA5MSA0IDEyIDRDOS43OTA4NiA0IDggNS43OTA4NiA4IDhDOCAxMC4yMDkxIDkuNzkwODYgMTIgMTIgMTJaIiBmaWxsPSJ3aGl0ZSIvPgo8cGF0aCBkPSJNMTIgMTRDOC42ODYyOSAxNCA2IDE2LjY4NjMgNiAyMFYyMkgxOFYyMEMxOCAxNi42ODYzIDE1LjMxMzcgMTQgMTIgMTRaIiBmaWxsPSJ3aGl0ZSIvPgo8L3N2Zz4KPC9zdmc+')
                    : (conversation.avatarUrl || 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDgiIGhlaWdodD0iNDgiIHZpZXdCb3g9IjAgMCA0OCA0OCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPGNpcmNsZSBjeD0iMjQiIGN5PSIyNCIgcj0iMjQiIGZpbGw9IiMzYjgyZjYiLz4KPHN2ZyB4PSIxMiIgeT0iMTIiIHdpZHRoPSIyNCIgaGVpZ2h0PSIyNCIgdmlld0JveD0iMCAwIDI0IDI0IiBmaWxsPSJub25lIj4KPHBhdGggZD0iTTEyIDEyQzE0LjIwOTEgMTIgMTYgMTAuMjA5MSAxNiA4QzE2IDUuNzkwODYgMTQuMjA5MSA0IDEyIDRDOS43OTA4NiA0IDggNS43OTA4NiA4IDhDOCAxMC4yMDkxIDkuNzkwODYgMTIgMTIgMTJaIiBmaWxsPSJ3aGl0ZSIvPgo8cGF0aCBkPSJNMTIgMTRDOC42ODYyOSAxNCA2IDE2LjY4NjMgNiAyMFYyMkgxOFYyMEMxOCAxNi42ODYzIDE1LjMxMzcgMTQgMTIgMTRaIiBmaWxsPSJ3aGl0ZSIvPgo8L3N2Zz4KPC9zdmc+');

                  const isActive = conversation.type === 'direct'
                    ? otherMember?.isOnline
                    : conversation.isOnline;

                  const lastMessage = conversation.lastMessage?.content || 'Chưa có tin nhắn';
                  const lastMessageTime = conversation.lastMessage?.createdAt
                    ? new Date(conversation.lastMessage.createdAt).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' })
                    : '';

                  return (
                    <motion.button
                      key={conversation.id}
                      className={`w-full flex items-center gap-3 px-3 py-2 hover:bg-[#f3f4f6] focus:outline-none transition-colors ${currentConversation?.id === conversation.id
                          ? 'border-l-4 border-[#3b82f6] bg-[#f9fafc]'
                          : 'border-l-4 border-transparent'
                        }`}
                      type="button"
                      onClick={() => selectConversation(conversation)}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.1 + index * 0.05 }}
                      whileHover={{ x: 2 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      <div className="relative">
                        <img
                          alt={`Profile picture of ${displayName}`}
                          className="w-10 h-10 rounded-full object-cover"
                          height="40"
                          src={avatar}
                          width="40"
                        />
                        {isActive && (
                          <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-green-500 rounded-full border-2 border-white"></div>
                        )}
                      </div>
                      <div className="flex-1 text-left">
                        <p className="font-extrabold text-xs text-[#1a1a1a] leading-5">
                          {displayName}
                        </p>
                        <p className="text-xs text-[#6b7280] truncate max-w-[160px]">
                          {lastMessage}
                        </p>
                      </div>
                      <div className="flex flex-col items-end text-[10px] text-[#9ca3af]">
                        <span>{lastMessageTime}</span>
                        {conversation.unreadCount > 0 && (
                          <span className="mt-1 inline-block min-w-[18px] h-5 text-center text-white text-xs font-semibold rounded-full bg-[#3b82f6]">
                            {conversation.unreadCount}
                          </span>
                        )}
                      </div>
                    </motion.button>
                  );
                })
              )}
            </div>
          </motion.div>

          <div className="chat-area flex-1 flex flex-col bg-white h-full overflow-hidden">
            <motion.div
              className="flex items-center justify-between px-4 lg:px-5 py-3 border-b border-[#e5e7eb] bg-white"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
            >
              <div className="flex items-center gap-3">
                {activeSidebarItem === 'friends' ? (
                  <div className="flex items-center gap-3">
                    <i className="fas fa-users text-2xl text-[#3b82f6]"></i>
                    <div>
                      <h3 className="font-extrabold text-sm text-[#1a1a1a] leading-5">
                        Bạn bè
                      </h3>
                      <p className="text-xs text-[#6b7280]">{friends.length} bạn bè</p>
                    </div>
                  </div>
                ) : (
                  <>
                    <img
                      alt={`Profile picture of ${currentContact?.name}`}
                      className="w-10 h-10 rounded-full object-cover"
                      height="40"
                      src={currentContact?.avatarUrl}
                      width="40"
                    />
                    <div>
                      <h3 className="font-extrabold text-sm text-[#1a1a1a] leading-5">
                        {currentContact?.name}
                      </h3>
                      <p className="text-xs text-[#6b7280]">{presenceText}</p>
                    </div>
                  </>
                )}
              </div>

              {activeSidebarItem !== 'friends' && (
                <div className="flex items-center gap-2">
                  <motion.button
                    className="w-10 h-10 text-[#6b7280] hover:text-[#3b82f6] focus:outline-none transition-colors"
                    onClick={() => handleCall('audio')}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    disabled={isCalling}
                  >
                    <i className="fas fa-phone text-lg"></i>
                  </motion.button>

                  <motion.button
                    className="w-10 h-10 text-[#6b7280] hover:text-[#3b82f6] focus:outline-none transition-colors"
                    onClick={() => handleCall('video')}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    disabled={isCalling}
                  >
                    <i className="fas fa-video text-lg"></i>
                  </motion.button>

                  <motion.button
                    className="w-10 h-10 text-[#6b7280] hover:text-[#3b82f6] focus:outline-none transition-colors"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <i className="fas fa-info-circle text-lg"></i>
                  </motion.button>
                </div>
              )}
            </motion.div>

            <div className="messages-container flex-1 overflow-y-auto min-h-0">
              {activeSidebarItem === 'friends' ? (
                <FriendsList 
                  onSelectFriend={(friend) => {
                    setActiveSidebarItem('chats');
                  }}
                  onFriendRemoved={() => {
                    // Reload friends when a friend is removed
                    console.log('Friend removed, reloading friends list');
                    loadFriends();
                  }}
                />
              ) : (
                <div className="px-4 lg:px-5 py-4 space-y-4 min-h-full">
                  {!currentConversation ? (
                    <div className="flex justify-center items-center h-full text-[#6b7280]">
                      <p>Chọn một cuộc trò chuyện để bắt đầu</p>
                    </div>
                  ) : isLoading && messages.length === 0 ? (
                    <div className="flex justify-center items-center h-full">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#3b82f6]"></div>
                    </div>
                  ) : messages.length === 0 ? (
                    <div className="flex justify-center items-center h-full text-[#6b7280]">
                      <p>Chưa có tin nhắn nào</p>
                    </div>
                  ) : (
                    <>
                      {(() => {
                        const timelineItems = [
                          ...messages.map((m) => ({ type: 'message' as const, time: m.createdAt, data: m })),
                          ...callHistory.map((c) => ({ type: 'call' as const, time: c.createdAt || c.startedAt || c.endedAt, data: c }))
                        ]
                        .filter(item => !!item.time)
                        .sort((a, b) => new Date(a.time as string).getTime() - new Date(b.time as string).getTime());

                        return timelineItems.map((item, index) => {
                          if (item.type === 'message') {
                            const msg = item.data;
                            const isOutgoing = msg.senderId === user?.id;
                            const fullDateTime = new Date(msg.createdAt).toLocaleString('vi-VN', {
                              weekday: 'long',
                              year: 'numeric',
                              month: 'long',
                              day: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit',
                              hour12: false
                            });

                            const isOptimisticMessage = msg.id.startsWith('temp-');
                            const isNewMessage = index === messages.length - 1;
                            const isFromCache = !isLoading;
                            const shouldDisableAnimation = isOptimisticMessage || isNewMessage || isFromCache || justSelectedConversation;

                            return (
                              <motion.div
                                key={`msg-${msg.id}`}
                                className={`flex items-end gap-2 mb-2 group/message ${isOutgoing ? 'flex-row-reverse' : 'flex-row'}`}
                                initial={shouldDisableAnimation ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={shouldDisableAnimation ? { duration: 0 } : { delay: 0.4 + index * 0.1 }}
                                onMouseEnter={() => {
                                  if (showMoreMenu && showMoreMenu !== msg.id) {
                                    setShowMoreMenu(null);
                                  }
                                }}
                              >
                                {!isOutgoing && (
                                  <div className="w-8 h-8 rounded-full overflow-hidden flex-shrink-0">
                                    <img
                                      src={currentContact?.avatarUrl || 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDgiIGhlaWdodD0iNDgiIHZpZXdCb3g9IjAgMCA0OCA0OCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPGNpcmNsZSBjeD0iMjQiIGN5PSIyNCIgcj0iMjQiIGZpbGw9IiMzYjgyZjYiLz4KPHN2ZyB4PSIxMiIgeT0iMTIiIHdpZHRoPSIyNCIgaGVpZ2h0PSIyNCIgdmlld0JveD0iMCAwIDI0IDI0IiBmaWxsPSJub25lIj4KPHBhdGggZD0iTTEyIDEyQzE0LjIwOTEgMTIgMTYgMTAuMjA5MSAxNiA4QzE2IDUuNzkwODYgMTQuMjA5MSA0IDEyIDRDOS43OTA4NiA0IDggNS43OTA4NiA4IDhDOCAxMC4yMDkxIDkuNzkwODYgMTIgMTIgMTJaIiBmaWxsPSJ3aGl0ZSIvPgo8cGF0aCBkPSJNMTIgMTRDOC42ODYyOSAxNCA2IDE2LjY4NjMgNiAyMFYyMkgxOFYyMEMxOCAxNi42ODYzIDE1LjMxMzcgMTQgMTIgMTRaIiBmaWxsPSJ3aGl0ZSIvPgo8L3N2Zz4KPC9zdmc+'}
                                      alt="Avatar"
                                      className="w-full h-full object-cover"
                                    />
                                  </div>
                                )}

                                <div className={`flex items-end gap-2 ${isOutgoing ? 'flex-row-reverse' : 'flex-row'}`}>
                                  <div className={`max-w-[70%] ${isOutgoing ? 'ml-auto' : ''}`}>
                                    {isOutgoing ? (
                                      <div className={`bg-[#3b82f6] rounded-2xl rounded-br-md p-3 text-white group relative ${isOptimisticMessage ? 'opacity-80' : ''}`}>
                                        <p className="text-sm leading-5">{msg.content}</p>
                                        {isOptimisticMessage && (
                                          <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-white/30 rounded-full flex items-center justify-center">
                                            <div className="w-1.5 h-1.5 bg-white rounded-full animate-pulse"></div>
                                          </div>
                                        )}
                                        <div className="absolute top-1/2 -left-2 transform -translate-y-1/2 -translate-x-full bg-gray-800 text-white text-xs px-2 py-1 rounded shadow-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-10">
                                          {fullDateTime}
                                        </div>
                                      </div>
                                    ) : (
                                      <div className="bg-[#f1f3f4] rounded-2xl rounded-bl-md p-3 group relative">
                                        <p className="text-sm text-[#1a1a1a] leading-5">{msg.content}</p>
                                        <div className="absolute top-1/2 -right-2 transform -translate-y-1/2 translate-x-full bg-gray-800 text-white text-xs px-2 py-1 rounded shadow-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-10">
                                          {fullDateTime}
                                        </div>
                                      </div>
                                    )}
                                  </div>

                                  <div className={`flex items-center gap-1 opacity-0 group-hover/message:opacity-100 transition-opacity duration-200 ${isOutgoing ? 'mr-2' : 'ml-2'}`}>
                                    <button
                                      onClick={() => handleReplyToMessage(msg)}
                                      className="p-1.5 text-gray-500 hover:text-blue-500 hover:bg-blue-50 rounded-full transition-colors"
                                      title="Trả lời"
                                    >
                                      <i className="fas fa-reply text-sm"></i>
                                    </button>

                                    <button
                                      onClick={() => handleReactionToMessage(msg)}
                                      className="p-1.5 text-gray-500 hover:text-yellow-500 hover:bg-yellow-50 rounded-full transition-colors"
                                      title="Cảm xúc"
                                    >
                                      <i className="fas fa-smile text-sm"></i>
                                    </button>

                                    <div className="relative">
                                      <button
                                        onMouseDown={(e) => {
                                          e.preventDefault();
                                          e.stopPropagation();
                                          if (showMoreMenu === msg.id) {
                                            setShowMoreMenu(null);
                                          } else {
                                            setShowMoreMenu(msg.id);
                                          }
                                        }}
                                        className="p-1.5 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-full transition-colors"
                                        title="Tùy chọn"
                                      >
                                        <i className="fas fa-ellipsis-h text-sm"></i>
                                      </button>

                                      <MessagePopupMenu
                                        isOpen={showMoreMenu === msg.id}
                                        onClose={() => setShowMoreMenu(null)}
                                        onRecall={() => handleRecallMessage(msg.id)}
                                        onForward={() => handleForwardMessage(msg)}
                                        onReply={() => handleReplyToMessage(msg)}
                                        onReact={() => handleReactionToMessage(msg)}
                                        isOutgoing={isOutgoing}
                                        position={isOutgoing ? 'right' : 'left'}
                                      />
                                    </div>
                                  </div>
                                </div>
                              </motion.div>
                            );
                          }

                          // call item
                          const call = item.data;
                          const isOutgoingCall = call.initiatorId === user?.id;
                          return (
                            <motion.div
                              key={`call-${call.id}`}
                              className="mb-2"
                              initial={{ opacity: 0, y: 10 }}
                              animate={{ opacity: 1, y: 0 }}
                              transition={{ delay: index * 0.05 }}
                            >
                              <CallHistoryMessage
                                call={call}
                                isOutgoing={isOutgoingCall}
                                onCallBack={handleCallBack}
                              />
                            </motion.div>
                          );
                        });
                      })()}

                      {typingUsers.size > 0 && (
                        <motion.div
                          className="flex items-end gap-2 mb-2"
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                        >
                          <div className="w-8 h-8 rounded-full overflow-hidden flex-shrink-0">
                            <img
                              src={currentContact?.avatarUrl || 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDgiIGhlaWdodD0iNDgiIHZpZXdCb3g9IjAgMCA0OCA0OCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPGNpcmNsZSBjeD0iMjQiIGN5PSIyNCIgcj0iMjQiIGZpbGw9IiMzYjgyZjYiLz4KPHN2ZyB4PSIxMiIgeT0iMTIiIHdpZHRoPSIyNCIgaGVpZ2h0PSIyNCIgdmlld0JveD0iMCAwIDI0IDI0IiBmaWxsPSJub25lIj4KPHBhdGggZD0iTTEyIDEyQzE0LjIwOTEgMTIgMTYgMTAuMjA5MSAxNiA4QzE2IDUuNzkwODYgMTQuMjA5MSA0IDEyIDRDOS43OTA4NiA0IDggNS43OTA4NiA4IDhDOCAxMC4yMDkxIDkuNzkwODYgMTIgMTIgMTJaIiBmaWxsPSJ3aGl0ZSIvPgo8cGF0aCBkPSJNMTIgMTRDOC42ODYyOSAxNCA2IDE2LjY4NjMgNiAyMFYyMkgxOFYyMEMxOCAxNi42ODYzIDE1LjMxMzcgMTQgMTIgMTRaIiBmaWxsPSJ3aGl0ZSIvPgo8L3N2Zz4KPC9zdmc+'}
                              alt="Avatar"
                              className="w-full h-full object-cover"
                            />
                          </div>
                          <div className="max-w-[70%]">
                            <div className="typing-indicator bg-[#f1f3f4] rounded-2xl rounded-bl-md p-3">
                              <div className="typing-dot"></div>
                              <div className="typing-dot"></div>
                              <div className="typing-dot"></div>
                              <span className="text-xs text-[#6b7280] ml-2">
                                {Array.from(typingUsers).length === 1 ? 'đang nhập...' : 'đang nhập...'}
                              </span>
                            </div>
                          </div>
                        </motion.div>
                      )}

                      {isLoading && messages.length > 0 && (
                        <div className="flex justify-center py-2">
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-[#3b82f6]"></div>
                        </div>
                      )}

                      <div ref={messagesEndRef} className="h-1" />
                    </>
                  )}
                </div>
              )}
            </div>

            {activeSidebarItem !== 'friends' && (
              <motion.div
                className="input-area flex items-center gap-2 lg:gap-3 border-t border-[#e5e7eb] px-4 lg:px-5 py-3 flex-shrink-0 bg-white"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.6 }}
              >
                <div className="flex items-center gap-2">
                  <motion.button
                    aria-label="Voice message"
                    className="text-[#6b7280] text-lg focus:outline-none hover:text-[#3b82f6] transition-colors"
                    type="button"
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                  >
                    <i className="fas fa-microphone"></i>
                  </motion.button>

                  <motion.button
                    aria-label="Camera"
                    className="text-[#6b7280] text-lg focus:outline-none hover:text-[#3b82f6] transition-colors"
                    type="button"
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                  >
                    <i className="fas fa-camera"></i>
                  </motion.button>

                  <motion.button
                    aria-label="Gallery"
                    className="text-[#6b7280] text-lg focus:outline-none hover:text-[#3b82f6] transition-colors"
                    type="button"
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                  >
                    <i className="fas fa-images"></i>
                  </motion.button>

                  <motion.button
                    aria-label="Sticker"
                    className="text-[#6b7280] text-lg focus:outline-none hover:text-[#3b82f6] transition-colors"
                    type="button"
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                  >
                    <i className="fas fa-sticker-mule"></i>
                  </motion.button>

                  <motion.button
                    aria-label="GIF"
                    className="text-[#6b7280] text-sm font-semibold px-2 py-1 rounded focus:outline-none hover:text-[#3b82f6] transition-colors"
                    type="button"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    GIF
                  </motion.button>
                </div>

                <input
                  className="flex-1 border border-[#e5e7eb] rounded-full py-2 px-4 text-sm text-[#6b7280] focus:outline-none focus:ring-1 focus:ring-[#3b82f6] transition-all bg-[#f8f9fa]"
                  placeholder={currentConversation ? "Aa" : "Chọn cuộc trò chuyện để bắt đầu"}
                  type="text"
                  value={message}
                  onChange={(e) => {
                    setMessage(e.target.value);
                    handleTyping();
                  }}
                  onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                  disabled={!currentConversation}
                />

                <div className="flex items-center gap-2">
                  <motion.button
                    aria-label="Emoji"
                    className="text-[#6b7280] text-lg focus:outline-none hover:text-[#3b82f6] transition-colors"
                    type="button"
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                  >
                    <i className="far fa-smile"></i>
                  </motion.button>

                  {message.trim() ? (
                    <motion.button
                      aria-label="Send message"
                      className="bg-[#3b82f6] rounded-full w-10 h-10 flex items-center justify-center text-white text-lg hover:bg-[#2563eb] focus:outline-none transition-colors"
                      type="button"
                      onClick={handleSendMessage}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      <i className="fas fa-paper-plane"></i>
                    </motion.button>
                  ) : (
                    <motion.button
                      aria-label="Send like"
                      className="text-[#6b7280] text-lg focus:outline-none hover:text-[#3b82f6] transition-colors"
                      type="button"
                      onClick={handleSendLike}
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                    >
                      <i className="fas fa-thumbs-up"></i>
                    </motion.button>
                  )}
                </div>
              </motion.div>
            )}
          </div>
        </div>
      </div>

      <AnimatePresence>
        {isCalling && (
          <motion.div
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className="bg-white rounded-lg p-6 lg:p-8 text-center mx-4"
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
            >
              <div className="w-16 h-16 lg:w-20 lg:h-20 bg-blue-500 rounded-full flex items-center justify-center mx-auto mb-4">
                <i className="fas fa-phone text-white text-xl lg:text-2xl"></i>
              </div>
              <h3 className="text-base lg:text-lg font-semibold mb-2">Đang kết nối...</h3>
              <p className="text-sm lg:text-base text-gray-600">Vui lòng chờ trong giây lát</p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <FriendRequestModal
        isOpen={showFriendRequestModal}
        onClose={() => setShowFriendRequestModal(false)}
      />

      <AddFriendModal
        isOpen={showAddFriendModal}
        onClose={() => setShowAddFriendModal(false)}
      />

      {/* Call Modal */}
      <CallModal
        isOpen={isCallModalOpen}
        onClose={closeCallModal}
        callState={callState}
        onAcceptCall={acceptCall}
        onRejectCall={rejectCall}
        onEndCall={endCall}
        onToggleMute={toggleMute}
        onToggleVideo={toggleVideo}
        onSwitchCamera={switchCamera}
        callerName={callerName}
      />

      {/* Call Alert Dialog */}
      <ConfirmDialog
        isOpen={showCallAlert}
        onClose={() => setShowCallAlert(false)}
        onConfirm={() => setShowCallAlert(false)}
        title="Thông báo"
        message={callAlertMessage}
        confirmText="OK"
        cancelText=""
        confirmButtonColor="blue"
        isLoading={false}
      />

      {/* Incoming Call Notification */}
      <IncomingCallNotification
        isVisible={showIncomingCallNotification}
        callerName={callerInfo?.name || callerName || 'Unknown'}
        callerAvatar={callerInfo?.avatar}
        onAccept={acceptCall}
        onReject={rejectCall}
      />

      {/* Permission Instructions Modal */}
      <PermissionInstructionsModal
        isOpen={showPermissionModal}
        onClose={() => setShowPermissionModal(false)}
        type={permissionType}
      />
    </div>
  );
};

export default ChatUI;
