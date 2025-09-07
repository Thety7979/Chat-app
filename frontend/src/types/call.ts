export interface CallDTO {
  id: string;
  conversationId: string;
  initiatorId: string;
  initiatorName: string;
  initiatorEmail: string;
  type: 'audio' | 'video';
  status: 'ringing' | 'ongoing' | 'ended' | 'missed' | 'canceled' | 'failed';
  startedAt?: string;
  endedAt?: string;
  createdAt: string;
  duration?: number;
  conversationTitle: string;
}

export interface CreateCallRequest {
  conversationId: string;
  type: 'audio' | 'video';
}

export interface UpdateCallStatusRequest {
  status: 'ringing' | 'ongoing' | 'ended' | 'missed' | 'canceled' | 'failed';
}

