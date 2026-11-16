require('dotenv').config();
const http = require('http');
const app = require('./app');

const PORT = process.env.PORT || 3000;

const servidor = http.createServer(app);

servidor.listen(PORT, () => {
  console.log(`Pixel Web en http://localhost:${PORT}`);
});
