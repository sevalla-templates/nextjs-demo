export enum MessageType {
  TEXT = "text",
  IMAGE = "image",
  SYSTEM = "system",
}

export interface UserProfile {
  id: string;
  name: string;
  avatar: string;
}

export type Message = {
  id: string;
  text: string;
  sender: "me" | "peer";
  timestamp: number;
  status?: "sent" | "delivered" | "read" | "sending" | "failed";
  senderId?: string;
  senderName?: string;
  content?: string;
  chatId?: string;
  type?: MessageType;
};

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
