const rateLimit = require('express-rate-limit');

const respuestaLimite = minutos => (req, res) =>
  res.status(429).render('error', {
    titulo: 'Demasiados intentos',
    mensaje: `Espera ${minutos} minutos antes de volver a intentarlo.`,
  });

// Login: 10 intentos cada 15 minutos por IP (protección contra fuerza bruta).
const limiteLogin = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  handler: respuestaLimite(15),
});

// Recuperación: 5 solicitudes cada hora por IP.
const limiteRecuperacion = rateLimit({
  windowMs: 60 * 60 * 1000,
  limit: 5,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  handler: respuestaLimite(60),
});

module.exports = { limiteLogin, limiteRecuperacion };
