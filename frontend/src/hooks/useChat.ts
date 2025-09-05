import { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';
import chatApi from '../api/chatApi';
import websocketService from '../services/websocketService';
import { Message, Conversation, TypingIndicator, ReadReceipt, MessageType } from '../types/chat';

export const useChat = () => {
  const { user, token } = useAuth();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [currentConversation, setCurrentConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const [typingUsers, setTypingUsers] = useState<Set<string>>(new Set());
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom
  const scrollToBottom = useCallback(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ 
        behavior: 'smooth',
        block: 'end',
        inline: 'nearest'
      });
    }
  }, []);

  // Initialize WebSocket connection
  useEffect(() => {
    if (user?.id) {
      websocketService.connect(user.id, token || undefined)
        .then(() => {
          setIsConnected(true);
          console.log('WebSocket connected');
        })
        .catch((error) => {
          console.error('WebSocket connection failed:', error);
          setError('Failed to connect to chat service');
        });
    }

    return () => {
      websocketService.disconnect();
      setIsConnected(false);
    };
  }, [user?.id, token]);

  // Load conversations
  const loadConversations = useCallback(async () => {
    try {
      setIsLoading(true);
      const data = await chatApi.getUserConversations();
      setConversations(data);
    } catch (error) {
      console.error('Failed to load conversations:', error);
      setError((error as Error)?.message || 'Unknown error');
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Load messages for a conversation
  const loadMessages = useCallback(async (conversationId: string, page: number = 0) => {
    try {
      setIsLoading(true);
      const data = await chatApi.getMessages(conversationId, page);
      if (page === 0) {
        setMessages(data.content || []);
        // Scroll to bottom after loading messages
        setTimeout(() => scrollToBottom(), 100);
      } else {
        setMessages(prev => [...(data.content || []), ...prev]);
      }
    } catch (error) {
      console.error('Failed to load messages:', error);
      setError((error as Error)?.message || 'Unknown error');
    } finally {
      setIsLoading(false);
    }
  }, [scrollToBottom]);

  // Send message
  const sendMessage = useCallback(async (content: string, type: MessageType = MessageType.TEXT, replyToId: string | null = null) => {
    if (!currentConversation || !content.trim()) return;

    try {
      const messageRequest = {
        conversationId: currentConversation.id,
        type,
        content: content.trim(),
        replyToId: replyToId || undefined
      };

      // Send via WebSocket only (REST API is handled by backend)
      websocketService.sendMessage(currentConversation.id, messageRequest);
      
      // Scroll to bottom after sending
      setTimeout(() => scrollToBottom(), 100);
    } catch (error) {
      console.error('Failed to send message:', error);
      setError((error as Error)?.message || 'Unknown error');
    }
  }, [currentConversation, scrollToBottom]);

  // Mark message as read
  const markAsRead = useCallback(async (messageId: string) => {
    try {
      await chatApi.markAsRead(messageId);
    } catch (error) {
      console.error('Failed to mark as read:', error);
    }
  }, []);

  // Mark conversation as read
  const markConversationAsRead = useCallback(async (conversationId: string) => {
    try {
      await chatApi.markConversationAsRead(conversationId);
    } catch (error) {
      console.error('Failed to mark conversation as read:', error);
    }
  }, []);

  // Create or get direct conversation
  const createDirectConversation = useCallback(async (userId: string) => {
    try {
      const conversation = await chatApi.getOrCreateDirectConversation(userId);
      setCurrentConversation(conversation);
      await loadMessages(conversation.id);
      return conversation;
    } catch (error) {
      console.error('Failed to create direct conversation:', error);
      setError((error as Error)?.message || 'Unknown error');
      return null;
    }
  }, [loadMessages]);

  // Set current conversation
  const selectConversation = useCallback(async (conversation: Conversation) => {
    setCurrentConversation(conversation);
    await loadMessages(conversation.id);
    
    // Join conversation via WebSocket
    websocketService.joinConversation(conversation.id);
    
    // Mark as read
    await markConversationAsRead(conversation.id);
    
    // Scroll to bottom after selecting conversation
    setTimeout(() => scrollToBottom(), 200);
  }, [loadMessages, markConversationAsRead, scrollToBottom]);

  // Send typing indicator
  const sendTypingIndicator = useCallback((isTyping: boolean) => {
    if (currentConversation) {
      websocketService.sendTypingIndicator(currentConversation.id, isTyping);
    }
  }, [currentConversation]);

  // WebSocket message handlers
  useEffect(() => {
    if (!isConnected || !currentConversation) return;

    // Handle new messages
    const handleNewMessage = (message: Message) => {
      setMessages(prev => [...prev, message]);
      // Scroll to bottom after adding new message
      setTimeout(() => scrollToBottom(), 100);
    };

    // Handle typing indicators
    const handleTypingIndicator = (indicator: TypingIndicator) => {
      if (indicator.userId !== user?.id) {
        if (indicator.isTyping) {
          setTypingUsers(prev => new Set([...Array.from(prev), indicator.userId]));
        } else {
          setTypingUsers(prev => {
            const newSet = new Set(prev);
            newSet.delete(indicator.userId);
            return newSet;
          });
        }
      }
    };

    // Handle read receipts
    const handleReadReceipt = (receipt: ReadReceipt) => {
      // Update message read status
      setMessages(prev => prev.map(msg => 
        msg.id === receipt.messageId 
          ? { ...msg, isRead: true, readAt: new Date(receipt.timestamp).toISOString() }
          : msg
      ));
    };

    // Subscribe to conversation messages
    websocketService.subscribeToConversation(currentConversation.id, handleNewMessage);
    websocketService.subscribeToTyping(currentConversation.id, handleTypingIndicator);
    websocketService.subscribeToReadReceipts(currentConversation.id, handleReadReceipt);

    // Cleanup subscriptions
    return () => {
      websocketService.unsubscribe(`/topic/conversation/${currentConversation.id}`);
      websocketService.unsubscribe(`/topic/conversation/${currentConversation.id}/typing`);
      websocketService.unsubscribe(`/topic/conversation/${currentConversation.id}/read`);
    };
  }, [isConnected, currentConversation, user?.id, scrollToBottom]);

  // Load conversations on mount
  useEffect(() => {
    if (user?.id) {
      loadConversations();
    }
  }, [user?.id, loadConversations]);

  return {
    conversations,
    currentConversation,
    messages,
    isLoading,
    error,
    isConnected,
    typingUsers,
    messagesEndRef,
    loadConversations,
    loadMessages,
    sendMessage,
    markAsRead,
    markConversationAsRead,
    createDirectConversation,
    selectConversation,
    sendTypingIndicator,
    scrollToBottom,
    setError
  };
};
