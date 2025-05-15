// src/socket/client.ts
'use client';

import { useEffect, useState } from 'react';
import { io, type Socket } from 'socket.io-client';

interface Message {
  id: number;
  content: string;
  sender: string;
  createdAt: string;
}

let socket: Socket | null = null;

export const useSocket = () => {
  const [isConnected, setIsConnected] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);

  useEffect(() => {
    // Initialize socket connection
    if (!socket) {
      const socketUrl = process.env.NEXT_PUBLIC_SOCKET_URL ?? 'http://localhost:3000';
      socket = io(socketUrl);
    }

    // Set up event listeners
    socket.on('connect', () => {
      console.log('Connected to Socket.io server');
      setIsConnected(true);
    });

    socket.on('disconnect', () => {
      console.log('Disconnected from Socket.io server');
      setIsConnected(false);
    });

    socket.on('receive_message', (message: Message) => {
      setMessages((prevMessages) => [...prevMessages, message]);
    });

    // Clean up event listeners
    return () => {
      socket?.off('connect');
      socket?.off('disconnect');
      socket?.off('receive_message');
    };
  }, []);

  // Function to send a message
  const sendMessage = (content: string, sender: string) => {
    if (socket && isConnected) {
      socket.emit('send_message', { content, sender });
    }
  };

  return {
    isConnected,
    messages,
    sendMessage,
  };
};