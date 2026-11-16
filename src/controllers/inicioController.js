const prisma = require('../config/prisma');

// Página de inicio provisional: muestra los juegos guardados en la base de datos.
// Desde la versión 3 la reemplaza el catálogo.
exports.inicio = async (req, res) => {
  const juegos = await prisma.juego.findMany({ orderBy: { titulo: 'asc' } });
  res.render('inicio', { titulo: 'Inicio', juegos });
};
