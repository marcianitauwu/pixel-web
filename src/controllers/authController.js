const bcrypt = require('bcryptjs');
const prisma = require('../config/prisma');
const { validarRegistro, validarLogin, validarClave, texto } = require('../services/validacion');
const { registrarAccion } = require('../services/auditoria');
const { crearTokenRecuperacion, consumirToken, enviarCorreoRecuperacion } = require('../services/recuperacion');

const BASE_URL = process.env.APP_URL || 'http://localhost:3000';

// Regenera la sesión al iniciar sesión para evitar fijación de sesión.
function iniciarSesion(req, usuario) {
  return new Promise((resolve, reject) => {
    req.session.regenerate(err => {
      if (err) return reject(err);
      req.session.usuario = { id: usuario.id, nombre: usuario.nombre, rol: usuario.rol };
      req.session.save(err2 => (err2 ? reject(err2) : resolve()));
    });
  });
}

exports.mostrarLogin = (req, res) =>
  res.render('login', {
    titulo: 'Iniciar sesión',
    error: null,
    info: req.query.info === 'clave' ? 'Clave actualizada. Ya puedes iniciar sesión.' : null,
    datos: {},
  });

exports.iniciar = async (req, res) => {
  const { errores, datos } = validarLogin(req.body);
  if (Object.keys(errores).length) {
    return res.status(400).render('login', {
      titulo: 'Iniciar sesión', error: 'Revisa los datos ingresados.', info: null, datos: { email: datos.email },
    });
  }

  const usuario = await prisma.usuario.findUnique({ where: { email: datos.email } });
  const valido = usuario ? await bcrypt.compare(datos.password, usuario.passwordHash) : false;
  if (!valido) {
    return res.status(401).render('login', {
      titulo: 'Iniciar sesión', error: 'Correo o contraseña incorrectos.', info: null, datos: { email: datos.email },
    });
  }

  await iniciarSesion(req, usuario);
  await registrarAccion({ usuarioId: usuario.id, accion: 'login', entidad: 'Usuario', entidadId: usuario.id, ip: req.ip });
  res.redirect('/');
};

exports.mostrarRegistro = (req, res) =>
  res.render('registro', { titulo: 'Crear cuenta', errores: {}, datos: {} });

exports.registrar = async (req, res) => {
  const { errores, datos } = validarRegistro(req.body);
  const base = { titulo: 'Crear cuenta', datos: { nombre: datos.nombre, email: datos.email } };

  if (Object.keys(errores).length) return res.status(400).render('registro', { ...base, errores });

  const existe = await prisma.usuario.findUnique({ where: { email: datos.email } });
  if (existe) {
    return res.status(409).render('registro', { ...base, errores: { email: 'Ya existe una cuenta con ese correo.' } });
  }

  const passwordHash = await bcrypt.hash(datos.password, 12);
  const usuario = await prisma.usuario.create({
    data: { nombre: datos.nombre, email: datos.email, passwordHash },
  });

  await iniciarSesion(req, usuario);
  await registrarAccion({ usuarioId: usuario.id, accion: 'registro', entidad: 'Usuario', entidadId: usuario.id, ip: req.ip });
  res.redirect('/');
};

exports.cerrar = (req, res, next) =>
  req.session.destroy(err => {
    if (err) return next(err);
    res.redirect('/login');
  });

exports.mostrarRecuperar = (req, res) =>
  res.render('recuperar', { titulo: 'Recuperar clave', enviado: false });

// Responde igual exista o no el correo, para no revelar qué cuentas existen.
exports.solicitarRecuperar = async (req, res) => {
  const email = texto(req.body.email).toLowerCase();
  const usuario = email ? await prisma.usuario.findUnique({ where: { email } }) : null;
  if (usuario) {
    const token = await crearTokenRecuperacion(usuario.id);
    try {
      await enviarCorreoRecuperacion(usuario.email, `${BASE_URL}/restablecer/${token}`);
    } catch (err) {
      // No se revela el fallo al usuario para no exponer qué correos existen.
      console.error('No se pudo enviar el correo de recuperación:', err.message);
    }
  }
  res.render('recuperar', { titulo: 'Recuperar clave', enviado: true });
};

exports.mostrarRestablecer = (req, res) =>
  res.render('restablecer', { titulo: 'Nueva clave', token: req.params.token, error: null });

exports.restablecer = async (req, res) => {
  const { token } = req.params;
  const errorClave = validarClave(req.body.password);
  if (errorClave) {
    return res.status(400).render('restablecer', { titulo: 'Nueva clave', token, error: errorClave });
  }

  const usuarioId = await consumirToken(token);
  if (!usuarioId) {
    return res.status(400).render('restablecer', {
      titulo: 'Nueva clave', token, error: 'El enlace no es válido o ya caducó.',
    });
  }

  const passwordHash = await bcrypt.hash(req.body.password, 12);
  await prisma.usuario.update({ where: { id: usuarioId }, data: { passwordHash } });
  await registrarAccion({ usuarioId, accion: 'recuperar_clave', entidad: 'Usuario', entidadId: usuarioId, ip: req.ip });
  res.redirect('/login?info=clave');
};
