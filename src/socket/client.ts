"use client";

import { useEffect, useState } from "react";
import { io, type Socket } from "socket.io-client";

export default interface SocketMessage {
  id: number;
  content: string;
  sender: string;
  createdAt: Date;
}

let socket: Socket | null = null;

export const useSocket = () => {
  const [isConnected, setIsConnected] = useState(false);
  const [messages, setMessages] = useState<SocketMessage[]>([]);

  useEffect(() => {
    // Initialize socket connection
    if (!socket) {
      const socketUrl =
        process.env.NEXT_PUBLIC_SOCKET_URL ?? "https://localhost:3000";
      socket = io(socketUrl);
    }

    // Set up event listeners
    socket.on("connect", () => {
      console.log("Connected to Socket.io server");
      setIsConnected(true);
    });

    socket.on("disconnect", () => {
      console.log("Disconnected from Socket.io server");
      setIsConnected(false);
    });

    socket.on("receive_message", (message: SocketMessage) => {
      setMessages((prev) => [...prev, message]);
    });

    socket.on("removed_message", (message: SocketMessage) => {
      setMessages((prev) => prev.filter(msg => msg.id !== message.id));
    });

    socket.on("failed_remove_message", (message: SocketMessage) => {
      setMessages((prev) => [...prev, message]);
    });

    socket.on("first_conn_receive_messages", (messages: SocketMessage[]) => {
      setMessages(messages);
    });

    // Clean up event listeners
    return () => {
      socket?.off("connect");
      socket?.off("disconnect");
      socket?.off("receive_message");
      socket?.off("failed_remove_message");
      socket?.off("first_conn_receive_messages");

    };
  }, []);

  // Function to send a message
  const sendMessage = (userId: string, content: string) => {
    if (socket && isConnected) {
      socket.emit("send_message", { userId, content });
    }
  };

  const deleteMessage = (id: number, userId: string, msg: SocketMessage) => {
    if (socket && isConnected) {
      setMessages((prev) => prev.filter(msg => msg.id !== id));
      socket.emit("delete_message", { id, userId,  msg});
    }
  }

  return {
    isConnected,
    messages,
    sendMessage,
    deleteMessage
  };
};
