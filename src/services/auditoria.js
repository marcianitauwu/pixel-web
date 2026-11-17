const prisma = require('../config/prisma');

// Registra una acción. Nunca recibe contraseñas ni tokens en el campo detalle.
async function registrarAccion({ usuarioId = null, accion, entidad, entidadId = null, detalle = null, ip = null }) {
  return prisma.logAccion.create({
    data: { usuarioId, accion, entidad, entidadId, detalle, ip },
  });
}

module.exports = { registrarAccion };
