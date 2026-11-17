const prisma = require('../config/prisma');
const { CATEGORIAS, texto, aEntero, paginaDe, validarJuego } = require('../services/validacion');
const { registrarAccion } = require('../services/auditoria');
const { difundir } = require('../sockets/chat');

const POR_PAGINA = 10;
const LOGS_POR_PAGINA = 25;

function formulario(titulo, accion, valores, errores = {}) {
  return { titulo, accion, valores, errores, categorias: CATEGORIAS };
}

function noEncontrado(res) {
  return res.status(404).render('error', { titulo: 'No encontrado', mensaje: 'El juego solicitado no existe.' });
}

exports.listar = async (req, res) => {
  const q = texto(req.query.q).slice(0, 60);
  const pagina = paginaDe(req.query.pagina);
  const where = q ? { titulo: { contains: q } } : {};

  const [juegos, total] = await Promise.all([
    prisma.juego.findMany({ where, orderBy: { id: 'asc' }, skip: (pagina - 1) * POR_PAGINA, take: POR_PAGINA }),
    prisma.juego.count({ where }),
  ]);

  res.render('admin/juegos', {
    titulo: 'Administrar juegos',
    juegos,
    q,
    total,
    pagina,
    totalPaginas: Math.max(1, Math.ceil(total / POR_PAGINA)),
    mensaje: typeof req.query.ok === 'string' ? req.query.ok : null,
  });
};

exports.formNuevo = (req, res) =>
  res.render('admin/juego-form', formulario('Nuevo juego', '/admin/juegos', { portada: '/img/placeholder.svg' }));

exports.formEditar = async (req, res) => {
  const id = aEntero(req.params.id);
  const juego = id && (await prisma.juego.findUnique({ where: { id } }));
  if (!juego) return noEncontrado(res);
  res.render('admin/juego-form', formulario('Editar juego', `/admin/juegos/${id}`, juego));
};

exports.crear = async (req, res) => {
  const { errores, datos } = validarJuego(req.body);
  if (Object.keys(errores).length) {
    return res.status(400).render('admin/juego-form', formulario('Nuevo juego', '/admin/juegos', datos, errores));
  }

  const juego = await prisma.juego.create({ data: datos });
  await registrarAccion({ usuarioId: req.session.usuario.id, accion: 'crear', entidad: 'Juego', entidadId: juego.id, detalle: juego.titulo, ip: req.ip });

  // Notificación en tiempo real a los usuarios conectados al chat.
  difundir({ tipo: 'juego_nuevo', id: juego.id, titulo: juego.titulo });

  res.redirect(`/admin/juegos?ok=${encodeURIComponent('Juego creado')}`);
};

exports.actualizar = async (req, res) => {
  const id = aEntero(req.params.id);
  const existe = id && (await prisma.juego.findUnique({ where: { id } }));
  if (!existe) return noEncontrado(res);

  const { errores, datos } = validarJuego(req.body);
  const accion = `/admin/juegos/${id}`;
  if (Object.keys(errores).length) {
    return res.status(400).render('admin/juego-form', formulario('Editar juego', accion, datos, errores));
  }

  await prisma.juego.update({ where: { id }, data: datos });
  await registrarAccion({ usuarioId: req.session.usuario.id, accion: 'editar', entidad: 'Juego', entidadId: id, detalle: datos.titulo, ip: req.ip });
  res.redirect(`/admin/juegos?ok=${encodeURIComponent('Juego actualizado')}`);
};

exports.eliminar = async (req, res) => {
  const id = aEntero(req.params.id);
  const juego = id && (await prisma.juego.findUnique({ where: { id } }));
  if (!juego) return noEncontrado(res);

  await prisma.juego.delete({ where: { id } });
  await registrarAccion({ usuarioId: req.session.usuario.id, accion: 'eliminar', entidad: 'Juego', entidadId: id, detalle: juego.titulo, ip: req.ip });
  res.redirect(`/admin/juegos?ok=${encodeURIComponent('Juego eliminado')}`);
};

exports.auditoria = async (req, res) => {
  const pagina = paginaDe(req.query.pagina);
  const [logs, total] = await Promise.all([
    prisma.logAccion.findMany({
      orderBy: { creadoEn: 'desc' },
      include: { usuario: { select: { nombre: true } } },
      skip: (pagina - 1) * LOGS_POR_PAGINA,
      take: LOGS_POR_PAGINA,
    }),
    prisma.logAccion.count(),
  ]);

  res.render('admin/auditoria', {
    titulo: 'Auditoría',
    logs,
    pagina,
    totalPaginas: Math.max(1, Math.ceil(total / LOGS_POR_PAGINA)),
  });
};
