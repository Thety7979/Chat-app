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
  private friendRequestHandlers: Map<string, (data: any) => void> = new Map();
  private callEventHandlers: Map<string, (data: any) => void> = new Map();

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

  // Explicit API to publish presence leave when navigating away/closing
  sendPresenceLeave(conversationId: string): void {
    this.leaveConversation(conversationId);
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

  // Wait for connection to be established
  private async waitForConnection(timeout: number = 5000): Promise<boolean> {
    return new Promise((resolve) => {
      if (this.isConnected) {
        resolve(true);
        return;
      }

      let attempts = 0;
      const maxAttempts = timeout / 100; // Check every 100ms

      const checkConnection = () => {
        attempts++;
        if (this.isConnected) {
          resolve(true);
        } else if (attempts >= maxAttempts) {
          console.error('WebSocket connection timeout after', timeout, 'ms');
          resolve(false);
        } else {
          setTimeout(checkConnection, 100);
        }
      };

      checkConnection();
    });
  }

  // Friend Request WebSocket Methods
  async subscribeToFriendRequests(handler: (data: any) => void): Promise<void> {
    if (!this.client) {
      console.error('WebSocket client not initialized, cannot subscribe to friend requests');
      return;
    }

    // Wait for connection to be established
    const connected = await this.waitForConnection();
    if (!connected) {
      console.error('WebSocket connection timeout, cannot subscribe to friend requests');
      return;
    }

    try {
      const subscriptionId = `friend-requests-${Date.now()}`;
      this.friendRequestHandlers.set(subscriptionId, handler);

      const subscription = this.client.subscribe('/user/queue/friend-requests', (message) => {
        try {
          const data = JSON.parse(message.body);
          console.log('Friend request event received:', data);
          handler(data);
        } catch (error) {
          console.error('Failed to parse friend request message:', error);
        }
      });

      this.subscriptions.set(subscriptionId, subscription);
      console.log('Subscribed to friend requests');
    } catch (error) {
      console.error('Failed to subscribe to friend requests:', error);
      // If subscription fails, we can try to retry after a delay
      setTimeout(() => {
        console.log('Retrying friend request subscription...');
        this.subscribeToFriendRequests(handler).catch(err => {
          console.error('Retry failed:', err);
        });
      }, 2000);
    }
  }

  unsubscribeFromFriendRequests(subscriptionId: string): void {
    const subscription = this.subscriptions.get(subscriptionId);
    if (subscription) {
      subscription.unsubscribe();
      this.subscriptions.delete(subscriptionId);
      this.friendRequestHandlers.delete(subscriptionId);
      console.log('Unsubscribed from friend requests');
    }
  }

  // Call Event WebSocket Methods
  async subscribeToCallEvents(handler: (data: any) => void): Promise<void> {
    if (!this.client) {
      console.error('WebSocket client not initialized, cannot subscribe to call events');
      return;
    }

    // Wait for connection to be established
    const connected = await this.waitForConnection();
    if (!connected) {
      console.error('WebSocket connection timeout, cannot subscribe to call events');
      return;
    }

    // Check if we already have a call events subscription
    const existingSubscription = Array.from(this.subscriptions.keys()).find(key => key.startsWith('call-events-'));
    if (existingSubscription) {
      console.log('WebSocket Service - Call events subscription already exists, adding handler to existing subscription...');
      this.callEventHandlers.set(`call-events-${Date.now()}`, handler);
      return;
    }

    try {
      const subscriptionId = `call-events-${Date.now()}`;
      this.callEventHandlers.set(subscriptionId, handler);

      const subscription = this.client.subscribe('/user/queue/call-events', (message) => {
        try {
          console.log('WebSocket Service - Raw message received on call-events subscription:', message);
          console.log('WebSocket Service - Message body:', message.body);
          console.log('WebSocket Service - Message headers:', message.headers);
          
          const data = JSON.parse(message.body);
          console.log('WebSocket Service - Call event received:', data);
          console.log('WebSocket Service - Event type:', data.type);
          console.log('WebSocket Service - Event data:', JSON.stringify(data, null, 2));
          console.log('WebSocket Service - Current user ID:', this.currentUserId);
          console.log('WebSocket Service - Caller ID from event:', data.callerId);
          console.log('WebSocket Service - Callee ID from event:', data.calleeId);
          
          // Deliver events when current user participates as caller or callee
          const currentId = String(this.currentUserId);
          const eventCaller = String(data.callerId);
          const eventCallee = String(data.calleeId);
          const isParticipant = currentId === eventCaller || currentId === eventCallee;

          if (isParticipant) {
            console.log('WebSocket Service - Current user is a participant, processing event...');
            handler(data);
          } else {
            console.log('WebSocket Service - Current user not a participant of this call event, ignoring');
          }
        } catch (error) {
          console.error('WebSocket Service - Failed to parse call event message:', error);
          console.error('WebSocket Service - Raw message body:', message.body);
        }
      });

      this.subscriptions.set(subscriptionId, subscription);
      console.log('Subscribed to call events');
      console.log('WebSocket Service - Subscription details:');
      console.log('  - Current user ID:', this.currentUserId);
      console.log('  - Current user ID type:', typeof this.currentUserId);
      console.log('  - Subscription ID:', subscriptionId);
      console.log('  - Is connected:', this.isConnected);
      console.log('  - Client state:', this.client?.connected);
      console.log('  - Subscription destination: /user/queue/call-events');
      
      // Also subscribe to the topic for testing
      const topicSubscriptionId = `call-events-topic-${Date.now()}`;
      const topicSubscription = this.client.subscribe(`/topic/call-events/${this.currentUserId}`, (message) => {
        try {
          console.log('WebSocket Service - Raw message received on call-events topic subscription:', message);
          console.log('WebSocket Service - Topic message body:', message.body);
          
          const data = JSON.parse(message.body);
          console.log('WebSocket Service - Topic call event received:', data);
          console.log('WebSocket Service - Topic event type:', data.type);
          
          // Process the event
          handler(data);
        } catch (error) {
          console.error('WebSocket Service - Failed to parse topic call event message:', error);
        }
      });
      
      this.subscriptions.set(topicSubscriptionId, topicSubscription);
      console.log('Also subscribed to call events topic:', `/topic/call-events/${this.currentUserId}`);
      
      // Test the subscription by sending a test message
      setTimeout(() => {
        console.log('WebSocket Service - Testing subscription by sending test message...');
        this.sendCallEvent({
          type: 'test',
          message: 'This is a test message to verify subscription is working',
          timestamp: new Date().toISOString()
        });
      }, 1000);
    } catch (error) {
      console.error('Failed to subscribe to call events:', error);
      // If subscription fails, we can try to retry after a delay
      setTimeout(() => {
        console.log('Retrying call event subscription...');
        this.subscribeToCallEvents(handler).catch(err => {
          console.error('Retry failed:', err);
        });
      }, 2000);
    }
  }

  sendCallEvent(event: any): void {
    if (!this.client) {
      console.error('WebSocket client not initialized, cannot send call event');
      return;
    }

    if (!this.isConnected) {
      console.error('WebSocket not connected, cannot send call event');
      return;
    }

    const destination = '/app/call';
    try {
      console.log('WebSocket Service - Sending call event to:', destination);
      console.log('WebSocket Service - Event data:', JSON.stringify(event, null, 2));
      this.client.publish({
        destination,
        body: JSON.stringify(event)
      });
      console.log('WebSocket Service - Call event sent successfully to:', destination);
    } catch (error) {
      console.error('WebSocket Service - Failed to send call event:', error);
    }
  }

  getCurrentUserId(): string | null {
    return this.currentUserId;
  }

  unsubscribeFromCallEvents(subscriptionId: string): void {
    const subscription = this.subscriptions.get(subscriptionId);
    if (subscription) {
      subscription.unsubscribe();
      this.subscriptions.delete(subscriptionId);
      this.callEventHandlers.delete(subscriptionId);
      console.log('Unsubscribed from call events');
    }
  }
}

export const websocketService = new WebSocketService();
export default websocketService;
