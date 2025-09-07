import axios from 'axios';
import { CallDTO } from '../types/call';

const API_BASE_URL = 'http://localhost:8080/api';

// Types are imported from ../types/call to ensure a single source of truth

class CallApi {
  private getAuthHeaders() {
    const token = localStorage.getItem('accessToken');
    console.log('CallApi - Token:', token ? 'Present' : 'Missing');
    if (!token) {
      throw new Error('No authentication token found');
    }
    return {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    };
  }

  async createCall(conversationId: string, type: 'audio' | 'video'): Promise<CallDTO> {
    console.log('CallApi - createCall called with:', { conversationId, type });
    const response = await axios.post(
      `${API_BASE_URL}/calls`,
      null,
      {
        params: { conversationId, type },
        headers: this.getAuthHeaders()
      }
    );
    console.log('CallApi - createCall response:', response.data);
    return response.data;
  }

  async updateCallStatus(callId: string, status: string): Promise<CallDTO> {
    const response = await axios.put(
      `${API_BASE_URL}/calls/${callId}/status`,
      null,
      {
        params: { status },
        headers: this.getAuthHeaders()
      }
    );
    return response.data;
  }

  async endCall(callId: string): Promise<CallDTO> {
    const response = await axios.put(
      `${API_BASE_URL}/calls/${callId}/end`,
      null,
      {
        headers: this.getAuthHeaders()
      }
    );
    return response.data;
  }

  async getCall(callId: string): Promise<CallDTO> {
    const response = await axios.get(
      `${API_BASE_URL}/calls/${callId}`,
      {
        headers: this.getAuthHeaders()
      }
    );
    return response.data;
  }

  async getCallsByConversation(conversationId: string): Promise<CallDTO[]> {
    const response = await axios.get(
      `${API_BASE_URL}/calls/conversation/${conversationId}`,
      {
        headers: this.getAuthHeaders()
      }
    );
    return response.data;
  }

  async getCallsByUser(): Promise<CallDTO[]> {
    const response = await axios.get(
      `${API_BASE_URL}/calls/user`,
      {
        headers: this.getAuthHeaders()
      }
    );
    return response.data;
  }

  async getActiveCallsByConversation(conversationId: string): Promise<CallDTO[]> {
    const response = await axios.get(
      `${API_BASE_URL}/calls/active/conversation/${conversationId}`,
      {
        headers: this.getAuthHeaders()
      }
    );
    return response.data;
  }

  async getActiveCallsByUser(): Promise<CallDTO[]> {
    const response = await axios.get(
      `${API_BASE_URL}/calls/active/user`,
      {
        headers: this.getAuthHeaders()
      }
    );
    return response.data;
  }

  async getCallHistory(page: number = 0, size: number = 20): Promise<CallDTO[]> {
    const response = await axios.get(
      `${API_BASE_URL}/calls/history`,
      {
        params: { page, size },
        headers: this.getAuthHeaders()
      }
    );
    return response.data;
  }

  async cleanupExpiredCalls(): Promise<string> {
    const response = await axios.post(
      `${API_BASE_URL}/calls/cleanup`,
      {},
      {
        headers: this.getAuthHeaders()
      }
    );
    return response.data;
  }
}

const callApi = new CallApi();
export default callApi;
