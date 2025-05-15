// src/server.ts
import { createServer } from 'http';
import { parse } from 'url';
import next from 'next';
import { setupSocketServer } from './socket/server';

const dev = process.env.NODE_ENV !== 'production';
const app = next({ dev });
const handle = app.getRequestHandler();

await app.prepare().then(() => {
  const server = createServer((req, res) => {
    const parsedUrl = parse(req.url!, true); // Add non-null assertion for `req.url`
    handle(req, res, parsedUrl).catch((err) => {
      console.error('Error handling request:', err);
      res.statusCode = 500;
      res.end('Internal server error');
    });
  });

  // Setup Socket.IO server
  setupSocketServer(server);

  const PORT = process.env.PORT ?? 3000;

  server.listen(PORT, (err?: Error) => {
    if (err) {
      console.error('Error starting server:', err);
      process.exit(1);
    }
    console.log(`> Ready on http://localhost:${PORT}`);
  });
});
