import React, { useState } from 'react';
import { motion } from 'framer-motion';

interface Contact {
  id: string;
  name: string;
  lastMessage: string;
  date: string;
  unreadCount?: number;
  avatar: string;
  isActive?: boolean;
}

interface Message {
  id: string;
  text: string;
  time: string;
  isOutgoing: boolean;
}

const ChatUI: React.FC = () => {
  const [selectedContact, setSelectedContact] = useState<string>('1');
  const [message, setMessage] = useState<string>('');
  const [isCalling, setIsCalling] = useState<boolean>(false);

  const contacts: Contact[] = [
    {
      id: '1',
      name: 'Huỳnh Omar',
      lastMessage: 'Đảm bảo lúc 8 giờ tối',
      date: '02 Thg 2',
      unreadCount: 3,
      avatar: 'https://storage.googleapis.com/a1aa/image/ffcf44ae-0fb9-4ee9-89be-afbe69058bdd.jpg',
      isActive: true
    },
    {
      id: '2',
      name: 'Hali',
      lastMessage: 'nguyên mẫu ban đầu của',
      date: '02 Thg 2',
      unreadCount: 1,
      avatar: 'https://storage.googleapis.com/a1aa/image/07bfb141-f638-4047-819f-da44a1636bb8.jpg'
    },
    {
      id: '3',
      name: 'Alice Nguyễn',
      lastMessage: 'Hãy gặp nhau vào ngày m',
      date: '03 Thg 2',
      avatar: 'https://storage.googleapis.com/a1aa/image/f1c54fb4-2a4f-4efc-77ff-84fd55a3c6fd.jpg'
    },
    {
      id: '4',
      name: 'Bảo Trần',
      lastMessage: 'Kiểm tra thiết kế mới',
      date: '03 Thg 2',
      unreadCount: 5,
      avatar: 'https://storage.googleapis.com/a1aa/image/5035def1-32ea-4f20-a22b-0a5c3f707ffd.jpg'
    },
    {
      id: '5',
      name: 'Lê Carol',
      lastMessage: 'Có chuyện gì vậy',
      date: '04 Thg 2',
      avatar: 'https://storage.googleapis.com/a1aa/image/1d82c115-2f95-42e7-9f4a-9901a616324c.jpg'
    },
    {
      id: '6',
      name: 'Đại Kim',
      lastMessage: 'Chào',
      date: '04 Thg 2',
      avatar: 'https://storage.googleapis.com/a1aa/image/d66428e2-ef89-4a26-9592-25191348531c.jpg'
    }
  ];

  const messages: Message[] = [
    { id: '1', text: 'Xin chào!', time: '20:25', isOutgoing: false },
    { id: '2', text: 'Bạn có khỏe không?', time: '20:26', isOutgoing: true },
    { id: '3', text: 'Tốt, cảm ơn bạn!', time: '20:27', isOutgoing: false },
    { id: '4', text: 'Bạn đã xem bản thiết kế mới chưa?', time: '20:28', isOutgoing: true },
    { id: '5', text: 'Chưa, tôi sẽ xem sớm. Đảm bảo lúc 8 giờ tối.', time: '20:29', isOutgoing: false }
  ];

  const handleSendMessage = () => {
    if (message.trim()) {
      // Add message logic here
      setMessage('');
    }
  };

  const handleCall = (type: 'voice' | 'video') => {
    setIsCalling(true);
    // Simulate call
    setTimeout(() => {
      setIsCalling(false);
      alert(`${type === 'voice' ? 'Cuộc gọi thoại' : 'Cuộc gọi video'} đang được kết nối...`);
    }, 1000);
  };

  const currentContact = contacts.find(c => c.id === selectedContact);

  return (
    <div className="bg-[#f9fafc] min-h-screen flex items-center justify-center p-4 font-sans text-sm text-[#1a1a1a]">
      <motion.div 
        className="flex max-w-[1024px] w-full h-[720px] bg-white rounded-md shadow-md border border-[#e5e7eb]"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        {/* Left Sidebar */}
        <div className="w-[280px] border-r border-[#e5e7eb] flex flex-col">
          {/* Header */}
          <motion.div 
            className="p-4 border-b border-[#e5e7eb]"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.1 }}
          >
            <h2 className="font-extrabold text-[#1a1a1a] text-base leading-5">
              Cuộc gọi
            </h2>
          </motion.div>

          {/* Search */}
          <motion.div 
            className="p-3 border-b border-[#e5e7eb]"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
          >
            <div className="relative">
              <input 
                className="w-full rounded-md border border-[#e5e7eb] bg-white py-2 pl-10 pr-3 text-xs text-[#6b7280] placeholder-[#6b7280] focus:outline-none focus:ring-1 focus:ring-[#3b82f6]" 
                placeholder="Tìm kiếm..." 
                type="text"
              />
              <i className="fas fa-search absolute left-3 top-1/2 -translate-y-1/2 text-[#6b7280] text-xs"></i>
            </div>
          </motion.div>

          {/* Contact List */}
          <div className="flex-1 overflow-y-auto scrollbar-thin">
            {contacts.map((contact, index) => (
              <motion.button
                key={contact.id}
                className={`w-full flex items-center gap-3 px-3 py-2 hover:bg-[#f3f4f6] focus:outline-none transition-colors ${
                  selectedContact === contact.id 
                    ? 'border-l-4 border-[#3b82f6] bg-[#f9fafc]' 
                    : 'border-l-4 border-transparent'
                }`}
                type="button"
                onClick={() => setSelectedContact(contact.id)}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.1 + index * 0.05 }}
                whileHover={{ x: 2 }}
                whileTap={{ scale: 0.98 }}
              >
                <div className="relative">
                  <img 
                    alt={`Profile picture of ${contact.name}`} 
                    className="w-10 h-10 rounded-full object-cover" 
                    height="40" 
                    src={contact.avatar} 
                    width="40"
                  />
                  {contact.isActive && (
                    <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-green-500 rounded-full border-2 border-white"></div>
                  )}
                </div>
                <div className="flex-1 text-left">
                  <p className="font-extrabold text-xs text-[#1a1a1a] leading-5">
                    {contact.name}
                  </p>
                  <p className="text-xs text-[#6b7280] truncate max-w-[160px]">
                    {contact.lastMessage}
                  </p>
                </div>
                <div className="flex flex-col items-end text-[10px] text-[#9ca3af]">
                  <span>{contact.date}</span>
                  {contact.unreadCount && (
                    <span className="mt-1 inline-block min-w-[18px] h-5 text-center text-white text-xs font-semibold rounded-full bg-[#3b82f6]">
                      {contact.unreadCount}
                    </span>
                  )}
                </div>
              </motion.button>
            ))}
          </div>
        </div>

        {/* Right Chat Area */}
        <div className="flex-1 flex flex-col">
          {/* Header with Call Buttons */}
          <motion.div 
            className="flex items-center justify-between px-5 py-3 border-b border-[#e5e7eb]"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
          >
            <div className="flex items-center gap-3">
              <img 
                alt={`Profile picture of ${currentContact?.name}`} 
                className="w-10 h-10 rounded-full object-cover" 
                height="40" 
                src={currentContact?.avatar} 
                width="40"
              />
              <h3 className="font-extrabold text-xs text-[#1a1a1a] leading-5">
                {currentContact?.name}
              </h3>
            </div>
            
            {/* Call Buttons */}
            <div className="flex items-center gap-2">
              <motion.button
                className="w-10 h-10 bg-green-500 rounded-full flex items-center justify-center text-white hover:bg-green-600 focus:outline-none focus:ring-2 focus:ring-green-300 transition-colors"
                onClick={() => handleCall('voice')}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                disabled={isCalling}
              >
                <i className="fas fa-phone text-sm"></i>
              </motion.button>
              
              <motion.button
                className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center text-white hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-300 transition-colors"
                onClick={() => handleCall('video')}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                disabled={isCalling}
              >
                <i className="fas fa-video text-sm"></i>
              </motion.button>
            </div>
          </motion.div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto px-5 py-4 space-y-8">
            {messages.map((msg, index) => (
              <motion.div
                key={msg.id}
                className={`max-w-[60%] ${msg.isOutgoing ? 'ml-auto' : ''}`}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 + index * 0.1 }}
              >
                {msg.isOutgoing ? (
                  <div className="bg-[#3b82f6] rounded-md p-3 text-white text-xs leading-5">
                    <p>{msg.text}</p>
                    <p className="text-[10px] text-[#bfdbfe] mt-1">{msg.time}</p>
                  </div>
                ) : (
                  <div>
                    <p className="text-xs text-[#1a1a1a] leading-5">{msg.text}</p>
                    <p className="text-[10px] text-[#6b7280] mt-1">{msg.time}</p>
                  </div>
                )}
              </motion.div>
            ))}
          </div>

          {/* Action Buttons */}
          <motion.div 
            className="flex justify-center gap-4 border-t border-[#e5e7eb] py-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
          >
            <motion.button 
              className="border border-[#e5e7eb] rounded-md px-5 py-2 text-xs font-semibold text-[#1a1a1a] hover:bg-[#f3f4f6] focus:outline-none transition-colors" 
              type="button"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              Yêu cầu thăm
            </motion.button>
            <motion.button 
              className="border border-[#e5e7eb] rounded-md px-5 py-2 text-xs font-semibold text-[#1a1a1a] hover:bg-[#f3f4f6] focus:outline-none transition-colors" 
              type="button"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              Tạo đề nghị
            </motion.button>
          </motion.div>

          {/* Input Area */}
          <motion.div 
            className="flex items-center gap-3 border-t border-[#e5e7eb] px-5 py-3"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6 }}
          >
            <motion.button 
              aria-label="Emoji" 
              className="text-[#6b7280] text-lg focus:outline-none hover:text-[#3b82f6] transition-colors" 
              type="button"
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
            >
              <i className="far fa-smile"></i>
            </motion.button>
            
            <input 
              className="flex-1 border border-[#e5e7eb] rounded-md py-2 px-3 text-xs text-[#6b7280] focus:outline-none focus:ring-1 focus:ring-[#3b82f6] transition-all" 
              placeholder="Nhập tin nhắn..." 
              type="text"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
            />
            
            <motion.button 
              aria-label="Attach file" 
              className="text-[#6b7280] text-lg focus:outline-none hover:text-[#3b82f6] transition-colors" 
              type="button"
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
            >
              <i className="fas fa-paperclip"></i>
            </motion.button>
            
            <motion.button 
              aria-label="Send message" 
              className="bg-[#3b82f6] rounded-full w-10 h-10 flex items-center justify-center text-white text-lg hover:bg-[#2563eb] focus:outline-none transition-colors" 
              type="button"
              onClick={handleSendMessage}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              disabled={!message.trim()}
            >
              <i className="fas fa-paper-plane"></i>
            </motion.button>
          </motion.div>
        </div>
      </motion.div>

      {/* Calling Overlay */}
      {isCalling && (
        <motion.div
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <motion.div
            className="bg-white rounded-lg p-8 text-center"
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.8, opacity: 0 }}
          >
            <div className="w-20 h-20 bg-blue-500 rounded-full flex items-center justify-center mx-auto mb-4">
              <i className="fas fa-phone text-white text-2xl"></i>
            </div>
            <h3 className="text-lg font-semibold mb-2">Đang kết nối...</h3>
            <p className="text-gray-600">Vui lòng chờ trong giây lát</p>
          </motion.div>
        </motion.div>
      )}
    </div>
  );
};

export default ChatUI;
