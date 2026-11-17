// Exige sesión iniciada. Las rutas /api responden 401; las páginas redirigen al login.
function requireLogin(req, res, next) {
  if (req.session && req.session.usuario) return next();
  if (req.originalUrl.startsWith('/api/')) {
    return res.status(401).json({ error: 'Debes iniciar sesión.' });
  }
  return res.redirect('/login');
}

// Exige rol admin. Se valida en el servidor en cada ruta, no solo ocultando botones.
function requireAdmin(req, res, next) {
  const usuario = req.session && req.session.usuario;
  if (!usuario) return res.redirect('/login');
  if (usuario.rol !== 'admin') {
    return res.status(403).render('error', {
      titulo: 'Acceso denegado',
      mensaje: 'Solo el administrador puede ver esta sección.',
    });
  }
  return next();
}


module.exports = { requireLogin, requireAdmin };
