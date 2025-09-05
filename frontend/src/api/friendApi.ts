import axios, { AxiosInstance, AxiosResponse } from 'axios';
import { 
  Friend, 
  FriendRequest, 
  SearchUser, 
  SendFriendRequestRequest, 
  RespondFriendRequestRequest,
  FriendStats
} from '../types/friend';

const API_BASE_URL = 'http://localhost:8080/api';

class FriendApi {
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

  // Friend APIs
  async getFriends(): Promise<Friend[]> {
    try {
      const response: AxiosResponse<Friend[]> = await this.api.get('/friends');
      return response.data;
    } catch (error: any) {
      if (axios.isAxiosError(error)) {
        throw new Error(error.response?.data?.message || 'Failed to get friends');
      }
      throw error;
    }
  }

  async searchFriends(query: string): Promise<Friend[]> {
    try {
      const response: AxiosResponse<Friend[]> = await this.api.get('/friends/search', {
        params: { query }
      });
      return response.data;
    } catch (error: any) {
      if (axios.isAxiosError(error)) {
        throw new Error(error.response?.data?.message || 'Failed to search friends');
      }
      throw error;
    }
  }

  async countFriends(): Promise<number> {
    try {
      const response = await this.api.get('/friends/count');
      return response.data;
    } catch (error: any) {
      if (axios.isAxiosError(error)) {
        throw new Error(error.response?.data?.message || 'Failed to count friends');
      }
      throw error;
    }
  }

  async areFriends(friendId: string): Promise<boolean> {
    try {
      const response = await this.api.get(`/friends/check/${friendId}`);
      return response.data;
    } catch (error: any) {
      if (axios.isAxiosError(error)) {
        throw new Error(error.response?.data?.message || 'Failed to check friendship');
      }
      throw error;
    }
  }

  async removeFriend(friendId: string): Promise<void> {
    try {
      await this.api.delete(`/friends/${friendId}`);
    } catch (error: any) {
      if (axios.isAxiosError(error)) {
        throw new Error(error.response?.data?.message || 'Failed to remove friend');
      }
      throw error;
    }
  }

  async searchUsersToAddAsFriends(query?: string): Promise<SearchUser[]> {
    try {
      const response: AxiosResponse<SearchUser[]> = await this.api.get('/friends/search-users', {
        params: query ? { query } : {}
      });
      return response.data;
    } catch (error: any) {
      if (axios.isAxiosError(error)) {
        throw new Error(error.response?.data?.message || 'Failed to search users');
      }
      throw error;
    }
  }

  // Friend Request APIs
  async sendFriendRequest(request: SendFriendRequestRequest): Promise<FriendRequest> {
    try {
      const response: AxiosResponse<FriendRequest> = await this.api.post('/friend-requests', request);
      return response.data;
    } catch (error: any) {
      if (axios.isAxiosError(error)) {
        throw new Error(error.response?.data?.message || 'Failed to send friend request');
      }
      throw error;
    }
  }

  async getSentRequests(): Promise<FriendRequest[]> {
    try {
      const response: AxiosResponse<FriendRequest[]> = await this.api.get('/friend-requests/sent');
      return response.data;
    } catch (error: any) {
      if (axios.isAxiosError(error)) {
        throw new Error(error.response?.data?.message || 'Failed to get sent requests');
      }
      throw error;
    }
  }

  async getReceivedRequests(): Promise<FriendRequest[]> {
    try {
      const response: AxiosResponse<FriendRequest[]> = await this.api.get('/friend-requests/received');
      return response.data;
    } catch (error: any) {
      if (axios.isAxiosError(error)) {
        throw new Error(error.response?.data?.message || 'Failed to get received requests');
      }
      throw error;
    }
  }

  async respondToFriendRequest(request: RespondFriendRequestRequest): Promise<FriendRequest> {
    try {
      const response: AxiosResponse<FriendRequest> = await this.api.post('/friend-requests/respond', request);
      return response.data;
    } catch (error: any) {
      if (axios.isAxiosError(error)) {
        throw new Error(error.response?.data?.message || 'Failed to respond to friend request');
      }
      throw error;
    }
  }

  async cancelFriendRequest(requestId: string): Promise<void> {
    try {
      await this.api.delete(`/friend-requests/${requestId}`);
    } catch (error: any) {
      if (axios.isAxiosError(error)) {
        throw new Error(error.response?.data?.message || 'Failed to cancel friend request');
      }
      throw error;
    }
  }

  async countPendingRequests(): Promise<number> {
    try {
      const response = await this.api.get('/friend-requests/count');
      return response.data;
    } catch (error: any) {
      if (axios.isAxiosError(error)) {
        throw new Error(error.response?.data?.message || 'Failed to count pending requests');
      }
      throw error;
    }
  }

  async hasPendingRequest(receiverId: string): Promise<boolean> {
    try {
      const response = await this.api.get(`/friend-requests/check/${receiverId}`);
      return response.data;
    } catch (error: any) {
      if (axios.isAxiosError(error)) {
        throw new Error(error.response?.data?.message || 'Failed to check pending request');
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

export const friendApi = new FriendApi();
export default friendApi;
