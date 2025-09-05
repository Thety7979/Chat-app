export interface Friend {
  id: string;
  username: string;
  email: string;
  displayName: string;
  avatarUrl?: string;
  about?: string;
  isActive: boolean;
  lastSeenAt?: string;
  createdAt: string;
}

export interface FriendRequest {
  id: string;
  sender: Friend;
  receiver: Friend;
  status: FriendRequestStatus;
  message?: string;
  createdAt: string;
  respondedAt?: string;
}

export interface SearchUser {
  id: string;
  username: string;
  email: string;
  displayName: string;
  avatarUrl?: string;
  about?: string;
  isActive: boolean;
  lastSeenAt?: string;
  createdAt: string;
}

export interface SendFriendRequestRequest {
  receiverId: string;
  message?: string;
}

export interface RespondFriendRequestRequest {
  requestId: string;
  status: 'accepted' | 'declined';
}

export enum FriendRequestStatus {
  PENDING = 'pending',
  ACCEPTED = 'accepted',
  DECLINED = 'declined',
  CANCELED = 'canceled'
}

export interface FriendStats {
  totalFriends: number;
  pendingRequests: number;
  sentRequests: number;
}
