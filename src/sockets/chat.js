const { WebSocketServer } = require('ws');
const prisma = require('../config/prisma');
const { usuarioDesdeCookie } = require('../config/sesion');
const { validarMensaje } = require('../services/validacion');

const SALA = 'general';
const LATIDO_MS = 30000;
const VENTANA_MS = 10000;
const MAX_EN_VENTANA = 5;

// Sala general: conjunto de sockets conectados.
const salas = new Map([[SALA, new Set()]]);

function difundir(payload) {
  const msg = JSON.stringify(payload);
  salas.get(SALA).forEach(ws => {
    if (ws.readyState === 1) ws.send(msg);
  });
}

function enviar(ws, payload) {
  if (ws.readyState === 1) ws.send(JSON.stringify(payload));
}

function usuariosConectados() {
  const unicos = new Map();
  salas.get(SALA).forEach(ws => unicos.set(ws.usuario.id, { id: ws.usuario.id, nombre: ws.usuario.nombre, rol: ws.usuario.rol }));
  return [...unicos.values()];
}

function difundirUsuarios() {
  difundir({ tipo: 'usuarios', usuarios: usuariosConectados() });
}

// Limita a 5 mensajes cada 10 segundos por conexión.
function puedeEnviar(ws) {
  const ahora = Date.now();
  ws.marcas = (ws.marcas || []).filter(t => ahora - t < VENTANA_MS);
  if (ws.marcas.length >= MAX_EN_VENTANA) return false;
  ws.marcas.push(ahora);
  return true;
}

// Protección contra secuestro de WebSocket entre sitios: el origen debe ser este mismo host.
function origenValido(req) {
  const origen = req.headers.origin;
  if (!origen) return true;
  try {
    return new URL(origen).host === req.headers.host;
  } catch {
    return false;
  }
}

function iniciarChat(httpServer) {
  const wss = new WebSocketServer({ noServer: true, maxPayload: 2048 });

  // Handshake: autenticación con la sesión antes de aceptar la conexión.
  httpServer.on('upgrade', async (req, socket, head) => {
    socket.on('error', () => {});
    const rechazar = linea => {
      socket.write(`HTTP/1.1 ${linea}\r\n\r\n`);
      socket.destroy();
    };

    if (new URL(req.url, 'http://localhost').pathname !== '/ws') return rechazar('404 Not Found');
    if (!origenValido(req)) return rechazar('403 Forbidden');

    const usuario = await usuarioDesdeCookie(req);
    if (!usuario) return rechazar('401 Unauthorized');

    wss.handleUpgrade(req, socket, head, ws => {
      ws.usuario = usuario;
      wss.emit('connection', ws, req);
    });
  });

  wss.on('connection', ws => {
    ws.isAlive = true;
    ws.on('pong', () => {
      ws.isAlive = true;
    });

    salas.get(SALA).add(ws);
    enviar(ws, { tipo: 'bienvenida', usuario: ws.usuario.nombre, rol: ws.usuario.rol });
    difundirUsuarios();

    ws.on('message', async raw => {
      let datos;
      try {
        datos = JSON.parse(raw.toString());
      } catch {
        return enviar(ws, { tipo: 'error', mensaje: 'Formato no válido.' });
      }

      if (!puedeEnviar(ws)) {
        return enviar(ws, { tipo: 'error', mensaje: 'Estás enviando mensajes demasiado rápido.' });
      }

      const { valido, texto, error } = validarMensaje(datos && datos.texto);
      if (!valido) return enviar(ws, { tipo: 'error', mensaje: error });

      try {
        const guardado = await prisma.mensaje.create({
          data: { texto, sala: SALA, usuarioId: ws.usuario.id },
        });
        difundir({
          tipo: 'mensaje',
          id: guardado.id,
          texto: guardado.texto,
          usuarioId: ws.usuario.id,
          usuario: ws.usuario.nombre,
          rol: ws.usuario.rol,
          creadoEn: guardado.creadoEn,
        });
      } catch (err) {
        console.error(err);
        enviar(ws, { tipo: 'error', mensaje: 'No se pudo guardar el mensaje.' });
      }
    });

    ws.on('close', () => {
      salas.get(SALA).delete(ws);
      difundirUsuarios();
    });
    ws.on('error', () => ws.terminate());
  });

  // Latidos: cierra conexiones que dejan de responder.
  const latidos = setInterval(() => {
    wss.clients.forEach(ws => {
      if (!ws.isAlive) return ws.terminate();
      ws.isAlive = false;
      ws.ping();
    });
  }, LATIDO_MS);
  wss.on('close', () => clearInterval(latidos));

  return wss;
}

module.exports = { iniciarChat, difundir };
