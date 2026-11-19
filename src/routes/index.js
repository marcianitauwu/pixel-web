const express = require('express');
const prisma = require('../config/prisma');
const { requireLogin, requireAdmin, requireJugador } = require('../middlewares/auth');
const { limiteLogin, limiteRecuperacion } = require('../middlewares/limites');
const auth = require('../controllers/authController');
const juegos = require('../controllers/juegosController');
const admin = require('../controllers/adminController');
const comunidad = require('../controllers/comunidadController');

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
router.post('/login', limiteLogin, portadasAcceso, auth.iniciar);
router.get('/registro', portadasAcceso, auth.mostrarRegistro);
router.post('/registro', portadasAcceso, auth.registrar);
router.post('/logout', auth.cerrar);
router.get('/recuperar', portadasAcceso, auth.mostrarRecuperar);
router.post('/recuperar', limiteRecuperacion, portadasAcceso, auth.solicitarRecuperar);
router.get('/restablecer/:token', portadasAcceso, auth.mostrarRestablecer);
router.post('/restablecer/:token', portadasAcceso, auth.restablecer);

// Pantallas con sesión iniciada
router.get(['/', '/catalogo'], requireJugador, juegos.catalogo);
router.get('/juegos/:id', requireJugador, juegos.detalle);
router.post('/juegos/:id/resenas', requireJugador, juegos.resenar);
router.get('/comunidad', requireLogin, comunidad.pagina);

// API JSON
router.get('/api/juegos', requireLogin, juegos.apiListar);
router.post('/api/juegos/:id/partida', requireJugador, juegos.registrarPartida);
router.get('/api/mensajes', requireLogin, comunidad.historial);

// Panel de administración (solo rol admin)
router.get('/admin/juegos', requireAdmin, admin.listar);
router.get('/admin/juegos/nuevo', requireAdmin, admin.formNuevo);
router.post('/admin/juegos', requireAdmin, admin.crear);
router.get('/admin/juegos/:id/editar', requireAdmin, admin.formEditar);
router.post('/admin/juegos/:id', requireAdmin, admin.actualizar);
router.post('/admin/juegos/:id/eliminar', requireAdmin, admin.eliminar);
router.get('/admin/auditoria', requireAdmin, admin.auditoria);

module.exports = router;
