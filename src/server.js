require('dotenv').config();
const http = require('http');
const app = require('./app');
const { iniciarChat } = require('./sockets/chat');

const PORT = process.env.PORT || 3000;

// Express y el WebSocket comparten el mismo servidor HTTP y el mismo proyecto.
const servidor = http.createServer(app);
iniciarChat(servidor);

servidor.listen(PORT, () => {
  console.log(`Pixel Web en http://localhost:${PORT}`);
});
