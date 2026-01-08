"use client";
import React, { useEffect, useMemo, useRef, useState } from "react";
import ChatInput from "@/components/ChatInput";
import Sidebar from "@/components/Sidebar";
import ChatArea from "@/components/ChatArea";
import { UserProfile, Chat, Message, MessageType } from "@/types";

type Role = "a" | "b";
type WSMsg = { type: "join" | "signal" | "ping"; room?: string; role?: Role; payload?: any };

async function apiPost(roomId: string, payload: any) {
  await fetch(`/api/signal/${roomId}`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(payload),
  });
}

async function apiPoll(roomId: string, forSide: Role) {
  const res = await fetch(`/api/signal/${roomId}?for=${forSide}`);
  if (!res.ok) return [] as { type: string; data: any }[];
  return (await res.json()) as { type: string; data: any }[];
}

export default function ChatPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [roomId, setRoomId] = useState<string>("room-1");
  const [role, setRole] = useState<Role>("a");
  const [connected, setConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [chats, setChats] = useState<Chat[]>([]);
  const [activeChatId, setActiveChatId] = useState<string | null>(null);

  const pcRef = useRef<RTCPeerConnection | null>(null);
  const dcRef = useRef<RTCDataChannel | null>(null);
  const pollTimerRef = useRef<any>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const listContainerRef = useRef<HTMLDivElement | null>(null);

  // Load user profile from session storage
  useEffect(() => {
    try {
      const stored = sessionStorage.getItem("userProfile");
      if (stored) {
        const profile = JSON.parse(stored);
        setUserProfile(profile);
        // Initialize with current room as a chat
        const currentChat: Chat = {
          id: roomId,
          name: `Room ${roomId}`,
          isGroup: false,
          participants: [profile.id],
          unreadCount: 0,
          avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=room",
        };
        setChats([currentChat]);
        setActiveChatId(roomId);
      }
    } catch {}
  }, []);

  // Prefill from URL parameters (e.g., /chat?room=room-1&role=b)
  useEffect(() => {
    try {
      const url = new URL(window.location.href);
      const r = url.searchParams.get("room");
      const ro = url.searchParams.get("role") as Role | null;
      if (r) setRoomId(r);
      if (ro === "a" || ro === "b") setRole(ro);
    } catch {}
  }, []);

  useEffect(() => {
    return () => {
      if (pollTimerRef.current) clearInterval(pollTimerRef.current);
      pcRef.current?.close();
    };
  }, []);

  const appendMsg = (text: string, sender: "me" | "peer") => {
    const now = Date.now();
    const isMe = sender === "me";
    const message: Message = {
      id: `${now}-${Math.random()}`,
      text,
      sender,
      timestamp: now,
      senderId: isMe ? (userProfile?.id || "me") : "peer",
      senderName: isMe ? (userProfile?.name || "Me") : "Peer",
      content: text,
      status: isMe ? "sent" : "delivered",
      type: MessageType.TEXT,
      chatId: activeChatId || roomId,
    };
    setMessages((prev) => [...prev, message]);
    setChats((prev) =>
      prev.map((c) =>
        c.id === (activeChatId || roomId)
          ? { ...c, lastMessage: message, isTyping: false }
          : c
      )
    );
  };

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    const el = listContainerRef.current;
    if (el) {
      el.scrollTop = el.scrollHeight;
    }
  }, [messages]);

  const startConnection = async () => {
    setError(null);
    const pc = new RTCPeerConnection({
      iceServers: [{ urls: ["stun:stun.l.google.com:19302"] }],
    });
    pcRef.current = pc;

    pc.onicecandidate = (e) => {
      if (e.candidate) {
        apiPost(roomId, { from: role, type: "candidate", data: e.candidate });
      }
    };

    pc.onconnectionstatechange = () => {
      setConnected(pc.connectionState === "connected");
    };

    if (role === "a") {
      const dc = pc.createDataChannel("chat");
      dc.onopen = () => setConnected(true);
      dc.onmessage = (ev) => {
        try {
          const parsed = JSON.parse(String(ev.data));
          if (parsed?.type === "message") {
            const { id, text, ts } = parsed;
            appendMsg(text, "peer");
            // Send ack back
            dc.send(JSON.stringify({ type: "ack", id }));
          } else if (parsed?.type === "ack") {
            const { id } = parsed;
            setMessages((prev) => prev.map((m) => (m.id === id ? { ...m, status: "delivered" } : m)));
          } else if (parsed?.type === "typing") {
            setChats((prev) => prev.map((c) => c.id === activeChatId ? { ...c, isTyping: Boolean(parsed.value) } : c));
          }
        } catch {
          // Fallback: treat as plain text
          appendMsg(String(ev.data), "peer");
        }
      };
      dcRef.current = dc;
      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);
      await apiPost(roomId, { from: "a", type: "offer", data: offer });
    } else {
      pc.ondatachannel = (ev) => {
        const dc = ev.channel;
        dc.onopen = () => setConnected(true);
        dc.onmessage = (e) => {
          try {
            const parsed = JSON.parse(String(e.data));
            if (parsed?.type === "message") {
              const { id, text } = parsed;
              appendMsg(text, "peer");
              dc.send(JSON.stringify({ type: "ack", id }));
            } else if (parsed?.type === "ack") {
              const { id } = parsed;
              setMessages((prev) => prev.map((m) => (m.id === id ? { ...m, status: "delivered" } : m)));
            } else if (parsed?.type === "typing") {
              setChats((prev) => prev.map((c) => c.id === activeChatId ? { ...c, isTyping: Boolean(parsed.value) } : c));
            }
          } catch {
            appendMsg(String(e.data), "peer");
          }
        };
        dcRef.current = dc;
      };
    }

    // Try WebSocket signaling first
    try {
      const wsUrl = (() => {
        if (process.env.NEXT_PUBLIC_SIGNAL_WS_URL) return process.env.NEXT_PUBLIC_SIGNAL_WS_URL as string;
        if (typeof window !== "undefined") {
          const protocol = window.location.protocol === "https:" ? "wss" : "ws";
          return `${protocol}://${window.location.hostname}:3001`;
        }
        return "ws://localhost:3001";
      })();
      const ws = new WebSocket(wsUrl);
      wsRef.current = ws;
      ws.onopen = () => {
        const joinMsg: WSMsg = { type: "join", room: roomId, role };
        ws.send(JSON.stringify(joinMsg));
      };
      ws.onmessage = async (ev) => {
        try {
          const data = JSON.parse(String(ev.data));
          if (data?.type === "signal" && data?.payload) {
            const it = data.payload;
            if (it.type === "offer" && role === "b") {
              await pc.setRemoteDescription(new RTCSessionDescription(it.data));
              const answer = await pc.createAnswer();
              await pc.setLocalDescription(answer);
              const msg: WSMsg = { type: "signal", payload: { type: "answer", data: answer } };
              ws.send(JSON.stringify(msg));
            } else if (it.type === "answer" && role === "a") {
              await pc.setRemoteDescription(new RTCSessionDescription(it.data));
            } else if (it.type === "candidate") {
              await pc.addIceCandidate(new RTCIceCandidate(it.data));
            }
          }
        } catch (e) {
          console.error("WS message error", e);
        }
      };
      ws.onerror = () => {
        // Fallback to REST polling if WS fails
        startRestPolling(pc);
      };
      ws.onclose = () => {
        // If closed early, fallback
        if (!connected) startRestPolling(pc);
      };
    } catch {
      // Fallback if WebSocket construction fails
      startRestPolling(pc);
    }
  };

  const startRestPolling = (pc: RTCPeerConnection) => {
    pollTimerRef.current = setInterval(async () => {
      const items = await apiPoll(roomId, role);
      for (const it of items) {
        if (it.type === "offer" && role === "b") {
          try {
            await pc.setRemoteDescription(new RTCSessionDescription(it.data));
            const answer = await pc.createAnswer();
            await pc.setLocalDescription(answer);
            await apiPost(roomId, { from: "b", type: "answer", data: answer });
          } catch (e: any) {
            setError(e?.message ?? "Failed to answer offer");
          }
        } else if (it.type === "answer" && role === "a") {
          try {
            await pc.setRemoteDescription(new RTCSessionDescription(it.data));
          } catch (e: any) {
            setError(e?.message ?? "Failed to set remote answer");
          }
        } else if (it.type === "candidate") {
          try {
            await pc.addIceCandidate(new RTCIceCandidate(it.data));
          } catch (err) {
            console.error("Failed to add ICE candidate", err);
            setError("Failed to add ICE candidate");
          }
        }
      }
    }, 1000);
  };

  const handleSend = (text: string) => {
    if (!dcRef.current || dcRef.current.readyState !== "open") return;
    const id = `${Date.now()}-${Math.random()}`;
    const ts = Date.now();
    const payload = { type: "message", id, text, ts };
    dcRef.current.send(JSON.stringify(payload));
    const message: Message = {
      id,
      text,
      sender: "me",
      timestamp: ts,
      status: "sent",
      senderId: userProfile?.id || "me",
      senderName: userProfile?.name || "Me",
      content: text,
      type: MessageType.TEXT,
      chatId: activeChatId || roomId,
    };
    setMessages((prev) => [...prev, message]);
    setChats((prev) =>
      prev.map((c) =>
        c.id === (activeChatId || roomId)
          ? { ...c, lastMessage: message, isTyping: false }
          : c
      )
    );
  };

  const disconnect = () => {
    try {
      if (pollTimerRef.current) clearInterval(pollTimerRef.current);
      pollTimerRef.current = null;
      dcRef.current?.close();
      pcRef.current?.close();
      wsRef.current?.close();
      dcRef.current = null;
      pcRef.current = null;
      wsRef.current = null;
      setConnected(false);
    } catch {}
  };

  const inviteLink = useMemo(() => {
    try {
      const origin = window.location.origin;
      const opposite = role === "a" ? "b" : "a";
      return `${origin}/chat?room=${encodeURIComponent(roomId)}&role=${opposite}`;
    } catch {
      return "";
    }
  }, [roomId, role]);

  const handleChatSelect = (chatId: string) => {
    setActiveChatId(chatId);
    setRoomId(chatId);
    // Optionally: load messages for this chat
  };

  const handleConnect = (peerId: string) => {
    // Create a new chat for this connection
    const newChat: Chat = {
      id: peerId,
      name: `Peer ${peerId.substring(0, 8)}`,
      isGroup: false,
      participants: [userProfile?.id || "", peerId],
      unreadCount: 0,
      avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${peerId}`,
    };
    setChats((prev) => [...prev, newChat]);
    setRoomId(peerId);
    setActiveChatId(peerId);
  };

  const handleCreateGroup = (name: string, participants: string[]) => {
    const groupId = `group-${Date.now()}`;
    const newGroup: Chat = {
      id: groupId,
      name,
      isGroup: true,
      participants,
      unreadCount: 0,
      avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${groupId}`,
    };
    setChats((prev) => [...prev, newGroup]);
    setActiveChatId(groupId);
  };

  return (
    <div className="min-h-screen bg-[#ECE5DD] flex font-[family-name:var(--font-geist-sans)]">
      {userProfile && (
        <div className="w-80 border-r border-gray-200 flex-shrink-0">
          <Sidebar
            user={userProfile}
            chats={chats}
            activeChatId={activeChatId}
            onChatSelect={handleChatSelect}
            onConnect={handleConnect}
            onCreateGroup={handleCreateGroup}
            inviteLink={inviteLink}
          />
        </div>
      )}
      <div className="flex-1 flex flex-col">
        {activeChatId && userProfile ? (
          <ChatArea
            chat={chats.find(c => c.id === activeChatId) || {
              id: activeChatId,
              name: `Chat ${activeChatId.substring(0, 8)}`,
              isGroup: false,
              participants: [userProfile.id, activeChatId],
              unreadCount: 0,
              avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${activeChatId}`,
            }}
            messages={messages}
            currentUser={userProfile}
            onSendMessage={(chatId, content, type) => handleSend(content)}
            onTyping={(chatId, isTyping) => {
              if (dcRef.current && dcRef.current.readyState === "open") {
                dcRef.current.send(JSON.stringify({ type: "typing", value: isTyping }));
              }
            }}
          />
        ) : (
          <div className="flex-1 flex items-center justify-center bg-[#ECE5DD] px-4">
            <div className="max-w-lg w-full bg-white rounded-3xl shadow-lg border border-white/60 p-8 text-gray-800 space-y-4">
              <div>
                <p className="text-2xl font-black text-gray-900">Welcome to Velo Chat</p>
                <p className="text-sm text-gray-700">Enter a room and role, then start the P2P link.</p>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <input
                  className="rounded-2xl border border-gray-200 px-4 py-3 text-sm outline-none focus:border-[#25D366] focus:ring-1 focus:ring-[#25D366] bg-gray-50"
                  value={roomId}
                  onChange={(e) => setRoomId(e.target.value)}
                  placeholder="Room ID"
                />
                <select
                  className="rounded-2xl border border-gray-200 px-4 py-3 text-sm outline-none focus:border-[#25D366] focus:ring-1 focus:ring-[#25D366] bg-gray-50"
                  value={role}
                  onChange={(e) => setRole(e.target.value as Role)}
                >
                  <option value="a">Role A</option>
                  <option value="b">Role B</option>
                </select>
                <button
                  className="rounded-2xl bg-[#25D366] text-white px-6 py-3 text-sm font-bold hover:opacity-95 shadow"
                  onClick={startConnection}
                  type="button"
                >
                  {connected ? "Connected" : "Connect"}
                </button>
              </div>
              <div className="text-sm text-gray-700 space-y-1 leading-relaxed">
                <div>• Share the invite link from the sidebar.</div>
                <div>• Role A creates the offer; Role B answers.</div>
                <div>• If WebSocket is blocked, REST polling kicks in automatically.</div>
              </div>
              <div className="flex flex-wrap items-center gap-2 text-xs font-black uppercase tracking-widest">
                <span className={`px-3 py-1 rounded-full ${connected ? "bg-emerald-100 text-emerald-700" : "bg-gray-200 text-gray-600"}`}>
                  {connected ? "P2P Linked" : "Not Connected"}
                </span>
                <span className="px-3 py-1 rounded-full bg-gray-100 text-gray-700">Room: {roomId}</span>
                <span className="px-3 py-1 rounded-full bg-gray-100 text-gray-700">Role: {role.toUpperCase()}</span>
              </div>
              {error && (
                <div className="mt-4 text-sm text-red-600">Error: {error}</div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
