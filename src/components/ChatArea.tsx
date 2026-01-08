"use client";
import React, { useState, useRef, useEffect } from "react";
import { Chat, Message, UserProfile, MessageType } from "@/types";
import {
  Send,
  Smile,
  MoreVertical,
  ChevronLeft,
  Check,
  CheckCheck,
  Clock,
} from "lucide-react";

interface ChatAreaProps {
  chat: Chat;
  messages: Message[];
  onSendMessage: (chatId: string, content: string, type?: MessageType) => void;
  onTyping: (chatId: string, isTyping: boolean) => void;
  currentUser: UserProfile;
  onBack?: () => void;
}

const ChatArea: React.FC<ChatAreaProps> = ({
  chat,
  messages,
  onSendMessage,
  onTyping,
  currentUser,
  onBack,
}) => {
  const [input, setInput] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current)
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages, chat.isTyping]);

  const handleSend = () => {
    if (input.trim()) {
      onSendMessage(chat.id, input.trim());
      setInput("");
      onTyping(chat.id, false);
    }
  };

  return (
    <div className="flex flex-col h-full w-full overflow-hidden bg-gradient-to-br from-[#eef7f4] via-[#fbfdfc] to-[#e8f1ff]">
      <div className="bg-white/90 backdrop-blur-md px-6 py-4 flex items-center justify-between border-b shadow-sm z-20">
        <div className="flex items-center gap-4">
          {onBack && (
            <button onClick={onBack} className="md:hidden p-1">
              <ChevronLeft size={24} />
            </button>
          )}
          <div className="relative">
            <img
              src={chat.avatar}
              alt={chat.name}
              className="w-10 h-10 rounded-xl border shadow-sm object-cover"
            />
            <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-emerald-500 border-2 border-white rounded-full shadow-sm"></div>
          </div>
          <div>
            <h2 className="font-black text-gray-900 tracking-tight leading-tight">
              {chat.name}
            </h2>
            <div className="flex items-center gap-2">
              <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest">
                {chat.isTyping ? (
                  <span className="text-teal-500 animate-pulse">
                    Peer is typing…
                  </span>
                ) : (
                  "Live and secured"
                )}
              </p>
              <span className="text-[9px] font-black text-teal-600 bg-teal-50 px-2 py-1 rounded-full border border-teal-100">
                E2E
              </span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button className="p-2 text-gray-400 hover:text-gray-600 transition-colors">
            <MoreVertical size={20} />
          </button>
        </div>
      </div>

      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto p-4 md:px-12 bg-[#ECE5DD] space-y-3 shadow-inner"
        style={{
          backgroundImage:
            "url(\"data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23d4d4d4' fill-opacity='0.1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E\")",
        }}
      >
        {messages.map((msg) => {
          const isMe = msg.senderId === currentUser.id;
          const content = msg.content || msg.text;
          return (
            <div
              key={msg.id}
              className={`flex w-full ${isMe ? "justify-end" : "justify-start"}`}
            >
              <div
                className={`max-w-[85%] px-4 py-3 rounded-2xl shadow ${
                  isMe
                    ? "bg-gradient-to-br from-teal-600 to-emerald-500 text-white border-teal-500/70 rounded-tr-none"
                    : "bg-white text-gray-800 border-gray-100 rounded-tl-none"
                }`}
              >
                {chat.isGroup && !isMe && (
                  <p className="text-[9px] font-black mb-1 opacity-50 uppercase tracking-widest">
                    {msg.senderName}
                  </p>
                )}
                <p className="text-sm font-medium leading-relaxed break-words">
                  {content}
                </p>
                <div
                  className={`flex justify-end items-center gap-1 mt-1 ${
                    isMe ? "text-white/70" : "text-gray-400"
                  }`}
                >
                  <span className="text-[9px] font-black">
                    {new Date(msg.timestamp).toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>
                  {isMe && (
                    <span className="flex items-center">
                      {msg.status === "read" ? (
                        <CheckCheck size={12} className="text-teal-300" />
                      ) : msg.status === "delivered" ? (
                        <CheckCheck size={12} />
                      ) : msg.status === "sent" ? (
                        <Check size={12} />
                      ) : (
                        <Clock size={10} className="animate-pulse" />
                      )}
                    </span>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="bg-white border-t p-4 flex gap-3 items-end shadow-[0_-10px_30px_rgba(0,0,0,0.03)]">
        <button className="p-2 text-gray-400 hover:text-gray-600 transition-colors">
          <Smile size={22} />
        </button>
        <div className="flex-1 bg-gray-50 rounded-2xl px-4 py-3 border-2 border-transparent focus-within:border-teal-100 transition-all">
          <textarea
            rows={1}
            placeholder="Type an encrypted whisper..."
            className="w-full bg-transparent border-none outline-none resize-none font-medium text-sm placeholder:text-gray-400"
            value={input}
            onChange={(e) => {
              setInput(e.target.value);
              onTyping(chat.id, e.target.value.length > 0);
            }}
            onBlur={() => onTyping(chat.id, false)}
            onKeyDown={(e) =>
              e.key === "Enter" &&
              !e.shiftKey &&
              (e.preventDefault(), handleSend())
            }
          />
          <div className="flex items-center justify-between text-[10px] font-black text-gray-400 uppercase tracking-widest pt-1">
            <span>Enter to send</span>
            <span>Shift + Enter for newline</span>
          </div>
        </div>
        <button
          onClick={handleSend}
          className={`p-4 rounded-2xl transition-all shadow-lg ${
            input.trim()
              ? "bg-teal-600 text-white hover:bg-teal-700"
              : "bg-gray-100 text-gray-300"
          }`}
        >
          <Send size={20} />
        </button>
      </div>
    </div>
  );
};

export default ChatArea;
