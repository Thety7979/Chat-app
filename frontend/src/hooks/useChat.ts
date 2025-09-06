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

  const messagesCache = useRef<Map<string, Message[]>>(new Map());

  const [justSelectedConversation, setJustSelectedConversation] = useState<boolean>(false);

  const scrollToBottom = useCallback(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({
        behavior: 'smooth',
        block: 'end',
        inline: 'nearest'
      });
    }
  }, []);

  useEffect(() => {
    if (user?.id) {
      websocketService.connect(user.id, token || undefined)
        .then(() => {
          setIsConnected(true);
          console.log('WebSocket connected');
          
          // Subscribe to conversation updates
          websocketService.subscribeToUserConversations((conversation) => {
            console.log('Received conversation update:', conversation);
            setConversations(prev => {
              const existingIndex = prev.findIndex(conv => conv.id === conversation.id);
              if (existingIndex >= 0) {
                // Update existing conversation
                return prev.map(conv =>
                  conv.id === conversation.id ? conversation : conv
                );
              } else {
                // Add new conversation to the beginning
                return [conversation, ...prev];
              }
            });
          });
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

  const loadMessages = useCallback(async (conversationId: string, page: number = 0) => {
    try {
      const cachedMessages = messagesCache.current.get(conversationId);
      if (cachedMessages && page === 0) {
        console.log('Loading messages from cache:', conversationId);
        setMessages(cachedMessages);
        setTimeout(() => scrollToBottom(), 50);
      }

      setIsLoading(true);
      const data = await chatApi.getMessages(conversationId, page);
      const newMessages = data.content || [];

      if (page === 0) {
        setMessages(newMessages);
        messagesCache.current.set(conversationId, newMessages);
        setTimeout(() => scrollToBottom(), 100);
      } else {
        setMessages(prev => [...newMessages, ...prev]);
        const currentCached = messagesCache.current.get(conversationId) || [];
        messagesCache.current.set(conversationId, [...newMessages, ...currentCached]);
      }
    } catch (error) {
      console.error('Failed to load messages:', error);
      setError((error as Error)?.message || 'Unknown error');
    } finally {
      setIsLoading(false);
    }
  }, [scrollToBottom]);

  const sendMessage = useCallback(async (content: string, type: MessageType = MessageType.TEXT, replyToId: string | null = null) => {
    if (!currentConversation || !content.trim() || !user) return;

    const trimmedContent = content.trim();

    const tempId = `temp-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const optimisticMessage: Message = {
      id: tempId,
      conversationId: currentConversation.id,
      senderId: user.id,
      senderUsername: user.username || user.email,
      senderDisplayName: user.displayName || user.email,
      senderAvatarUrl: user.avatarUrl,
      type,
      content: trimmedContent,
      metadata: { isOptimistic: true, isSending: true },
      replyToId: replyToId || undefined,
      createdAt: new Date().toISOString(),
      editedAt: undefined,
      deletedAt: undefined,
      attachments: [],
      isRead: false,
      readAt: undefined,
      unreadCount: 0
    };

    console.log('Adding optimistic message immediately:', optimisticMessage.content);
    setMessages(prev => {
      const newMessages = [...prev, optimisticMessage];
      console.log('New messages array length:', newMessages.length);

      if (currentConversation) {
        messagesCache.current.set(currentConversation.id, newMessages);
      }

      return newMessages;
    });

    setConversations(prev => {
      const updatedConversations = prev.map(conv => {
        if (conv.id === currentConversation.id) {
          return {
            ...conv,
            lastMessage: optimisticMessage,
            updatedAt: optimisticMessage.createdAt
          };
        }
        return conv;
      });

      return updatedConversations.sort((a, b) => {
        const aTime = new Date(a.updatedAt || a.lastMessage?.createdAt || 0).getTime();
        const bTime = new Date(b.updatedAt || b.lastMessage?.createdAt || 0).getTime();
        return bTime - aTime;
      });
    });

    scrollToBottom();
    requestAnimationFrame(() => scrollToBottom());
    setTimeout(() => scrollToBottom(), 0);
    setTimeout(() => scrollToBottom(), 10);

    try {
      const messageRequest = {
        conversationId: currentConversation.id,
        type,
        content: trimmedContent,
        replyToId: replyToId || undefined
      };

      if (isConnected) {
        websocketService.sendMessage(currentConversation.id, messageRequest);
      } else {
        console.warn('WebSocket not connected, trying REST API fallback...');
        try {
          await chatApi.sendMessage(messageRequest);
        } catch (restError) {
          console.error('REST API fallback failed:', restError);
          throw restError;
        }
      }

    } catch (error) {
      console.error('Failed to send message:', error);
      setError((error as Error)?.message || 'Unknown error');

      setMessages(prev => prev.filter(msg => msg.id !== tempId));
    }
  }, [currentConversation, user, scrollToBottom, isConnected]);

  const markAsRead = useCallback(async (messageId: string) => {
    try {
      await chatApi.markAsRead(messageId);
    } catch (error) {
      console.error('Failed to mark as read:', error);
    }
  }, []);

  const markConversationAsRead = useCallback(async (conversationId: string) => {
    try {
      await chatApi.markConversationAsRead(conversationId);
    } catch (error) {
      console.error('Failed to mark conversation as read:', error);
    }
  }, []);

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

  const selectConversation = useCallback(async (conversation: Conversation) => {
    console.log('Selecting conversation:', conversation.id);

    setJustSelectedConversation(true);

    setCurrentConversation(conversation);

    setMessages([]);

    // Update conversations list - add new conversation if not exists, or update existing one
    setConversations(prev => {
      const existingIndex = prev.findIndex(conv => conv.id === conversation.id);
      if (existingIndex >= 0) {
        // Update existing conversation
        return prev.map(conv =>
          conv.id === conversation.id
            ? { ...conv, unreadCount: 0 }
            : conv
        );
      } else {
        // Add new conversation to the beginning of the list
        return [conversation, ...prev];
      }
    });

    websocketService.joinConversation(conversation.id);

    loadMessages(conversation.id).catch(error => {
      console.error('Failed to load messages:', error);
      setError('Failed to load messages');
    });

    markConversationAsRead(conversation.id).catch(error => {
      console.error('Failed to mark as read:', error);
    });

    setTimeout(() => scrollToBottom(), 50);

    setTimeout(() => setJustSelectedConversation(false), 100);
  }, [loadMessages, markConversationAsRead, scrollToBottom]);

  const sendTypingIndicator = useCallback((isTyping: boolean) => {
    if (currentConversation) {
      websocketService.sendTypingIndicator(currentConversation.id, isTyping);
    }
  }, [currentConversation]);

  useEffect(() => {
    if (!isConnected || !currentConversation) {
      console.log('Skipping WebSocket subscriptions - not connected or no conversation');
      return;
    }

    console.log('Setting up WebSocket subscriptions for conversation:', currentConversation.id);

    const handleNewMessage = (message: Message) => {
      setMessages(prev => {
        const exists = prev.some(msg => msg.id === message.id);
        if (exists) {
          console.log(`Message ${message.id} already exists, skipping...`);
          return prev;
        }

        if (message.senderId === user?.id) {
          const hasOptimisticMessage = prev.some(msg =>
            msg.id.startsWith('temp-') &&
            msg.senderId === user.id &&
            msg.content === message.content
          );

          if (hasOptimisticMessage) {
            return prev.map(msg =>
              msg.id.startsWith('temp-') &&
                msg.senderId === user.id &&
                msg.content === message.content
                ? { ...message, metadata: { ...message.metadata, isOptimistic: false, isSending: false } }
                : msg
            );
          }
        }

        const newMessages = [...prev, message];

        if (currentConversation) {
          messagesCache.current.set(currentConversation.id, newMessages);
        }

        return newMessages;
      });

      setConversations(prev => {
        const updatedConversations = prev.map(conv => {
          if (conv.id === message.conversationId) {
            const isFromOtherUser = message.senderId !== user?.id;
            const isNotCurrentConversation = currentConversation?.id !== message.conversationId;
            const shouldIncrementUnread = isFromOtherUser && isNotCurrentConversation;

            return {
              ...conv,
              lastMessage: message,
              updatedAt: message.createdAt,
              unreadCount: shouldIncrementUnread ? (conv.unreadCount || 0) + 1 : conv.unreadCount
            };
          }
          return conv;
        });

        return updatedConversations.sort((a, b) => {
          const aTime = new Date(a.updatedAt || a.lastMessage?.createdAt || 0).getTime();
          const bTime = new Date(b.updatedAt || b.lastMessage?.createdAt || 0).getTime();
          return bTime - aTime;
        });
      });

      setTimeout(() => scrollToBottom(), 100);
    };

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

    const handleReadReceipt = (receipt: ReadReceipt) => {
      setMessages(prev => prev.map(msg =>
        msg.id === receipt.messageId
          ? { ...msg, isRead: true, readAt: new Date(receipt.timestamp).toISOString() }
          : msg
      ));
    };

    // Add a small delay to ensure the connection is fully established
    const subscriptionTimeout = setTimeout(() => {
      if (websocketService.getConnectionStatus()) {
        websocketService.subscribeToConversation(currentConversation.id, handleNewMessage);
        websocketService.subscribeToTyping(currentConversation.id, handleTypingIndicator);
        websocketService.subscribeToReadReceipts(currentConversation.id, handleReadReceipt);
      } else {
        console.error('WebSocket connection lost before setting up subscriptions');
      }
    }, 200);

    return () => {
      clearTimeout(subscriptionTimeout);
      websocketService.unsubscribe(`/topic/conversation/${currentConversation.id}`);
      websocketService.unsubscribe(`/topic/conversation/${currentConversation.id}/typing`);
      websocketService.unsubscribe(`/topic/conversation/${currentConversation.id}/read`);
    };
  }, [isConnected, currentConversation?.id, user?.id, scrollToBottom]);

  useEffect(() => {
    if (user?.id) {
      loadConversations();
    }
  }, [user?.id, loadConversations]);


  useEffect(() => {
    if (conversations.length > 0 && !currentConversation) {
      selectConversation(conversations[0]);
    }
  }, [conversations, currentConversation, selectConversation]);

  return {
    conversations,
    currentConversation,
    messages,
    isLoading,
    error,
    isConnected,
    typingUsers,
    messagesEndRef,
    justSelectedConversation,
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
