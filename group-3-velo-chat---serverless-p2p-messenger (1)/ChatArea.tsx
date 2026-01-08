import React, { useState, useRef, useEffect } from 'react';
import { Chat, Message, UserProfile, MessageType } from './types.ts';
import { Send, Smile, Paperclip, MoreVertical, ChevronLeft, Check, CheckCheck, Clock } from 'lucide-react';

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

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages, chat.isTyping]);

  const handleSend = () => {
    if (input.trim()) {
      onSendMessage(chat.id, input.trim());
      setInput('');
      onTyping(chat.id, false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-[#f8f9fa] w-full overflow-hidden">
      <div className="bg-white/90 backdrop-blur-md px-6 py-4 flex items-center justify-between border-b shadow-sm z-20">
        <div className="flex items-center gap-4">
          {onBack && <button onClick={onBack} className="md:hidden p-1"><ChevronLeft size={24} /></button>}
          <div className="relative">
            <img src={chat.avatar} className="w-10 h-10 rounded-xl border shadow-sm object-cover" />
            <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-emerald-500 border-2 border-white rounded-full shadow-sm"></div>
          </div>
          <div>
            <h2 className="font-black text-gray-900 tracking-tight leading-tight">{chat.name}</h2>
            <div className="flex items-center gap-1">
              <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest">
                {chat.isTyping ? <span className="text-teal-500 animate-pulse">Neural sync...</span> : 'Connected'}
              </p>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
           <button className="p-2 text-gray-400 hover:text-gray-600 transition-colors"><MoreVertical size={20} /></button>
        </div>
      </div>

      <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 md:px-12 whatsapp-bg space-y-3 custom-scrollbar">
        {messages.map((msg) => {
          const isMe = msg.senderId === currentUser.id;
          return (
            <div key={msg.id} className={`flex w-full ${isMe ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[85%] px-4 py-3 rounded-2xl shadow-sm border ${
                isMe ? 'bg-teal-600 text-white border-teal-500 rounded-tr-none' : 'bg-white text-gray-800 border-gray-100 rounded-tl-none'
              }`}>
                {chat.isGroup && !isMe && <p className="text-[9px] font-black mb-1 opacity-50 uppercase tracking-widest">{msg.senderName}</p>}
                <p className="text-sm font-medium leading-relaxed break-words">{msg.content}</p>
                <div className={`flex justify-end items-center gap-1 mt-1 ${isMe ? 'text-white/70' : 'text-gray-400'}`}>
                  <span className="text-[9px] font-black">{new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                  {isMe && (
                    <span className="flex items-center">
                      {msg.status === 'read' ? <CheckCheck size={12} className="text-teal-300" /> : 
                       msg.status === 'delivered' ? <CheckCheck size={12} /> : 
                       msg.status === 'sent' ? <Check size={12} /> : <Clock size={10} className="animate-pulse" />}
                    </span>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="bg-white border-t p-4 flex gap-3 items-end shadow-[0_-10px_30px_rgba(0,0,0,0.02)]">
        <button className="p-2 text-gray-400 hover:text-gray-600 transition-colors"><Smile size={22} /></button>
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
            onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && (e.preventDefault(), handleSend())}
          />
        </div>
        <button onClick={handleSend} className={`p-4 rounded-2xl transition-all shadow-xl ${input.trim() ? 'bg-teal-600 text-white hover:bg-teal-700' : 'bg-gray-100 text-gray-300'}`}>
          <Send size={20} />
        </button>
      </div>
    </div>
  );
};

export default ChatArea;