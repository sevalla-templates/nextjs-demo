import React from "react";

export type Message = {
  id: string;
  text: string;
  sender: "me" | "peer";
  timestamp: number;
  status?: "sent" | "delivered"; // delivery state for 'me'
};

type Props = {
  messages: Message[];
};

export default function MessageList({ messages }: Props) {
  return (
    <div className="w-full space-y-2">
      {messages.length === 0 ? (
        <p className="text-center text-sm text-foreground/70">No messages yet. Start the conversation!</p>
      ) : (
        messages.map((m, i) => {
          const prev = messages[i - 1];
          const groupGap = !prev || prev.sender !== m.sender ? "mt-3" : "mt-1";
          const isMe = m.sender === "me";
          const bubbleClass =
            "px-3 py-2 rounded-2xl text-sm max-w-[75%] shadow-sm " +
            (isMe ? "bg-[#DCF8C6] text-[#0b141a]" : "bg-white text-[#0b141a] border border-black/5");
          const avatarLetter = isMe ? "M" : "P";
          return (
            <div
              key={m.id}
              className={`flex items-end ${isMe ? "justify-end" : "justify-start"} ${groupGap}`}
            >
              {!isMe && (
                <div className="mr-2 w-6 h-6 rounded-full bg-white border border-black/10 flex items-center justify-center text-[10px] text-[#0b141a]">{avatarLetter}</div>
              )}
              <div className={bubbleClass}>
                <p>{m.text}</p>
                <div className="mt-1 flex items-center gap-2 text-[10px] opacity-70">
                  <span>{new Date(m.timestamp).toLocaleTimeString()}</span>
                  {isMe && (
                    <span>{m.status === "delivered" ? "✓✓" : "✓"}</span>
                  )}
                </div>
              </div>
              {isMe && (
                <div className="ml-2 w-6 h-6 rounded-full bg-[#DCF8C6] border border-black/10 flex items-center justify-center text-[10px] text-[#0b141a]">{avatarLetter}</div>
              )}
            </div>
          );
        })
      )}
    </div>
  );
}
