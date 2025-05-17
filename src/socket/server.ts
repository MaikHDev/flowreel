// src/socket/server.ts
import { Server as SocketIOServer } from "socket.io";
import { type Server as HttpServer } from "http";
import { db } from "~/server/db";
import { messages, users } from "~/server/db/schema";
import { and, eq } from "drizzle-orm";
import type SocketMessage from "~/socket/client";

export function setupSocketServer(httpServer: HttpServer) {
  const io = new SocketIOServer(httpServer, {
    cors: {
      origin: process.env.NODE_ENV === "production" ? false : "*",
      methods: ["GET", "POST"],
    },
  });

  io.on("connection", async (socket) => {
    console.log("A user connected:", socket.id);

    try {
      // Fetch messages from the database
      const msgs = await db
        .select({
          id: messages.id,
          content: messages.content,
          createdAt: messages.createdAt,
          sender: users.name,
        })
        .from(messages)
        .leftJoin(users, eq(messages.userId, users.id));

      socket.emit("first_conn_receive_messages", msgs);
    } catch (error) {
      console.error("Error fetching messages:", error);
    }

    // Handle new messages
    socket.on(
      "send_message",
      async (data: { userId: string; content: string }) => {
        try {
          // Save message to database
          const [newMessage] = await db
            .insert(messages)
            .values({
              userId: data.userId,
              content: data.content,
            })
            .returning();

          const username = await db
            .select({ name: users.name })
            .from(users)
            .where(eq(users.id, data.userId))
            .then((results) => results[0]);

          if (!username) {
            console.error("User not found:", data.userId);
            return;
          }

          io.emit("receive_message", {
            ...newMessage,
            sender: username.name,
          });
        } catch (error) {
          console.error("Error saving message:", error);
        }
      },
    );

    socket.on(
      "delete_message",
      async (data: { id: number; userId: string }) => {
        try {
          const [deletedMessage] = await db
            .delete(messages)
            .where(and(eq(messages.id, data.id), eq(messages.userId, data.userId)))
            .returning();

          io.emit("removed_message", deletedMessage);
        } catch (error) {
          console.error("Error deleting message:", error);
        }
      },
    );

    // Handle disconnect
    socket.on("disconnect", () => {
      console.log("A user disconnected:", socket.id);
    });
  });

  return io;
}
