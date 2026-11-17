const nodemailer = require('nodemailer');

// Si hay SMTP configurado en .env, el correo se envía de verdad.
// Si no, se simula y el contenido se muestra en la consola del servidor.
function smtpConfigurado() {
  return Boolean(process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS);
}

let transporte = null;
function obtenerTransporte() {
  if (!transporte) {
    const puerto = Number(process.env.SMTP_PORT) || 587;
    transporte = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: puerto,
      secure: puerto === 465,
      auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
    });
  }
  return transporte;
}

async function enviarCorreo({ para, asunto, texto, html }) {
  if (!smtpConfigurado()) {
    console.log(`[correo simulado] Para: ${para}\n[correo simulado] Asunto: ${asunto}\n[correo simulado] ${texto}`);
    return { simulado: true };
  }
  await obtenerTransporte().sendMail({
    from: process.env.MAIL_FROM || process.env.SMTP_USER,
    to: para,
    subject: asunto,
    text: texto,
    html,
  });
  return { simulado: false };
}

module.exports = { enviarCorreo, smtpConfigurado };
