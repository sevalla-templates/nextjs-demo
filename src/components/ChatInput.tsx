"use client";
import React, { useRef, useState } from "react";

type Props = {
  onSend: (text: string) => void;
  onTyping?: (typing: boolean) => void;
};

export default function ChatInput({ onSend, onTyping }: Props) {
  const [text, setText] = useState("");
  const typingTimer = useRef<any>(null);

  const send = () => {
    const trimmed = text.trim();
    if (!trimmed) return;
    onSend(trimmed);
    setText("");
    if (onTyping) onTyping(false);
  };

  const notifyTyping = () => {
    if (!onTyping) return;
    onTyping(true);
    if (typingTimer.current) clearTimeout(typingTimer.current);
    typingTimer.current = setTimeout(() => onTyping(false), 1000);
  };

  return (
    <div className="flex w-full gap-2">
      <input
        className="flex-1 rounded-full border border-black/10 bg-white px-4 py-2 outline-none shadow-sm"
        value={text}
        onChange={(e) => {
          setText(e.target.value);
          notifyTyping();
        }}
        onKeyDown={(e) => {
          if (e.key === "Enter") send();
        }}
        onBlur={() => {
          if (onTyping) onTyping(false);
        }}
        placeholder="Type a message"
      />
      <button
        className="rounded-full bg-[#25D366] text-[#0b141a] px-4 py-2 text-sm hover:opacity-90 shadow-sm"
        onClick={send}
        type="button"
      >
        ➤
      </button>
    </div>
  );
}
