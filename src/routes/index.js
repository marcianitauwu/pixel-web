const express = require('express');
const prisma = require('../config/prisma');
const { requireLogin } = require('../middlewares/auth');
const auth = require('../controllers/authController');
const inicio = require('../controllers/inicioController');

const router = express.Router();

// Portadas para el mosaico de las pantallas de acceso. Si la base falla, la página se muestra sin mosaico.
async function portadasAcceso(req, res, next) {
  try {
    const juegosAcceso = await prisma.juego.findMany({ select: { portada: true }, orderBy: { id: 'asc' }, take: 5 });
    res.locals.portadas = juegosAcceso.map(j => j.portada);
  } catch {
    res.locals.portadas = [];
  }
  next();
}

// Acceso y cuenta
router.get('/login', portadasAcceso, auth.mostrarLogin);
router.post('/login', portadasAcceso, auth.iniciar);
router.get('/registro', portadasAcceso, auth.mostrarRegistro);
router.post('/registro', portadasAcceso, auth.registrar);
router.post('/logout', auth.cerrar);
router.get('/recuperar', portadasAcceso, auth.mostrarRecuperar);
router.post('/recuperar', portadasAcceso, auth.solicitarRecuperar);
router.get('/restablecer/:token', portadasAcceso, auth.mostrarRestablecer);
router.post('/restablecer/:token', portadasAcceso, auth.restablecer);

// Inicio provisional, ahora con sesión iniciada.
router.get('/', requireLogin, inicio.inicio);

module.exports = router;
