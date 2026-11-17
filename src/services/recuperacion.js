const crypto = require('crypto');
const prisma = require('../config/prisma');
const { enviarCorreo } = require('./correo');

const CADUCIDAD_MS = 60 * 60 * 1000; // 1 hora

const hashToken = token => crypto.createHash('sha256').update(token).digest('hex');

// Crea un token de un solo uso. Invalida los tokens anteriores del mismo usuario.
async function crearTokenRecuperacion(usuarioId) {
  const token = crypto.randomBytes(32).toString('hex');
  await prisma.tokenRecuperacion.deleteMany({ where: { usuarioId, usado: false } });
  await prisma.tokenRecuperacion.create({
    data: { hash: hashToken(token), usuarioId, expira: new Date(Date.now() + CADUCIDAD_MS) },
  });
  return token;
}

// Consume el token de forma atómica. Devuelve el id del usuario o null si no es válido.
async function consumirToken(token) {
  const registro = await prisma.tokenRecuperacion.findUnique({ where: { hash: hashToken(token) } });
  if (!registro || registro.expira < new Date()) return null;

  const marcado = await prisma.tokenRecuperacion.updateMany({
    where: { id: registro.id, usado: false },
    data: { usado: true },
  });
  return marcado.count === 1 ? registro.usuarioId : null;
}

const escapar = t => t.replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);

// Envía el enlace de recuperación. Sin SMTP configurado, el enlace aparece en la consola.
function enviarCorreoRecuperacion(email, enlace) {
  return enviarCorreo({
    para: email,
    asunto: 'Crea una clave nueva en Pixel Web',
    texto: `Recibimos una solicitud para cambiar tu clave de Pixel Web.\n\nEnlace: ${enlace}\n\nEl enlace vale por 1 hora y solo funciona una vez. Si no pediste el cambio, ignora este correo.`,
    html: `<p>Recibimos una solicitud para cambiar tu clave de Pixel Web.</p>
<p><a href="${escapar(enlace)}">Crear una clave nueva</a></p>
<p>El enlace vale por 1 hora y solo funciona una vez. Si no pediste el cambio, ignora este correo.</p>`,
  });
}

module.exports = { crearTokenRecuperacion, consumirToken, enviarCorreoRecuperacion };
