// src/socket/server.ts
import { Server as SocketIOServer } from 'socket.io';
import { type Server as HttpServer } from 'http';
import { db } from '~/server/db';
import { messages } from '~/server/db/schema';

export function setupSocketServer(httpServer: HttpServer) {
  const io = new SocketIOServer(httpServer, {
    cors: {
      origin: process.env.NODE_ENV === 'production' ? false : '*',
      methods: ['GET', 'POST'],
    },
  });

  io.on('connection', (socket) => {
    console.log('A user connected:', socket.id);

    // Handle new messages
    socket.on('send_message', async (data: { content: string; sender: string }) => {
      try {
        // Save message to database
        const [newMessage] = await db.insert(messages).values({
          content: data.content,
          sender: data.sender,
        }).returning();

        // Broadcast the message to all connected clients
        io.emit('receive_message', newMessage);
      } catch (error) {
        console.error('Error saving message:', error);
      }
    });

    // Handle disconnect
    socket.on('disconnect', () => {
      console.log('A user disconnected:', socket.id);
    });
  });

  return io;
}