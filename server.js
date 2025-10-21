// server.js — CommonJS, starts Next in production and listens on process.env.PORT
const http = require('http');
const next = require('next');

const dev = false;
const app = next({ dev });
const handle = app.getRequestHandler();

const port = process.env.PORT || 3000;

app.prepare()
  .then(() => {
    const server = http.createServer((req, res) => {
      // Keep URL as-is so basePath (set in next.config.mjs) is honored by Next.
      handle(req, res);
    });

    server.listen(port, err => {
      if (err) {
        console.error('Server failed to start:', err);
        process.exit(1);
      }
      console.log(`> Next.js server running on port ${port} (NODE_ENV=${process.env.NODE_ENV})`);
    });
  })
  .catch(err => {
    console.error('Error preparing Next app:', err);
    process.exit(1);
  });
