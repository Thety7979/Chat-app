import SockJS from 'sockjs-client';
import { Client } from '@stomp/stompjs';
import { Message, TypingIndicator, ReadReceipt, PresenceUpdate, SendMessageRequest } from '../types/chat';

class WebSocketService {
  private client: Client | null = null;
  private isConnected = false;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 1000;
  private messageHandlers: Map<string, (data: any) => void> = new Map();
  private currentUserId: string | null = null;

  connect(userId: string, token?: string): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        this.currentUserId = userId;
        
        // Create SockJS connection
        const socket = new SockJS('http://localhost:8080/api/ws');
        
        // Prepare connection headers
        const connectHeaders: any = {
          userId: userId
        };
        
        // Add JWT token if available
        if (token) {
          connectHeaders.Authorization = `Bearer ${token}`;
        }
        
        // Create STOMP client
        this.client = new Client({
          webSocketFactory: () => socket,
          connectHeaders: connectHeaders,
          debug: (str) => {
            console.log('STOMP Debug:', str);
          },
          onConnect: (frame) => {
            console.log('WebSocket connected:', frame);
            this.isConnected = true;
            this.reconnectAttempts = 0;
            resolve();
          },
          onStompError: (frame) => {
            console.error('STOMP error:', frame);
            reject(new Error(frame.headers.message || 'WebSocket connection failed'));
          },
          onWebSocketError: (error) => {
            console.error('WebSocket error:', error);
            this.handleReconnect();
          },
          onWebSocketClose: () => {
            console.log('WebSocket connection closed');
            this.isConnected = false;
            this.handleReconnect();
          }
        });

        this.client.activate();
      } catch (error) {
        console.error('Failed to connect WebSocket:', error);
        reject(error);
      }
    });
  }

  disconnect(): void {
    if (this.client && this.isConnected) {
      this.client.deactivate();
      this.isConnected = false;
      this.messageHandlers.clear();
    }
  }

  // Subscribe to conversation messages
  subscribeToConversation(conversationId: string, callback: (message: Message) => void): void {
    if (!this.client || !this.isConnected) {
      console.error('WebSocket not connected');
      return;
    }

    const destination = `/topic/conversation/${conversationId}`;
    this.client.subscribe(destination, (message) => {
      try {
        const data = JSON.parse(message.body);
        callback(data);
      } catch (error) {
        console.error('Error parsing message:', error);
      }
    });

    this.messageHandlers.set(destination, callback);
  }

  // Subscribe to user-specific messages
  subscribeToUserMessages(callback: (message: Message) => void): void {
    if (!this.client || !this.isConnected) {
      console.error('WebSocket not connected');
      return;
    }

    const destination = `/user/queue/messages`;
    this.client.subscribe(destination, (message) => {
      try {
        const data = JSON.parse(message.body);
        callback(data);
      } catch (error) {
        console.error('Error parsing user message:', error);
      }
    });

    this.messageHandlers.set(destination, callback);
  }

  // Subscribe to user conversations
  subscribeToUserConversations(callback: (conversation: any) => void): void {
    if (!this.client || !this.isConnected) {
      console.error('WebSocket not connected');
      return;
    }

    const destination = `/user/queue/conversations`;
    this.client.subscribe(destination, (message) => {
      try {
        const data = JSON.parse(message.body);
        callback(data);
      } catch (error) {
        console.error('Error parsing conversation:', error);
      }
    });

    this.messageHandlers.set(destination, callback);
  }

  // Subscribe to typing indicators
  subscribeToTyping(conversationId: string, callback: (indicator: TypingIndicator) => void): void {
    if (!this.client || !this.isConnected) {
      console.error('WebSocket not connected');
      return;
    }

    const destination = `/topic/conversation/${conversationId}/typing`;
    this.client.subscribe(destination, (message) => {
      try {
        const data = JSON.parse(message.body);
        callback(data);
      } catch (error) {
        console.error('Error parsing typing indicator:', error);
      }
    });

    this.messageHandlers.set(destination, callback);
  }

  // Subscribe to read receipts
  subscribeToReadReceipts(conversationId: string, callback: (receipt: ReadReceipt) => void): void {
    if (!this.client || !this.isConnected) {
      console.error('WebSocket not connected');
      return;
    }

    const destination = `/topic/conversation/${conversationId}/read`;
    this.client.subscribe(destination, (message) => {
      try {
        const data = JSON.parse(message.body);
        callback(data);
      } catch (error) {
        console.error('Error parsing read receipt:', error);
      }
    });

    this.messageHandlers.set(destination, callback);
  }

  // Subscribe to presence updates
  subscribeToPresence(conversationId: string, callback: (update: PresenceUpdate) => void): void {
    if (!this.client || !this.isConnected) {
      console.error('WebSocket not connected');
      return;
    }

    const destination = `/topic/conversation/${conversationId}/presence`;
    this.client.subscribe(destination, (message) => {
      try {
        const data = JSON.parse(message.body);
        callback(data);
      } catch (error) {
        console.error('Error parsing presence update:', error);
      }
    });

    this.messageHandlers.set(destination, callback);
  }

  // Subscribe to errors
  subscribeToErrors(callback: (error: string) => void): void {
    if (!this.client || !this.isConnected) {
      console.error('WebSocket not connected');
      return;
    }

    const destination = `/user/queue/errors`;
    this.client.subscribe(destination, (message) => {
      try {
        const data = JSON.parse(message.body);
        callback(data);
      } catch (error) {
        console.error('Error parsing error message:', error);
      }
    });

    this.messageHandlers.set(destination, callback);
  }

  // Send message
  sendMessage(conversationId: string, request: SendMessageRequest): void {
    if (!this.client || !this.isConnected) {
      console.error('WebSocket not connected');
      return;
    }

    const destination = `/app/conversation/${conversationId}/send`;
    this.client.publish({
      destination,
      body: JSON.stringify(request)
    });
  }

  // Send typing indicator
  sendTypingIndicator(conversationId: string, isTyping: boolean): void {
    if (!this.client || !this.isConnected) {
      console.error('WebSocket not connected');
      return;
    }

    const destination = `/app/conversation/${conversationId}/typing`;
    this.client.publish({
      destination,
      body: isTyping.toString()
    });
  }

  // Mark message as read
  markAsRead(conversationId: string, messageId: string): void {
    if (!this.client || !this.isConnected) {
      console.error('WebSocket not connected');
      return;
    }

    const destination = `/app/conversation/${conversationId}/read`;
    this.client.publish({
      destination,
      body: messageId
    });
  }

  // Join conversation
  joinConversation(conversationId: string): void {
    if (!this.client || !this.isConnected) {
      console.error('WebSocket not connected');
      return;
    }

    const destination = `/app/conversation/${conversationId}/join`;
    this.client.publish({
      destination,
      body: ''
    });
  }

  // Leave conversation
  leaveConversation(conversationId: string): void {
    if (!this.client || !this.isConnected) {
      console.error('WebSocket not connected');
      return;
    }

    const destination = `/app/conversation/${conversationId}/leave`;
    this.client.publish({
      destination,
      body: ''
    });
  }

  // Unsubscribe from destination
  unsubscribe(destination: string): void {
    if (this.client && this.isConnected) {
      this.client.unsubscribe(destination);
      this.messageHandlers.delete(destination);
    }
  }

  // Get connection status
  getConnectionStatus(): boolean {
    return this.isConnected;
  }

  // Handle reconnection
  private handleReconnect(): void {
    if (this.reconnectAttempts < this.maxReconnectAttempts && this.currentUserId) {
      this.reconnectAttempts++;
      console.log(`Attempting to reconnect... (${this.reconnectAttempts}/${this.maxReconnectAttempts})`);
      
      setTimeout(() => {
        this.connect(this.currentUserId!)
          .then(() => {
            console.log('Reconnected successfully');
            // Re-subscribe to all previous subscriptions
            this.resubscribeAll();
          })
          .catch((error) => {
            console.error('Reconnection failed:', error);
          });
      }, this.reconnectDelay * this.reconnectAttempts);
    } else {
      console.error('Max reconnection attempts reached');
    }
  }

  // Re-subscribe to all previous subscriptions
  private resubscribeAll(): void {
    // This would need to be implemented based on your specific needs
    // You might want to store subscription information and re-establish them
    console.log('Re-subscribing to all previous subscriptions...');
  }
}

export const websocketService = new WebSocketService();
export default websocketService;
