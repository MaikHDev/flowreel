"use client";

import { useEffect, useState } from "react";
import type SocketMessage from "~/socket/client";
import { useSocket } from "~/socket/client";
import type { Session } from "next-auth";

interface ChatComponentProps {
  session: Session;
}

export default function ChatComponent({ session }: ChatComponentProps) {
  const { isConnected, messages, sendMessage, deleteMessage } = useSocket();
  const [messageInput, setMessageInput] = useState("");
  const [username, setUsername] = useState("");
  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (messageInput.trim()) {
      sendMessage(session.user.id, messageInput);
      setMessageInput("");
    }
  };

  const handleDeleteMessage = (id: number, userId: string, msg: SocketMessage) => {
    deleteMessage(id, userId, msg);
  };

  useEffect(() => {
    if (session?.user?.name) {
      setUsername(session.user.name);
    }
  }, []);

  const returnMessageTime = (date: Date) => {
    const month = date.getMonth();
    const day = date.getDate().toString().padStart(2, "0");
    const hours = date.getHours().toString().padStart(2, "0");
    const minutes = date.getMinutes().toString().padStart(2, "0");

    return `${month}/${day} ${hours}:${minutes}`;
  }

  return (
    <div className="mx-auto flex h-screen max-w-md flex-col p-4">
      <div className="mb-4">
        <h1 className="text-2xl font-bold">Real-time Chat</h1>
        <p className="text-sm">
          {isConnected ? "✅ Connected" : "❌ Disconnected"}
        </p>
      </div>

      <div className="mb-4 flex">{username}</div>

      <div className="mb-4 flex-1 overflow-y-auto rounded border p-2">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`mb-2 rounded p-2 ${
              msg.sender === username ? "ml-auto bg-blue-500" : "bg-gray-500"
            }`}
            style={{ maxWidth: "80%" }}
          >
            <div className="relative">
              {msg.sender === username && (
                <button
                  onClick={() => handleDeleteMessage(msg.id, session.user.id, msg)}
                  className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-xs text-white hover:bg-red-600"
                  title="Delete message"
                >
                  ×
                </button>
              )}
              <div className="">
              <div className="text-sm font-bol">{msg.sender}</div>
              <div className="flex flex-wrap w-[75%] overflow-x-auto break-all ">{msg.content}</div>
              </div>
              <div className="absolute text-sm bottom-0 right-0">{returnMessageTime(new Date(msg.createdAt))}</div>
            </div>
          </div>
        ))}
      </div>

      <form onSubmit={handleSendMessage} className="flex">
        <input
          type="text"
          value={messageInput}
          onChange={(e) => setMessageInput(e.target.value)}
          placeholder="Type a message"
          className="flex-1 rounded-l border px-2 py-1"
        />
        <button
          type="submit"
          className="rounded-r bg-blue-600 px-4 py-1 text-white"
        >
          Send
        </button>
      </form>
    </div>
  );
}
