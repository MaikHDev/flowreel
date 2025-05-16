'use client';

import { useState } from 'react';
import { useSocket } from '~/socket/client';

export default function ChatComponent() {
  const { isConnected, messages, sendMessage } = useSocket();
  const [messageInput, setMessageInput] = useState('');
  const [username, setUsername] = useState('User');

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (messageInput.trim()) {
      sendMessage(messageInput, username);
      setMessageInput('');
    }
  };

  return (
    <div className="flex flex-col h-screen max-w-md mx-auto p-4">
      <div className="mb-4">
        <h1 className="text-2xl font-bold">Real-time Chat</h1>
        <p className="text-sm">
          {isConnected ? '✅ Connected' : '❌ Disconnected'}
        </p>
      </div>

      <div className="flex mb-4">
        <input
          type="text"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          placeholder="Your name"
          className="px-2 py-1 border rounded mr-2"
        />
      </div>

      <div className="flex-1 overflow-y-auto mb-4 border rounded p-2">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`mb-2 p-2 rounded ${
              msg.sender === username
                ? 'bg-blue-500 ml-auto'
                : 'bg-gray-500'
            }`}
            style={{ maxWidth: '80%' }}
          >
            <div className="font-bold text-sm">{msg.sender}</div>
            <div>{msg.content}</div>
          </div>
        ))}
      </div>

      <form onSubmit={handleSendMessage} className="flex">
        <input
          type="text"
          value={messageInput}
          onChange={(e) => setMessageInput(e.target.value)}
          placeholder="Type a message"
          className="flex-1 px-2 py-1 border rounded-l"
        />
        <button
          type="submit"
          className="bg-blue-600 text-white px-4 py-1 rounded-r"
        >
          Send
        </button>
      </form>
    </div>
  );
}