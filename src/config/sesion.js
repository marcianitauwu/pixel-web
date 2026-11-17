const session = require('express-session');
const cookie = require('cookie');
const { unsign } = require('cookie-signature');

const SECRET = process.env.SESSION_SECRET || 'solo-desarrollo-cambiar';

// MemoryStore sirve para desarrollo. En producción usar un almacén persistente.
const store = new session.MemoryStore();

const middleware = session({
  name: 'sid',
  secret: SECRET,
  resave: false,
  saveUninitialized: false,
  store,
  cookie: {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    maxAge: 1000 * 60 * 60 * 2,
  },
});

// Obtiene el usuario de la sesión a partir de la cookie de una petición HTTP.
// Se usa en el handshake del WebSocket para autenticar la conexión.
function usuarioDesdeCookie(req) {
  return new Promise(resolve => {
    const valor = cookie.parse(req.headers.cookie || '').sid;
    if (!valor || !valor.startsWith('s:')) return resolve(null);

    const sid = unsign(valor.slice(2), SECRET);
    if (sid === false) return resolve(null);

    store.get(sid, (err, sesion) => {
      resolve(!err && sesion && sesion.usuario ? sesion.usuario : null);
    });
  });
}

module.exports = { middleware, store, usuarioDesdeCookie };
