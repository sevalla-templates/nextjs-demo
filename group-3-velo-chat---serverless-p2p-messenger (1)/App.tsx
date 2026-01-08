import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Peer, DataConnection } from 'peerjs';
import { v4 as uuidv4 } from 'uuid';
import { 
  Message, 
  Chat, 
  UserProfile, 
  MessageType, 
  P2PDataPacket 
} from './types.ts';
import Sidebar from './Sidebar.tsx';
import ChatArea from './ChatArea.tsx';
import WelcomeScreen from './WelcomeScreen.tsx';

const App: React.FC = () => {
  const [peer, setPeer] = useState<Peer | null>(null);
  const [user, setUser] = useState<UserProfile | null>(() => {
    try {
      const saved = localStorage.getItem('velo_chat_user');
      return saved ? JSON.parse(saved) : null;
    } catch (e) { 
      console.error("Local Storage Error (User):", e);
      return null; 
    }
  });
  const [chats, setChats] = useState<Chat[]>(() => {
    try {
      const saved = localStorage.getItem('velo_chat_chats');
      return saved ? JSON.parse(saved) : [];
    } catch (e) { 
      console.error("Local Storage Error (Chats):", e);
      return []; 
    }
  });
  const [messages, setMessages] = useState<Message[]>(() => {
    try {
      const saved = localStorage.getItem('velo_chat_messages');
      return saved ? JSON.parse(saved) : [];
    } catch (e) { 
      console.error("Local Storage Error (Messages):", e);
      return []; 
    }
  });
  const [activeChatId, setActiveChatId] = useState<string | null>(null);
  const [isInitializing, setIsInitializing] = useState(true);
  const [initError, setInitError] = useState<string | null>(null);

  const connRefs = useRef<Map<string, DataConnection>>(new Map());
  const activeChatIdRef = useRef<string | null>(null);

  useEffect(() => {
    activeChatIdRef.current = activeChatId;
    if (activeChatId) {
      setChats(prev => prev.map(c => c.id === activeChatId ? { ...c, unreadCount: 0 } : c));
    }
  }, [activeChatId]);

  useEffect(() => {
    if (chats.length > 0) {
      localStorage.setItem('velo_chat_chats', JSON.stringify(chats));
    }
  }, [chats]);

  useEffect(() => {
    if (messages.length > 0) {
      localStorage.setItem('velo_chat_messages', JSON.stringify(messages));
    }
  }, [messages]);

  const generateInviteLink = useCallback((id: string) => {
    const baseUrl = window.location.origin + window.location.pathname;
    const url = new URL(baseUrl);
    url.searchParams.set('id', id);
    return url.href;
  }, []);

  const sendPacket = useCallback((peerId: string, packet: P2PDataPacket) => {
    const conn = connRefs.current.get(peerId);
    if (conn && conn.open) {
      conn.send(packet);
      return true;
    }
    return false;
  }, []);

  const handleData = useCallback((data: P2PDataPacket, remotePeerId: string) => {
    switch (data.type) {
      case 'MESSAGE':
        const msg = data.payload;
        sendPacket(remotePeerId, { type: 'DELIVERY_CONFIRM', payload: { chatId: msg.chatId, messageId: msg.id } });
        setMessages(prev => prev.some(m => m.id === msg.id) ? prev : [...prev, { ...msg, status: 'delivered' }]);
        setChats(prev => prev.map(c => c.id === msg.chatId ? { 
          ...c, 
          lastMessage: msg, 
          unreadCount: activeChatIdRef.current === c.id ? 0 : c.unreadCount + 1,
          isTyping: false
        } : c));
        break;
      case 'DELIVERY_CONFIRM':
        setMessages(prev => prev.map(m => m.id === data.payload.messageId ? { ...m, status: 'delivered' } : m));
        break;
      case 'TYPING':
        setChats(prev => prev.map(c => c.id === data.payload.chatId ? { ...c, isTyping: data.payload.isTyping, typingUser: data.payload.userId } : c));
        break;
      case 'GROUP_INVITE':
        setChats(prev => prev.some(c => c.id === data.payload.id) ? prev : [...prev, data.payload]);
        break;
    }
  }, [sendPacket]);

  const setupConnection = useCallback((conn: DataConnection, peerId: string, autoSelect = false) => {
    conn.on('open', () => {
      connRefs.current.set(peerId, conn);
      setChats(prev => {
        const existing = prev.find(c => !c.isGroup && c.participants.includes(peerId));
        if (existing) { 
          if (autoSelect) setActiveChatId(existing.id); 
          return prev; 
        }
        const newChatId = uuidv4();
        if (autoSelect) setActiveChatId(newChatId);
        return [...prev, { 
          id: newChatId, 
          name: `Node ${peerId.slice(0, 6).toUpperCase()}`, 
          isGroup: false, 
          participants: [user!.id, peerId], 
          unreadCount: 0, 
          avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${peerId}` 
        }];
      });
    });
    conn.on('data', (d) => handleData(d as P2PDataPacket, peerId));
    conn.on('close', () => {
      connRefs.current.delete(peerId);
    });
    conn.on('error', (err) => {
      console.error("Connection Error:", err);
    });
  }, [handleData, user]);

  const initPeer = useCallback((profile: UserProfile) => {
    setIsInitializing(true);
    setInitError(null);
    try {
      const newPeer = new Peer({ 
        config: { 
          iceServers: [
            { urls: 'stun:stun.l.google.com:19302' }, 
            { urls: 'stun:global.stun.twilio.com:3478' }
          ] 
        } 
      });

      newPeer.on('open', (id) => {
        const u = { ...profile, id };
        setUser(u);
        localStorage.setItem('velo_chat_user', JSON.stringify(u));
        const inviteId = new URLSearchParams(window.location.search).get('id');
        if (inviteId && inviteId !== id) {
          setTimeout(() => {
            const conn = newPeer.connect(inviteId, { reliable: true });
            setupConnection(conn, inviteId, true);
          }, 1500);
        }
        setIsInitializing(false);
        setPeer(newPeer);
      });

      newPeer.on('connection', (c) => setupConnection(c, c.peer));
      newPeer.on('error', (err) => {
        console.error('PeerJS Nexus Error:', err);
        setIsInitializing(false);
        setInitError("Handshake restricted by local network firewall or Peer server timeout.");
      });
    } catch (e) {
      console.error("Initialization Crash:", e);
      setInitError("Nexus Engine failure. Restarting node...");
      setIsInitializing(false);
    }
  }, [setupConnection]);

  useEffect(() => {
    if (user && !peer) {
      initPeer(user);
    } else if (!user) {
      setIsInitializing(false);
    }
  }, [user, peer, initPeer]);

  const sendMessage = async (chatId: string, content: string) => {
    if (!user) return;
    const msg: Message = { 
      id: uuidv4(), 
      senderId: user.id, 
      senderName: user.name, 
      content, 
      timestamp: Date.now(), 
      type: MessageType.TEXT, 
      chatId, 
      status: 'sending' 
    };
    
    setMessages(prev => [...prev, msg]);
    setChats(prev => prev.map(c => c.id === chatId ? { ...c, lastMessage: msg } : c));
    
    const chat = chats.find(c => c.id === chatId);
    let sentToAnyone = false;
    chat?.participants.forEach(pId => {
      if (pId !== user.id) {
        if (sendPacket(pId, { type: 'MESSAGE', payload: msg })) sentToAnyone = true;
      }
    });

    if (sentToAnyone) {
      setMessages(prev => prev.map(m => m.id === msg.id ? { ...m, status: 'sent' } : m));
    }
  };

  const handleCreateGroup = (name: string, participants: string[]) => {
    if (!user) return;
    const groupId = uuidv4();
    const newChat: Chat = {
      id: groupId,
      name,
      isGroup: true,
      participants: [user.id, ...participants],
      unreadCount: 0,
      avatar: `https://api.dicebear.com/7.x/shapes/svg?seed=${groupId}`
    };
    setChats(prev => [...prev, newChat]);
    participants.forEach(pId => sendPacket(pId, { type: 'GROUP_INVITE', payload: newChat }));
    setActiveChatId(groupId);
  };

  const handleTyping = (chatId: string, isTyping: boolean) => {
    if (!user) return;
    const chat = chats.find(c => c.id === chatId);
    chat?.participants.forEach(pId => {
      if (pId !== user.id) {
        sendPacket(pId, { type: 'TYPING', payload: { chatId, userId: user.name, isTyping } });
      }
    });
  };

  if (!user) return <WelcomeScreen onProfileComplete={initPeer} isInitializing={isInitializing} error={initError} onRetry={() => window.location.reload()} />;

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden text-slate-900 selection:bg-teal-100">
      <div className={`flex flex-col h-full w-full md:w-[400px] shrink-0 border-r border-slate-200 transition-all duration-300 ${activeChatId ? 'hidden md:block' : 'flex'}`}>
        <Sidebar 
          user={user} 
          chats={chats} 
          activeChatId={activeChatId} 
          onChatSelect={setActiveChatId} 
          onConnect={(id) => peer && setupConnection(peer.connect(id, { reliable: true }), id, true)} 
          onCreateGroup={handleCreateGroup}
          inviteLink={generateInviteLink(user.id)} 
        />
      </div>
      <div className={`flex-1 relative flex flex-col min-w-0 h-full bg-white transition-all duration-300 ${!activeChatId ? 'hidden md:flex' : 'flex'}`}>
        {activeChatId ? (
          <ChatArea 
            chat={chats.find(c => c.id === activeChatId)!} 
            messages={messages.filter(m => m.chatId === activeChatId)} 
            onSendMessage={sendMessage} 
            onTyping={handleTyping} 
            currentUser={user} 
            onBack={() => setActiveChatId(null)} 
          />
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center relative mesh-bg h-full">
            <div className="absolute inset-0 mesh-dot-grid" />
            <div className="bg-white/95 p-12 rounded-[3rem] shadow-2xl text-center backdrop-blur-md max-w-lg border border-white relative z-10 mx-6">
              <div className="w-20 h-20 bg-teal-600 rounded-3xl mx-auto mb-8 flex items-center justify-center text-white shadow-xl">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <h1 className="text-4xl font-black text-slate-900 mb-4 tracking-tighter leading-none">Velo Mesh</h1>
              <p className="text-slate-500 mb-10 text-lg font-medium">Distributed Sovereignty. Your messages never touch a central server.</p>
              
              <div className="p-6 bg-slate-50 rounded-2xl border border-slate-100 w-full shadow-inner">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Your Nexus Address</p>
                <code className="block text-teal-700 font-mono text-xs break-all bg-white p-4 rounded-xl border border-slate-200 mb-5 select-all shadow-sm">
                  {generateInviteLink(user.id)}
                </code>
                <button 
                  onClick={() => {
                    navigator.clipboard.writeText(generateInviteLink(user.id));
                    alert('Nexus Link Copied!');
                  }}
                  className="w-full py-4 bg-teal-600 text-white rounded-xl font-bold hover:bg-teal-700 transition-all shadow-lg active:scale-95"
                >
                  Copy Handshake Link
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default App;