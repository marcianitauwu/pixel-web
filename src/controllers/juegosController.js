const prisma = require('../config/prisma');
const { CATEGORIAS, texto, aEntero, paginaDe, validarResena } = require('../services/validacion');
const { registrarAccion } = require('../services/auditoria');

const POR_PAGINA = 6;

// Catálogo: búsqueda por título o categoría, filtro, orden y paginación.
exports.catalogo = async (req, res) => {
  const q = texto(req.query.q).slice(0, 60);
  const categoria = CATEGORIAS.includes(req.query.categoria) ? req.query.categoria : '';
  const orden = req.query.orden === 'populares' ? 'populares' : 'titulo';
  const pagina = paginaDe(req.query.pagina);

  const where = {};
  if (q) where.OR = [{ titulo: { contains: q } }, { categoria: { contains: q } }];
  if (categoria) where.categoria = categoria;

  const [juegos, total] = await Promise.all([
    prisma.juego.findMany({
      where,
      orderBy: orden === 'populares' ? { partidas: { _count: 'desc' } } : { titulo: 'asc' },
      skip: (pagina - 1) * POR_PAGINA,
      take: POR_PAGINA,
    }),
    prisma.juego.count({ where }),
  ]);

  res.render('catalogo', {
    titulo: 'Catálogo',
    juegos,
    q,
    categoria,
    orden,
    pagina,
    total,
    totalPaginas: Math.max(1, Math.ceil(total / POR_PAGINA)),
    queryBase: new URLSearchParams({ q, categoria, orden }).toString(),
    categorias: CATEGORIAS,
  });
};

// Carga la ficha de un juego con sus reseñas y el promedio de calificación.
async function cargarDetalle(id, usuarioId) {
  const juego = await prisma.juego.findUnique({ where: { id } });
  if (!juego) return null;

  const [resenas, agregado, miResena] = await Promise.all([
    prisma.resena.findMany({
      where: { juegoId: id },
      include: { usuario: { select: { nombre: true } } },
      orderBy: { creadoEn: 'desc' },
      take: 20,
    }),
    prisma.resena.aggregate({
      where: { juegoId: id },
      _avg: { calificacion: true },
      _count: { _all: true },
    }),
    prisma.resena.findUnique({ where: { usuarioId_juegoId: { usuarioId, juegoId: id } } }),
  ]);

  return {
    juego,
    resenas,
    promedio: agregado._avg.calificacion,
    total: agregado._count._all,
    miResena,
  };
}

exports.detalle = async (req, res) => {
  const id = aEntero(req.params.id);
  const datos = id && (await cargarDetalle(id, req.session.usuario.id));
  if (!datos) {
    return res.status(404).render('error', { titulo: 'No encontrado', mensaje: 'El juego no existe.' });
  }
  await prisma.partida.create({ data: { juegoId: datos.juego.id, usuarioId: req.session.usuario.id } });
  res.render('juego', { ...datos, titulo: datos.juego.titulo, error: null });
};

exports.resenar = async (req, res) => {
  const id = aEntero(req.params.id);
  const usuarioId = req.session.usuario.id;
  const actual = id && (await cargarDetalle(id, usuarioId));
  if (!actual) {
    return res.status(404).render('error', { titulo: 'No encontrado', mensaje: 'El juego no existe.' });
  }

  const { errores, datos } = validarResena(req.body);
  if (Object.keys(errores).length) {
    return res.status(400).render('juego', { ...actual, titulo: actual.juego.titulo, error: Object.values(errores)[0] });
  }

  const yaReseno = () =>
    res.status(409).render('juego', { ...actual, titulo: actual.juego.titulo, error: 'Ya reseñaste este juego.' });
  if (actual.miResena) return yaReseno();

  try {
    await prisma.resena.create({ data: { usuarioId, juegoId: id, ...datos } });
  } catch (err) {
    if (err.code === 'P2002') return yaReseno();
    throw err;
  }

  await registrarAccion({ usuarioId, accion: 'resenar', entidad: 'Resena', entidadId: id, detalle: `calificación ${datos.calificacion}`, ip: req.ip });
  res.redirect(`/juegos/${id}`);
};

// API JSON del catálogo (base para el segundo bimestre).
exports.apiListar = async (req, res) => {
  const juegos = await prisma.juego.findMany({
    select: { id: true, titulo: true, categoria: true, url: true, portada: true },
    orderBy: { titulo: 'asc' },
    take: 100,
  });
  res.json(juegos);
};

// Registra una partida cuando el usuario elige un juego para jugar.
exports.registrarPartida = async (req, res) => {
  const id = aEntero(req.params.id);
  const existe = id && (await prisma.juego.findUnique({ where: { id }, select: { id: true } }));
  if (!existe) return res.status(404).json({ error: 'Juego no encontrado.' });

  await prisma.partida.create({ data: { juegoId: id, usuarioId: req.session.usuario.id } });
  res.status(201).json({ ok: true });
};
