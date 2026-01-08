
import React, { useState } from 'react';
import { UserProfile, Chat } from '../types';
import { Plus, Users, Search, Share2, X, Link as LinkIcon, ShieldCheck, Activity, CheckCheck } from 'lucide-react';

interface SidebarProps {
  user: UserProfile;
  chats: Chat[];
  activeChatId: string | null;
  onChatSelect: (id: string) => void;
  onConnect: (peerId: string) => void;
  onCreateGroup: (name: string, participants: string[]) => void;
  inviteLink: string;
}

const Sidebar: React.FC<SidebarProps> = ({ 
  user, 
  chats, 
  activeChatId, 
  onChatSelect, 
  onConnect,
  onCreateGroup,
  inviteLink
}) => {
  const [modalType, setModalType] = useState<'none' | 'connect' | 'group' | 'invite'>('none');
  const [peerIdInput, setPeerIdInput] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  const filteredChats = chats.filter(chat => 
    chat.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="flex flex-col h-full bg-white z-30 relative w-full">
      {/* User Header */}
      <div className="bg-white px-6 md:px-8 py-6 md:py-8 flex items-center justify-between border-b border-gray-50 shrink-0">
        <div className="flex items-center gap-4 md:gap-5 group cursor-pointer" onClick={() => setModalType('invite')}>
          <div className="relative shrink-0">
            <img src={user.avatar} alt="Me" className="w-12 h-12 md:w-16 md:h-16 rounded-[1.5rem] md:rounded-[2rem] bg-teal-50 border-2 border-white shadow-xl group-hover:scale-105 transition-all duration-700 object-cover" />
            <div className="absolute -bottom-1 -right-1 w-4 h-4 md:w-6 md:h-6 bg-emerald-500 border-2 md:border-4 border-white rounded-full animate-pulse shadow-sm"></div>
          </div>
          <div className="overflow-hidden">
            <p className="font-black text-lg md:text-xl text-gray-900 truncate tracking-tighter leading-tight">{user.name}</p>
            <div className="flex items-center gap-2 mt-1">
               <ShieldCheck size={14} className="text-teal-600" />
               <p className="text-[10px] text-teal-600 font-black uppercase tracking-[0.25em]">Node Operational</p>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <button onClick={() => setModalType('connect')} className="hover:bg-gray-50 p-2.5 md:p-3.5 rounded-2xl transition-all text-gray-400 hover:text-teal-600"><Plus size={24} /></button>
          <button onClick={() => setModalType('group')} className="hover:bg-gray-50 p-2.5 md:p-3.5 rounded-2xl transition-all text-gray-400 hover:text-teal-600"><Users size={22} /></button>
        </div>
      </div>

      {/* Health Stats */}
      <div className="px-6 md:px-8 py-3 bg-teal-50/40 flex items-center justify-between border-b border-teal-50 shrink-0">
         <div className="flex items-center gap-2.5">
            <div className="relative flex items-center justify-center">
               <Activity size={14} className="text-teal-600 relative z-10" />
               <div className="absolute inset-0 bg-teal-400 rounded-full animate-ping opacity-20"></div>
            </div>
            <span className="text-[11px] font-black text-teal-900 uppercase tracking-widest">Nexus Pulse</span>
         </div>
         <span className="text-[10px] font-black text-teal-700 bg-white px-3 py-1 rounded-full border border-teal-100 shadow-sm">
            {chats.length} Peered
         </span>
      </div>

      {/* Search Area */}
      <div className="px-6 md:px-8 py-4 md:py-6 bg-white shrink-0">
        <div className="relative flex items-center bg-gray-50 rounded-2xl md:rounded-3xl px-4 md:px-6 py-3 md:py-4 border-2 border-transparent focus-within:border-teal-100 focus-within:bg-white focus-within:shadow-2xl focus-within:shadow-teal-600/5 transition-all">
          <Search size={20} className="text-gray-400 mr-4 shrink-0" />
          <input 
            type="text" 
            placeholder="Search node map..." 
            className="bg-transparent border-none outline-none text-[15px] md:text-[16px] w-full placeholder:text-gray-400 font-bold tracking-tight"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      {/* Chat List */}
      <div className="flex-1 overflow-y-auto px-4 md:px-5 pb-8 custom-scrollbar space-y-2">
        {filteredChats.length > 0 ? (
          filteredChats.map((chat) => (
            <div 
              key={chat.id}
              onClick={() => onChatSelect(chat.id)}
              className={`flex items-center gap-4 md:gap-5 px-4 md:px-5 py-4 md:py-6 cursor-pointer transition-all rounded-[1.5rem] md:rounded-[2.5rem] group relative border ${
                activeChatId === chat.id 
                  ? 'bg-teal-600 border-teal-500 shadow-2xl shadow-teal-600/25 md:-translate-y-0.5' 
                  : 'bg-white border-transparent hover:bg-gray-50 hover:border-gray-100'
              }`}
            >
              <div className="relative shrink-0">
                <img src={chat.avatar} alt={chat.name} className={`w-14 h-14 md:w-16 md:h-16 rounded-[1.25rem] md:rounded-[1.75rem] object-cover border-2 transition-all duration-500 ${activeChatId === chat.id ? 'border-white/40 scale-105 shadow-xl' : 'border-white shadow-md'}`} />
                {chat.unreadCount > 0 && (
                  <div className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] font-black rounded-full h-5 min-w-[20px] px-1.5 flex items-center justify-center border-2 border-white shadow-xl animate-bounce">
                    {chat.unreadCount}
                  </div>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex justify-between items-start mb-1">
                  <h3 className={`font-black text-base md:text-lg truncate tracking-tight transition-colors ${activeChatId === chat.id ? 'text-white' : 'text-gray-900'}`}>{chat.name}</h3>
                  {chat.lastMessage && (
                    <span className={`text-[10px] font-black uppercase tracking-tighter mt-1 shrink-0 ${activeChatId === chat.id ? 'text-teal-100/70' : 'text-gray-300'}`}>
                      {new Date(chat.lastMessage.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <p className={`text-[13px] md:text-[14px] truncate flex-1 font-medium transition-colors ${activeChatId === chat.id ? 'text-teal-50/80' : 'text-gray-500'}`}>
                    {chat.isTyping ? (
                      <span className="italic animate-pulse">Neural sync in progress...</span>
                    ) : chat.lastMessage ? chat.lastMessage.content : 'Establishing handshake...'}
                  </p>
                  {chat.lastMessage?.senderId === user.id && (
                     <CheckCheck size={16} className={`shrink-0 ${chat.lastMessage.status === 'read' ? 'text-teal-400' : (activeChatId === chat.id ? 'text-teal-200' : 'text-gray-300')}`} />
                  )}
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="p-8 md:p-12 text-center mt-10">
            <div className="w-20 h-20 md:w-24 md:h-24 bg-gray-50 rounded-[2.5rem] md:rounded-[3rem] flex items-center justify-center mx-auto mb-6 md:mb-8 text-gray-200 shadow-inner">
               <Share2 size={36} />
            </div>
            <p className="text-gray-900 font-black text-xl md:text-2xl tracking-tighter mb-4">Isolated Hub</p>
            <p className="text-sm text-gray-400 leading-relaxed font-bold px-4">You are currently offline from the mesh. Broadcast your node link to connect.</p>
            <button 
              onClick={() => setModalType('invite')}
              className="mt-10 md:mt-12 w-full flex items-center justify-center gap-3 px-6 py-4 md:px-8 md:py-5 bg-teal-600 text-white rounded-[1.25rem] md:rounded-[1.75rem] text-sm font-black shadow-2xl shadow-teal-600/30 hover:bg-teal-700 hover:-translate-y-1 transition-all active:scale-95"
            >
              <Share2 size={20} />
              Broadcast Link
            </button>
          </div>
        )}
      </div>

      {/* Overlay Modals */}
      {modalType !== 'none' && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-gray-900/80 backdrop-blur-xl p-4 md:p-8 animate-in fade-in duration-300">
          <div className="bg-white rounded-[2.5rem] md:rounded-[3.5rem] shadow-2xl w-full max-w-sm overflow-hidden animate-in zoom-in duration-500 border border-white/40">
            <div className="p-8 md:p-12">
              <div className="flex justify-between items-center mb-8">
                <h2 className="text-3xl font-black text-gray-900 tracking-tighter">
                  {modalType === 'connect' ? 'Handshake' : modalType === 'invite' ? 'Broadcast' : 'Mesh Group'}
                </h2>
                <button onClick={() => setModalType('none')} className="p-2 hover:bg-gray-100 rounded-xl transition-all">
                  <X size={28} className="text-gray-400" />
                </button>
              </div>

              {modalType === 'invite' && (
                <div className="space-y-8">
                  <div className="bg-teal-50/50 p-6 rounded-[2rem] border border-teal-100 flex flex-col items-center shadow-inner">
                    <div className="w-16 h-16 bg-white rounded-3xl flex items-center justify-center shadow-xl mb-4 text-teal-600">
                       <LinkIcon size={32} />
                    </div>
                    <p className="text-[10px] font-black text-teal-800 uppercase tracking-[0.4em] mb-4">Nexus Address</p>
                    <code className="w-full block text-teal-700 font-mono text-[10px] break-all bg-white/80 p-4 rounded-xl border border-teal-100 leading-relaxed text-center shadow-sm">
                      {inviteLink}
                    </code>
                  </div>
                  <button 
                    onClick={() => {
                      navigator.clipboard.writeText(inviteLink);
                      alert('Nexus Invite Copied!');
                      setModalType('none');
                    }}
                    className="w-full bg-teal-600 text-white py-5 rounded-2xl md:rounded-3xl font-black text-lg hover:bg-teal-700 transition-all shadow-2xl shadow-teal-600/30 active:scale-95"
                  >
                    Copy Global Link
                  </button>
                </div>
              )}

              {modalType === 'connect' && (
                <div className="space-y-8">
                  <div className="space-y-3">
                    <label className="text-[11px] font-black text-gray-400 uppercase tracking-[0.3em] px-3">Nexus Node UID</label>
                    <input 
                      autoFocus
                      type="text" 
                      placeholder="Enter UID..."
                      className="w-full px-6 py-5 bg-gray-50 border-2 border-transparent focus:border-teal-500 focus:bg-white rounded-[1.5rem] outline-none transition-all text-sm font-bold shadow-inner"
                      value={peerIdInput}
                      onChange={(e) => setPeerIdInput(e.target.value)}
                    />
                  </div>
                  <button 
                    onClick={() => {
                      if (peerIdInput.trim()) {
                        onConnect(peerIdInput.trim());
                        setPeerIdInput('');
                        setModalType('none');
                      }
                    }}
                    className="w-full bg-teal-600 text-white py-5 rounded-2xl md:rounded-3xl font-black text-lg hover:bg-teal-700 transition-all shadow-2xl shadow-teal-600/30 active:scale-95"
                  >
                    Connect Node
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Sidebar;
