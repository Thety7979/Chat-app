import axios, { AxiosInstance, AxiosResponse } from 'axios';
import { 
  Message, 
  Conversation, 
  SendMessageRequest, 
  CreateConversationRequest,
  MessageAttachment 
} from '../types/chat';

const API_BASE_URL = 'http://localhost:8080/api';

class ChatApi {
  private api: AxiosInstance;

  constructor() {
    this.api = axios.create({
      baseURL: API_BASE_URL,
      timeout: 10000,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Add request interceptor to include auth token
    this.api.interceptors.request.use(
      (config: any) => {
        const token = this.getAccessToken();
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        // Add user ID header for chat APIs
        const user = this.getCurrentUser();
        if (user?.id) {
          config.headers['X-User-Id'] = user.id;
        }
        return config;
      },
      (error: any) => {
        return Promise.reject(error);
      }
    );

    // Add response interceptor to handle token refresh
    this.api.interceptors.response.use(
      (response: any) => response,
      async (error: any) => {
        const originalRequest = error.config;
        
        if (error.response?.status === 401 && !originalRequest._retry) {
          originalRequest._retry = true;
          
          try {
            const refreshToken = this.getRefreshToken();
            if (refreshToken) {
              const response = await this.refreshToken(refreshToken);
              this.setTokens(response.token, response.refreshToken);
              originalRequest.headers.Authorization = `Bearer ${response.token}`;
              return this.api(originalRequest);
            }
          } catch (refreshError) {
            this.logout();
            return Promise.reject(refreshError);
          }
        }
        
        return Promise.reject(error);
      }
    );
  }

  // Message APIs
  async sendMessage(request: SendMessageRequest): Promise<Message> {
    try {
      const response: AxiosResponse<Message> = await this.api.post('/messages', request);
      return response.data;
    } catch (error: any) {
      if (axios.isAxiosError(error)) {
        throw new Error(error.response?.data?.message || 'Failed to send message');
      }
      throw error;
    }
  }

  async getMessages(
    conversationId: string, 
    page: number = 0, 
    size: number = 50,
    sortBy: string = 'createdAt',
    sortDir: string = 'asc'
  ): Promise<{ content: Message[]; totalElements: number; totalPages: number }> {
    try {
      console.log(`Getting messages for conversation ${conversationId} with sortBy=${sortBy}, sortDir=${sortDir}`);
      const response = await this.api.get(`/messages/conversation/${conversationId}`, {
        params: { page, size, sortBy, sortDir }
      });
      console.log(`Received ${response.data.content?.length || 0} messages`);
      return response.data;
    } catch (error: any) {
      if (axios.isAxiosError(error)) {
        throw new Error(error.response?.data?.message || 'Failed to get messages');
      }
      throw error;
    }
  }

  async getMessagesAfter(conversationId: string, after: string): Promise<Message[]> {
    try {
      const response = await this.api.get(`/messages/conversation/${conversationId}/after`, {
        params: { after }
      });
      return response.data;
    } catch (error: any) {
      if (axios.isAxiosError(error)) {
        throw new Error(error.response?.data?.message || 'Failed to get messages');
      }
      throw error;
    }
  }

  async getMessage(messageId: string): Promise<Message> {
    try {
      const response: AxiosResponse<Message> = await this.api.get(`/messages/${messageId}`);
      return response.data;
    } catch (error: any) {
      if (axios.isAxiosError(error)) {
        throw new Error(error.response?.data?.message || 'Failed to get message');
      }
      throw error;
    }
  }

  async editMessage(messageId: string, newContent: string): Promise<Message> {
    try {
      const response: AxiosResponse<Message> = await this.api.put(`/messages/${messageId}`, newContent);
      return response.data;
    } catch (error: any) {
      if (axios.isAxiosError(error)) {
        throw new Error(error.response?.data?.message || 'Failed to edit message');
      }
      throw error;
    }
  }

  async deleteMessage(messageId: string): Promise<void> {
    try {
      await this.api.delete(`/messages/${messageId}`);
    } catch (error: any) {
      if (axios.isAxiosError(error)) {
        throw new Error(error.response?.data?.message || 'Failed to delete message');
      }
      throw error;
    }
  }

  async markAsRead(messageId: string): Promise<void> {
    try {
      await this.api.post(`/messages/${messageId}/read`);
    } catch (error: any) {
      if (axios.isAxiosError(error)) {
        throw new Error(error.response?.data?.message || 'Failed to mark as read');
      }
      throw error;
    }
  }

  async markConversationAsRead(conversationId: string): Promise<void> {
    try {
      await this.api.post(`/messages/conversation/${conversationId}/read`);
    } catch (error: any) {
      if (axios.isAxiosError(error)) {
        throw new Error(error.response?.data?.message || 'Failed to mark conversation as read');
      }
      throw error;
    }
  }

  async getUnreadCount(conversationId: string): Promise<number> {
    try {
      const response = await this.api.get(`/messages/conversation/${conversationId}/unread-count`);
      return response.data;
    } catch (error: any) {
      if (axios.isAxiosError(error)) {
        throw new Error(error.response?.data?.message || 'Failed to get unread count');
      }
      throw error;
    }
  }

  async searchMessages(conversationId: string, query: string): Promise<Message[]> {
    try {
      const response = await this.api.get(`/messages/conversation/${conversationId}/search`, {
        params: { q: query }
      });
      return response.data;
    } catch (error: any) {
      if (axios.isAxiosError(error)) {
        throw new Error(error.response?.data?.message || 'Failed to search messages');
      }
      throw error;
    }
  }

  // Conversation APIs
  async createConversation(request: CreateConversationRequest): Promise<Conversation> {
    try {
      const response: AxiosResponse<Conversation> = await this.api.post('/conversations', request);
      return response.data;
    } catch (error: any) {
      if (axios.isAxiosError(error)) {
        throw new Error(error.response?.data?.message || 'Failed to create conversation');
      }
      throw error;
    }
  }

  async getUserConversations(): Promise<Conversation[]> {
    try {
      const response: AxiosResponse<Conversation[]> = await this.api.get('/conversations');
      return response.data;
    } catch (error: any) {
      if (axios.isAxiosError(error)) {
        throw new Error(error.response?.data?.message || 'Failed to get conversations');
      }
      throw error;
    }
  }

  async getConversation(conversationId: string): Promise<Conversation> {
    try {
      const response: AxiosResponse<Conversation> = await this.api.get(`/conversations/${conversationId}`);
      return response.data;
    } catch (error: any) {
      if (axios.isAxiosError(error)) {
        throw new Error(error.response?.data?.message || 'Failed to get conversation');
      }
      throw error;
    }
  }

  async getOrCreateDirectConversation(user2Id: string): Promise<Conversation> {
    try {
      const response: AxiosResponse<Conversation> = await this.api.post('/conversations/direct', null, {
        params: { user2Id }
      });
      return response.data;
    } catch (error: any) {
      if (axios.isAxiosError(error)) {
        throw new Error(error.response?.data?.message || 'Failed to get/create direct conversation');
      }
      throw error;
    }
  }

  async updateConversation(
    conversationId: string, 
    title?: string, 
    avatarUrl?: string
  ): Promise<Conversation> {
    try {
      const response: AxiosResponse<Conversation> = await this.api.put(`/conversations/${conversationId}`, null, {
        params: { title, avatarUrl }
      });
      return response.data;
    } catch (error: any) {
      if (axios.isAxiosError(error)) {
        throw new Error(error.response?.data?.message || 'Failed to update conversation');
      }
      throw error;
    }
  }

  async addMember(conversationId: string, newMemberId: string): Promise<void> {
    try {
      await this.api.post(`/conversations/${conversationId}/members`, null, {
        params: { newMemberId }
      });
    } catch (error: any) {
      if (axios.isAxiosError(error)) {
        throw new Error(error.response?.data?.message || 'Failed to add member');
      }
      throw error;
    }
  }

  async removeMember(conversationId: string, memberId: string): Promise<void> {
    try {
      await this.api.delete(`/conversations/${conversationId}/members/${memberId}`);
    } catch (error: any) {
      if (axios.isAxiosError(error)) {
        throw new Error(error.response?.data?.message || 'Failed to remove member');
      }
      throw error;
    }
  }

  async updateMemberRole(conversationId: string, memberId: string, role: string): Promise<void> {
    try {
      await this.api.put(`/conversations/${conversationId}/members/${memberId}/role`, null, {
        params: { role }
      });
    } catch (error: any) {
      if (axios.isAxiosError(error)) {
        throw new Error(error.response?.data?.message || 'Failed to update member role');
      }
      throw error;
    }
  }

  async leaveConversation(conversationId: string): Promise<void> {
    try {
      await this.api.post(`/conversations/${conversationId}/leave`);
    } catch (error: any) {
      if (axios.isAxiosError(error)) {
        throw new Error(error.response?.data?.message || 'Failed to leave conversation');
      }
      throw error;
    }
  }

  async deleteConversation(conversationId: string): Promise<void> {
    try {
      await this.api.delete(`/conversations/${conversationId}`);
    } catch (error: any) {
      if (axios.isAxiosError(error)) {
        throw new Error(error.response?.data?.message || 'Failed to delete conversation');
      }
      throw error;
    }
  }

  async searchConversations(query: string): Promise<Conversation[]> {
    try {
      const response = await this.api.get('/conversations/search', {
        params: { q: query }
      });
      return response.data;
    } catch (error: any) {
      if (axios.isAxiosError(error)) {
        throw new Error(error.response?.data?.message || 'Failed to search conversations');
      }
      throw error;
    }
  }

  // Helper methods for token management
  private getAccessToken(): string | null {
    return localStorage.getItem('accessToken');
  }

  private getRefreshToken(): string | null {
    return localStorage.getItem('refreshToken');
  }

  private getCurrentUser(): any {
    const userStr = localStorage.getItem('user');
    return userStr ? JSON.parse(userStr) : null;
  }

  private setTokens(accessToken: string, refreshToken: string): void {
    localStorage.setItem('accessToken', accessToken);
    localStorage.setItem('refreshToken', refreshToken);
  }

  private async refreshToken(refreshToken: string): Promise<any> {
    const response = await axios.post(`${API_BASE_URL}/auth/refresh`, { refreshToken });
    return response.data;
  }

  private logout(): void {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('user');
    window.location.href = '/';
  }
}

export const chatApi = new ChatApi();
export default chatApi;
