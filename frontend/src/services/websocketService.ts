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
  private subscriptions: Map<string, any> = new Map();
  private currentUserId: string | null = null;
  private receivedMessageIds: Set<string> = new Set();

  connect(userId: string, token?: string): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        this.currentUserId = userId;

        const socket = new SockJS('http://localhost:8080/api/ws');

        const connectHeaders: any = {
          userId: userId
        };

        if (token) {
          connectHeaders.Authorization = `Bearer ${token}`;
        }

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
            // Add a small delay to ensure the connection is fully established
            setTimeout(() => {
              resolve();
            }, 100);
          },
          onStompError: (frame) => {
            console.error('STOMP error:', frame);
            this.isConnected = false;
            reject(new Error(frame.headers.message || 'WebSocket connection failed'));
          },
          onWebSocketError: (error) => {
            console.error('WebSocket error:', error);
            this.isConnected = false;
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
      this.subscriptions.clear();
      this.receivedMessageIds.clear();
    }
  }

  subscribeToConversation(conversationId: string, callback: (message: Message) => void): void {
    if (!this.client) {
      console.error('WebSocket client not initialized');
      return;
    }

    if (!this.isConnected) {
      console.error('WebSocket not connected, queuing subscription');
      // Queue the subscription to be executed when connection is ready
      setTimeout(() => {
        if (this.isConnected) {
          this.subscribeToConversation(conversationId, callback);
        } else {
          console.error('WebSocket still not connected after retry');
        }
      }, 100);
      return;
    }

    const destination = `/topic/conversation/${conversationId}`;

    if (this.subscriptions.has(destination)) {
      console.log(`Already subscribed to ${destination}`);
      return;
    }

    try {
      const subscription = this.client.subscribe(destination, (message) => {
        try {
          const data = JSON.parse(message.body);

          if (data.id && this.receivedMessageIds.has(data.id)) {
            console.log(`Duplicate message detected: ${data.id}`);
            return;
          }

          if (data.id) {
            this.receivedMessageIds.add(data.id);
          }

          callback(data);
        } catch (error) {
          console.error('Error parsing message:', error);
        }
      });

      this.subscriptions.set(destination, subscription);
      this.messageHandlers.set(destination, callback);
      console.log(`Successfully subscribed to ${destination}`);
    } catch (error) {
      console.error(`Failed to subscribe to ${destination}:`, error);
    }
  }

  subscribeToUserMessages(callback: (message: Message) => void): void {
    if (!this.client) {
      console.error('WebSocket client not initialized');
      return;
    }

    if (!this.isConnected) {
      console.error('WebSocket not connected, queuing subscription');
      setTimeout(() => {
        if (this.isConnected) {
          this.subscribeToUserMessages(callback);
        } else {
          console.error('WebSocket still not connected after retry');
        }
      }, 100);
      return;
    }

    const destination = `/user/queue/messages`;
    try {
      this.client.subscribe(destination, (message) => {
        try {
          const data = JSON.parse(message.body);
          callback(data);
        } catch (error) {
          console.error('Error parsing user message:', error);
        }
      });

      this.messageHandlers.set(destination, callback);
      console.log(`Successfully subscribed to ${destination}`);
    } catch (error) {
      console.error(`Failed to subscribe to ${destination}:`, error);
    }
  }

  subscribeToUserConversations(callback: (conversation: any) => void): void {
    if (!this.client) {
      console.error('WebSocket client not initialized');
      return;
    }

    if (!this.isConnected) {
      console.error('WebSocket not connected, queuing subscription');
      setTimeout(() => {
        if (this.isConnected) {
          this.subscribeToUserConversations(callback);
        } else {
          console.error('WebSocket still not connected after retry');
        }
      }, 100);
      return;
    }

    const destination = `/user/queue/conversations`;
    try {
      this.client.subscribe(destination, (message) => {
        try {
          const data = JSON.parse(message.body);
          callback(data);
        } catch (error) {
          console.error('Error parsing conversation:', error);
        }
      });

      this.messageHandlers.set(destination, callback);
      console.log(`Successfully subscribed to ${destination}`);
    } catch (error) {
      console.error(`Failed to subscribe to ${destination}:`, error);
    }
  }

  subscribeToTyping(conversationId: string, callback: (indicator: TypingIndicator) => void): void {
    if (!this.client) {
      console.error('WebSocket client not initialized');
      return;
    }

    if (!this.isConnected) {
      console.error('WebSocket not connected, queuing subscription');
      setTimeout(() => {
        if (this.isConnected) {
          this.subscribeToTyping(conversationId, callback);
        } else {
          console.error('WebSocket still not connected after retry');
        }
      }, 100);
      return;
    }

    const destination = `/topic/conversation/${conversationId}/typing`;

    if (this.subscriptions.has(destination)) {
      console.log(`Already subscribed to ${destination}`);
      return;
    }

    try {
      const subscription = this.client.subscribe(destination, (message) => {
        try {
          const data = JSON.parse(message.body);
          callback(data);
        } catch (error) {
          console.error('Error parsing typing indicator:', error);
        }
      });

      this.subscriptions.set(destination, subscription);
      this.messageHandlers.set(destination, callback);
      console.log(`Successfully subscribed to ${destination}`);
    } catch (error) {
      console.error(`Failed to subscribe to ${destination}:`, error);
    }
  }

  subscribeToReadReceipts(conversationId: string, callback: (receipt: ReadReceipt) => void): void {
    if (!this.client) {
      console.error('WebSocket client not initialized');
      return;
    }

    if (!this.isConnected) {
      console.error('WebSocket not connected, queuing subscription');
      setTimeout(() => {
        if (this.isConnected) {
          this.subscribeToReadReceipts(conversationId, callback);
        } else {
          console.error('WebSocket still not connected after retry');
        }
      }, 100);
      return;
    }

    const destination = `/topic/conversation/${conversationId}/read`;

    if (this.subscriptions.has(destination)) {
      console.log(`Already subscribed to ${destination}`);
      return;
    }

    try {
      const subscription = this.client.subscribe(destination, (message) => {
        try {
          const data = JSON.parse(message.body);
          callback(data);
        } catch (error) {
          console.error('Error parsing read receipt:', error);
        }
      });

      this.subscriptions.set(destination, subscription);
      this.messageHandlers.set(destination, callback);
      console.log(`Successfully subscribed to ${destination}`);
    } catch (error) {
      console.error(`Failed to subscribe to ${destination}:`, error);
    }
  }

  subscribeToPresence(conversationId: string, callback: (update: PresenceUpdate) => void): void {
    if (!this.client) {
      console.error('WebSocket client not initialized');
      return;
    }

    if (!this.isConnected) {
      console.error('WebSocket not connected, queuing subscription');
      setTimeout(() => {
        if (this.isConnected) {
          this.subscribeToPresence(conversationId, callback);
        } else {
          console.error('WebSocket still not connected after retry');
        }
      }, 100);
      return;
    }

    const destination = `/topic/conversation/${conversationId}/presence`;
    try {
      this.client.subscribe(destination, (message) => {
        try {
          const data = JSON.parse(message.body);
          callback(data);
        } catch (error) {
          console.error('Error parsing presence update:', error);
        }
      });

      this.messageHandlers.set(destination, callback);
      console.log(`Successfully subscribed to ${destination}`);
    } catch (error) {
      console.error(`Failed to subscribe to ${destination}:`, error);
    }
  }

  subscribeToErrors(callback: (error: string) => void): void {
    if (!this.client) {
      console.error('WebSocket client not initialized');
      return;
    }

    if (!this.isConnected) {
      console.error('WebSocket not connected, queuing subscription');
      setTimeout(() => {
        if (this.isConnected) {
          this.subscribeToErrors(callback);
        } else {
          console.error('WebSocket still not connected after retry');
        }
      }, 100);
      return;
    }

    const destination = `/user/queue/errors`;
    try {
      this.client.subscribe(destination, (message) => {
        try {
          const data = JSON.parse(message.body);
          callback(data);
        } catch (error) {
          console.error('Error parsing error message:', error);
        }
      });

      this.messageHandlers.set(destination, callback);
      console.log(`Successfully subscribed to ${destination}`);
    } catch (error) {
      console.error(`Failed to subscribe to ${destination}:`, error);
    }
  }

  sendMessage(conversationId: string, request: SendMessageRequest): void {
    if (!this.client) {
      console.error('WebSocket client not initialized');
      return;
    }

    if (!this.isConnected) {
      console.error('WebSocket not connected, cannot send message');
      return;
    }

    const destination = `/app/conversation/${conversationId}/send`;
    try {
      this.client.publish({
        destination,
        body: JSON.stringify(request)
      });
      console.log('Message sent successfully to:', destination);
    } catch (error) {
      console.error('Failed to send message:', error);
    }
  }

  sendTypingIndicator(conversationId: string, isTyping: boolean): void {
    if (!this.client) {
      console.error('WebSocket client not initialized');
      return;
    }

    if (!this.isConnected) {
      console.error('WebSocket not connected, cannot send typing indicator');
      return;
    }

    const destination = `/app/conversation/${conversationId}/typing`;
    try {
      this.client.publish({
        destination,
        body: isTyping.toString()
      });
    } catch (error) {
      console.error('Failed to send typing indicator:', error);
    }
  }

  markAsRead(conversationId: string, messageId: string): void {
    if (!this.client) {
      console.error('WebSocket client not initialized');
      return;
    }

    if (!this.isConnected) {
      console.error('WebSocket not connected, cannot mark as read');
      return;
    }

    const destination = `/app/conversation/${conversationId}/read`;
    try {
      this.client.publish({
        destination,
        body: messageId
      });
    } catch (error) {
      console.error('Failed to mark as read:', error);
    }
  }

  joinConversation(conversationId: string): void {
    if (!this.client) {
      console.error('WebSocket client not initialized');
      return;
    }

    if (!this.isConnected) {
      console.error('WebSocket not connected, cannot join conversation');
      return;
    }

    const destination = `/app/conversation/${conversationId}/join`;
    try {
      this.client.publish({
        destination,
        body: ''
      });
    } catch (error) {
      console.error('Failed to join conversation:', error);
    }
  }

  leaveConversation(conversationId: string): void {
    if (!this.client) {
      console.error('WebSocket client not initialized');
      return;
    }

    if (!this.isConnected) {
      console.error('WebSocket not connected, cannot leave conversation');
      return;
    }

    const destination = `/app/conversation/${conversationId}/leave`;
    try {
      this.client.publish({
        destination,
        body: ''
      });
    } catch (error) {
      console.error('Failed to leave conversation:', error);
    }
  }

  unsubscribe(destination: string): void {
    if (this.client && this.isConnected) {
      const subscription = this.subscriptions.get(destination);
      if (subscription) {
        subscription.unsubscribe();
        this.subscriptions.delete(destination);
      }
      this.messageHandlers.delete(destination);
    }
  }

  getConnectionStatus(): boolean {
    return this.isConnected;
  }

  private handleReconnect(): void {
    if (this.reconnectAttempts < this.maxReconnectAttempts && this.currentUserId) {
      this.reconnectAttempts++;
      console.log(`Attempting to reconnect... (${this.reconnectAttempts}/${this.maxReconnectAttempts})`);

      setTimeout(() => {
        this.connect(this.currentUserId!)
          .then(() => {
            console.log('Reconnected successfully');
            this.resubscribeAll();
          })
          .catch((error) => {
            console.error('Reconnection failed:', error);
            // Continue trying to reconnect
            this.handleReconnect();
          });
      }, this.reconnectDelay * this.reconnectAttempts);
    } else {
      console.error('Max reconnection attempts reached');
      this.isConnected = false;
    }
  }

  private resubscribeAll(): void {
    console.log('Re-subscribing to all previous subscriptions...');
    this.subscriptions.clear();
    this.receivedMessageIds.clear();
  }
}

export const websocketService = new WebSocketService();
export default websocketService;
