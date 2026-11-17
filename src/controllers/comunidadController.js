const prisma = require('../config/prisma');

const SALA = 'general';

exports.pagina = (req, res) =>
  res.render('comunidad', { titulo: 'Comunidad', script: 'chat.js' });

// Historial del chat: últimos mensajes de la sala, en orden cronológico.
exports.historial = async (req, res) => {
  const limite = Math.min(100, Math.max(1, parseInt(req.query.limit, 10) || 50));
  const mensajes = await prisma.mensaje.findMany({
    where: { sala: SALA },
    orderBy: { creadoEn: 'desc' },
    take: limite,
    include: { usuario: { select: { nombre: true, rol: true } } },
  });

  res.json(
    mensajes.reverse().map(m => ({
      id: m.id,
      texto: m.texto,
      usuarioId: m.usuarioId,
      usuario: m.usuario.nombre,
      rol: m.usuario.rol,
      creadoEn: m.creadoEn,
    })),
  );
};
