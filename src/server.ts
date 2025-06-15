// src/server.ts
import { createServer } from 'http';
import { parse } from 'url';
import next from 'next';
import { setupSocketServer } from './socket/server';

const dev = process.env.NODE_ENV !== 'production';
const app = next({ dev });
const handle = app.getRequestHandler();

// if (!process.env.SSL_KEY_PATH || !process.env.SSL_CERT_PATH) {
//   throw new Error("SSL_KEY_PATH and SSL_CERT_PATH must be defined in the environment variables.");
// }

// const options = {
//   key: await Bun.file(process.env.SSL_KEY_PATH).text(),
//   cert: await Bun.file(process.env.SSL_CERT_PATH).text()
// }

await app.prepare().then(() => {
  // const server = createServer(options, (req, res) => {
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
