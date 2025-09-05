export interface User {
  id: string;
  username: string;
  email: string;
  displayName: string;
  avatarUrl?: string;
  isOnline?: boolean;
  lastSeenAt?: string;
}

export interface Message {
  id: string;
  conversationId: string;
  senderId: string;
  senderUsername: string;
  senderDisplayName: string;
  senderAvatarUrl?: string;
  type: MessageType;
  content: string;
  metadata?: any;
  replyToId?: string;
  replyTo?: Message;
  createdAt: string;
  editedAt?: string;
  deletedAt?: string;
  attachments?: MessageAttachment[];
  isRead: boolean;
  readAt?: string;
  unreadCount: number;
}

export interface MessageAttachment {
  id: string;
  url: string;
  mimeType?: string;
  bytes?: number;
  width?: number;
  height?: number;
  durationMs?: number;
  sha256?: string;
}

export interface Conversation {
  id: string;
  type: ConversationType;
  title?: string;
  avatarUrl?: string;
  createdById: string;
  createdByUsername: string;
  createdAt: string;
  updatedAt: string;
  members: ConversationMember[];
  lastMessage?: Message;
  unreadCount: number;
  isOnline: boolean;
}

export interface ConversationMember {
  userId: string;
  username: string;
  displayName: string;
  avatarUrl?: string;
  role: MemberRole;
  joinedAt: string;
  mutedUntil?: string;
  lastReadMessageId?: string;
  isOnline: boolean;
  lastSeenAt?: string;
}

export interface SendMessageRequest {
  conversationId: string;
  type: MessageType;
  content: string;
  metadata?: any;
  replyToId?: string;
  attachments?: MessageAttachment[];
}

export interface CreateConversationRequest {
  type: ConversationType;
  title?: string;
  avatarUrl?: string;
  memberIds: string[];
}

export enum MessageType {
  TEXT = 'text',
  IMAGE = 'image',
  FILE = 'file',
  CALL = 'call',
  SYSTEM = 'system'
}

export enum ConversationType {
  DIRECT = 'direct',
  GROUP = 'group'
}

export enum MemberRole {
  OWNER = 'owner',
  ADMIN = 'admin',
  MEMBER = 'member'
}

export interface TypingIndicator {
  userId: string;
  isTyping: boolean;
  timestamp: number;
}

export interface ReadReceipt {
  userId: string;
  messageId: string;
  timestamp: number;
}

export interface PresenceUpdate {
  userId: string;
  status: 'online' | 'offline';
  timestamp: number;
}
