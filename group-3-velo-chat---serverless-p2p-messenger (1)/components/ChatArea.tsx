
import React, { useState, useRef, useEffect } from 'react';
import { Chat, Message, UserProfile, MessageType } from '../types';
import { Send, Paperclip, Smile, MoreVertical, Phone, Video, Check, CheckCheck, Clock, AlertCircle, ChevronLeft } from 'lucide-react';

interface ChatAreaProps {
  chat: Chat;
  messages: Message[];
  onSendMessage: (chatId: string, content: string, type?: MessageType) => void;
  onTyping: (chatId: string, isTyping: boolean) => void;
  currentUser: UserProfile;
  onBack?: () => void;
}

const ChatArea: React.FC<ChatAreaProps> = ({ chat, messages, onSendMessage, onTyping, currentUser, onBack }) => {
  const [input, setInput] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<number | null>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, chat.isTyping]);

  const handleSend = () => {
    if (input.trim()) {
      onSendMessage(chat.id, input.trim());
      setInput('');
      onTyping(chat.id, false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value);
    if (typingTimeoutRef.current) window.clearTimeout(typingTimeoutRef.current);
    onTyping(chat.id, true);
    typingTimeoutRef.current = window.setTimeout(() => {
      onTyping(chat.id, false);
    }, 2000);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // Improved Link Detection Utility
  const renderMessageContent = (content: string) => {
    const urlRegex = /(https?:\/\/[^\s]+)/g;
    const parts = content.split(urlRegex);
    return parts.map((part, i) => {
      if (part.match(urlRegex)) {
        return (
          <a 
            key={i} 
            href={part} 
            target="_blank" 
            rel="noopener noreferrer" 
            className="underline underline-offset-4 decoration-2 hover:opacity-80 transition-opacity font-bold break-all"
          >
            {part}
          </a>
        );
      }
      return part;
    });
  };

  const renderStatus = (status: Message['status']) => {
    switch (status) {
      case 'sending': return <Clock size={12} className="text-white/50 animate-pulse" />;
      case 'sent': return <Check size={14} className="text-white/50" />;
      case 'delivered': return <CheckCheck size={14} className="text-white/60" />;
      case 'read': return <CheckCheck size={14} className="text-teal-300 drop-shadow-[0_0_3px_rgba(20,184,166,0.6)]" />;
      case 'failed': return <AlertCircle size={14} className="text-red-400" />;
      default: return null;
    }
  };

  return (
    <div className="flex flex-col h-full bg-[#f8f9fa] relative w-full overflow-hidden">
      {/* Header */}
      <div className="bg-white/90 backdrop-blur-xl px-4 md:px-8 py-3 md:py-5 flex items-center justify-between border-b border-gray-100 shrink-0 shadow-sm z-20">
        <div className="flex items-center gap-3 md:gap-5 min-w-0">
          {onBack && (
            <button onClick={onBack} className="md:hidden p-2 -ml-2 hover:bg-gray-100 rounded-full transition-all text-gray-400">
              <ChevronLeft size={28} />
            </button>
          )}
          <div className="relative group cursor-pointer shrink-0">
            <img src={chat.avatar} alt={chat.name} className="w-10 h-10 md:w-14 md:h-14 rounded-xl md:rounded-2xl border border-gray-100 shadow-md object-cover" />
            <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 md:w-4 md:h-4 bg-emerald-500 border-2 md:border-[3px] border-white rounded-full shadow-sm"></div>
          </div>
          <div className="min-w-0">
            <h2 className="font-black text-gray-900 text-base md:text-lg truncate tracking-tight leading-tight">{chat.name}</h2>
            <div className="flex items-center gap-1.5 h-4 mt-0.5">
              {chat.isTyping ? (
                <div className="flex items-center gap-1">
                  <div className="flex gap-0.5">
                    <div className="w-1 h-1 bg-teal-500 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
                    <div className="w-1 h-1 bg-teal-500 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
                    <div className="w-1 h-1 bg-teal-500 rounded-full animate-bounce"></div>
                  </div>
                  <p className="text-[9px] text-teal-600 font-black uppercase tracking-widest truncate">{chat.typingUser || 'Peer'} is typing</p>
                </div>
              ) : (
                <div className="flex items-center gap-1">
                   <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full"></div>
                   <p className="text-[9px] text-gray-400 font-black uppercase tracking-[0.1em] truncate">Synchronized</p>
                </div>
              )}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-0.5 md:gap-2">
          <button className="hidden sm:flex p-2 md:p-3.5 hover:bg-gray-100 rounded-xl md:rounded-2xl text-gray-400 hover:text-teal-600 transition-all"><Video size={20} /></button>
          <button className="hidden sm:flex p-2 md:p-3.5 hover:bg-gray-100 rounded-xl md:rounded-2xl text-gray-400 hover:text-teal-600 transition-all"><Phone size={19} /></button>
          <div className="hidden sm:block w-px h-6 md:h-8 bg-gray-100 mx-1 md:mx-2"></div>
          <button className="p-2 md:p-3.5 hover:bg-gray-100 rounded-xl md:rounded-2xl text-gray-400 hover:text-gray-900 transition-all"><MoreVertical size={20} /></button>
        </div>
      </div>

      {/* Messages */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 md:px-16 lg:px-32 whatsapp-bg scroll-smooth custom-scrollbar">
        <div className="flex flex-col gap-3 min-h-full">
          {messages.map((msg, idx) => {
            const isMe = msg.senderId === currentUser.id;
            const isAI = msg.senderId === 'gemini-ai';
            const showSender = chat.isGroup && !isMe && (idx === 0 || messages[idx-1].senderId !== msg.senderId);

            return (
              <div 
                key={msg.id} 
                className={`flex w-full ${isMe ? 'justify-end' : 'justify-start'} animate-in fade-in slide-in-from-bottom-2 duration-300`}
              >
                <div className={`group relative max-w-[90%] md:max-w-[85%] lg:max-w-[70%] px-4 md:px-5 py-3 md:py-4 rounded-2xl md:rounded-[2rem] shadow-sm border transition-all hover:shadow-md ${
                  isMe 
                    ? 'bg-teal-600 text-white border-teal-500 rounded-tr-none' 
                    : isAI 
                      ? 'bg-indigo-600 text-white border-indigo-500 rounded-tl-none shadow-indigo-100' 
                      : 'bg-white text-gray-800 border-gray-100 rounded-tl-none'
                }`}>
                  {showSender && <p className="text-[9px] font-black mb-1 opacity-60 uppercase tracking-widest">{msg.senderName}</p>}
                  
                  {isAI && (
                    <div className="flex items-center gap-1.5 mb-1.5 opacity-90">
                      <div className="w-1 h-1 bg-white rounded-full animate-pulse shadow-[0_0_6px_white]" />
                      <span className="text-[8px] font-black uppercase tracking-[0.2em]">AI Response</span>
                    </div>
                  )}

                  <p className="text-[14px] md:text-[15px] leading-relaxed break-words font-medium pr-1">
                    {renderMessageContent(msg.content)}
                  </p>

                  <div className={`flex items-center justify-end gap-1.5 mt-1.5 ${!isMe && !isAI ? 'text-gray-400' : 'opacity-80'}`}>
                    <span className="text-[9px] md:text-[10px] font-black tracking-tighter">
                      {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                    {isMe && <span className="flex items-center justify-center min-w-[14px]">{renderStatus(msg.status)}</span>}
                  </div>
                </div>
              </div>
            );
          })}
          {chat.isTyping && (
            <div className="flex justify-start mb-4 mt-1">
              <div className="bg-white/80 backdrop-blur-md px-4 py-3 rounded-2xl border border-gray-100 shadow-sm flex items-center gap-2 animate-in fade-in slide-in-from-left-2">
                <div className="flex gap-1">
                  <div className="w-1.5 h-1.5 bg-teal-500 rounded-full animate-bounce [animation-delay:0ms]"></div>
                  <div className="w-1.5 h-1.5 bg-teal-500 rounded-full animate-bounce [animation-delay:200ms]"></div>
                  <div className="w-1.5 h-1.5 bg-teal-500 rounded-full animate-bounce [animation-delay:400ms]"></div>
                </div>
                <span className="text-[9px] font-black uppercase tracking-[0.1em] text-teal-600">Receiving...</span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Footer */}
      <div className="bg-white border-t border-gray-100 p-3 md:p-6 md:px-16 lg:px-32 flex items-end gap-3 md:gap-5 shrink-0 shadow-[0_-10px_30px_rgba(0,0,0,0.02)] z-20">
        <div className="flex gap-0.5 md:gap-1 mb-1 md:mb-1.5">
          <button className="p-2 md:p-3.5 text-gray-400 hover:bg-gray-50 rounded-xl transition-all"><Smile size={22} /></button>
          <button className="hidden sm:flex p-2 md:p-3.5 text-gray-400 hover:bg-gray-50 rounded-xl transition-all"><Paperclip size={20} className="rotate-45" /></button>
        </div>
        
        <div className="flex-1 bg-gray-50/70 rounded-2xl md:rounded-[2rem] px-4 md:px-8 py-2 md:py-4 flex items-center border-2 border-transparent focus-within:border-teal-100 focus-within:bg-white transition-all">
          <textarea 
            rows={1}
            placeholder="Encrypted whisper..." 
            className="flex-1 bg-transparent border-none outline-none py-1 text-[15px] md:text-[16px] resize-none max-h-32 font-medium placeholder:text-gray-400 scroll-none"
            value={input}
            onChange={handleInputChange}
            onKeyDown={handleKeyPress}
          />
        </div>

        <button 
          onClick={handleSend}
          disabled={!input.trim()}
          className={`p-3.5 md:p-5 rounded-xl md:rounded-[1.5rem] transition-all shrink-0 flex items-center justify-center shadow-xl ${
            input.trim() 
              ? 'bg-teal-600 text-white shadow-teal-600/30 hover:bg-teal-700 active:scale-95' 
              : 'bg-gray-100 text-gray-300 shadow-none'
          }`}
        >
          <Send size={22} className={input.trim() ? 'translate-x-0.5' : ''} />
        </button>
      </div>
    </div>
  );
};

export default ChatArea;
