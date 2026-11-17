const crypto = require('crypto');

// Token CSRF por sesión. Todo POST debe enviar el token en el campo _csrf o en la cabecera x-csrf-token.
function protegerCsrf(req, res, next) {
  if (!req.session.csrf) req.session.csrf = crypto.randomBytes(24).toString('hex');
  res.locals.csrfToken = req.session.csrf;

  if (['GET', 'HEAD', 'OPTIONS'].includes(req.method)) return next();

  const enviado = (req.body && req.body._csrf) || req.get('x-csrf-token');
  if (!enviado || enviado !== req.session.csrf) {
    return res.status(403).render('error', {
      titulo: 'Solicitud rechazada',
      mensaje: 'El formulario expiró. Recarga la página e intenta de nuevo.',
    });
  }
  return next();
}

module.exports = { protegerCsrf };
