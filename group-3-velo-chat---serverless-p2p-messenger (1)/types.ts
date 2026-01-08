
export enum MessageType {
  TEXT = 'text',
  IMAGE = 'image',
  SYSTEM = 'system'
}

export interface Message {
  id: string;
  senderId: string;
  senderName: string;
  content: string;
  timestamp: number;
  type: MessageType;
  chatId: string;
  status: 'sending' | 'sent' | 'delivered' | 'read' | 'failed';
}

export interface Chat {
  id: string;
  name: string;
  isGroup: boolean;
  participants: string[]; // List of Peer IDs
  lastMessage?: Message;
  unreadCount: number;
  avatar: string;
  isTyping?: boolean;
  typingUser?: string;
  onlineParticipants?: string[];
}

export interface UserProfile {
  id: string;
  name: string;
  avatar: string;
}

export type P2PDataPacket = 
  | { type: 'MESSAGE'; payload: Message }
  | { type: 'GROUP_INVITE'; payload: Chat }
  | { type: 'TYPING'; payload: { chatId: string; userId: string; isTyping: boolean } }
  | { type: 'READ_RECEIPT'; payload: { chatId: string; messageId: string; userId: string } }
  | { type: 'DELIVERY_CONFIRM'; payload: { chatId: string; messageId: string } }
  | { type: 'PRESENCE'; payload: { userId: string; status: 'online' | 'offline' } };
