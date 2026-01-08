"use client";
import React, { useState } from "react";
import { UserProfile, Chat } from "@/types";
import {
  Plus,
  Users,
  Search,
  X,
  ShieldCheck,
} from "lucide-react";

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
  inviteLink,
}) => {
  const [modalType, setModalType] = useState<
    "none" | "connect" | "group" | "invite"
  >("none");
  const [peerIdInput, setPeerIdInput] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [copied, setCopied] = useState(false);

  const filteredChats = chats.filter((chat) =>
    chat.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="flex flex-col h-full bg-white z-30 relative w-full">
      <div className="bg-white px-6 py-6 flex items-center justify-between border-b border-gray-50 shrink-0 sticky top-0 z-20">
        <div
          className="flex items-center gap-4 cursor-pointer"
          onClick={() => setModalType("invite")}
        >
          <img
            src={user.avatar}
            alt={user.name}
            className="w-12 h-12 rounded-2xl bg-teal-50 border shadow-sm object-cover"
          />
          <div>
            <p className="font-black text-lg text-gray-900 tracking-tighter leading-tight">
              {user.name}
            </p>
            <div className="flex items-center gap-1">
              <ShieldCheck size={12} className="text-teal-600" />
              <p className="text-[9px] text-teal-600 font-black uppercase tracking-widest">
                Active Node
              </p>
            </div>
          </div>
        </div>
        <div className="flex gap-1">
          <button
            onClick={() => setModalType("connect")}
            className="p-2 text-gray-400 hover:text-teal-600"
          >
            <Plus size={24} />
          </button>
          <button
            onClick={() => setModalType("group")}
            className="p-2 text-gray-400 hover:text-teal-600"
          >
            <Users size={22} />
          </button>
        </div>
      </div>

      <div className="px-6 py-4">
        <div className="relative flex items-center bg-gray-50 rounded-2xl px-4 py-3 border-2 border-transparent focus-within:border-teal-100 transition-all">
          <Search size={18} className="text-gray-400 mr-3" />
          <input
            type="text"
            placeholder="Search nodes..."
            className="bg-transparent border-none outline-none text-sm w-full font-bold"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-4 space-y-2 pb-6">
        {filteredChats.map((chat) => (
          <div
            key={chat.id}
            onClick={() => onChatSelect(chat.id)}
            className={`flex items-center gap-4 px-4 py-4 cursor-pointer rounded-2xl border transition-all ${
              activeChatId === chat.id
                ? "bg-gradient-to-br from-teal-600 to-emerald-500 border-teal-500 text-white shadow-lg"
                : "hover:bg-gray-50 border-transparent"
            }`}
          >
            <img
              src={chat.avatar}
              alt={chat.name}
              className="w-14 h-14 rounded-xl object-cover border-2 border-white/20 shadow-sm"
            />
            <div className="flex-1 min-w-0">
              <div className="flex justify-between items-start">
                <h3 className="font-black truncate tracking-tight">
                  {chat.name}
                </h3>
                {chat.lastMessage && (
                  <span className="text-[8px] uppercase font-black opacity-60">
                    {new Date(chat.lastMessage.timestamp).toLocaleTimeString(
                      [],
                      { hour: "2-digit", minute: "2-digit" }
                    )}
                  </span>
                )}
              </div>
              <p className={`text-xs truncate font-medium opacity-80`}>
                {chat.isTyping
                  ? "Typing..."
                  : chat.lastMessage?.content ||
                    chat.lastMessage?.text ||
                    "New connection"}
              </p>
            </div>
          </div>
        ))}
      </div>

      {modalType !== "none" && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-gray-900/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-sm p-8">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-black">
                {modalType === "connect" ? "Connect" : "Broadcast"}
              </h2>
              <button onClick={() => setModalType("none")}>
                <X size={24} />
              </button>
            </div>
            {modalType === "invite" ? (
              <div className="space-y-4">
                <code className="block text-[10px] break-all bg-gray-50 p-4 rounded-xl border font-mono">
                  {inviteLink}
                </code>
                <div className="flex items-center justify-between text-[10px] font-black uppercase tracking-widest text-gray-400">
                  <span>Share this link</span>
                  {copied && <span className="text-teal-600">Copied</span>}
                </div>
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(inviteLink).then(() => setCopied(true));
                    setTimeout(() => setCopied(false), 2000);
                  }}
                  className="w-full bg-teal-600 text-white py-4 rounded-2xl font-black shadow-lg hover:bg-teal-700"
                >
                  Copy Link
                </button>
              </div>
            ) : (
              <div className="space-y-6">
                <input
                  autoFocus
                  type="text"
                  placeholder="Node UID..."
                  className="w-full p-4 bg-gray-50 rounded-xl border outline-none focus:border-teal-500"
                  value={peerIdInput}
                  onChange={(e) => setPeerIdInput(e.target.value)}
                />
                <button
                  onClick={() => {
                    if (peerIdInput.trim()) onConnect(peerIdInput.trim());
                    setModalType("none");
                  }}
                  className="w-full bg-teal-600 text-white py-4 rounded-2xl font-black shadow-lg"
                >
                  Connect
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default Sidebar;
