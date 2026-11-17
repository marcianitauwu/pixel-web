// Validaciones del servidor. La validación del cliente es complementaria, nunca sustituta.
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const CLAVE_RE = /^(?=.*[A-Za-z])(?=.*\d).{8,72}$/;

function texto(valor) {
  return typeof valor === 'string' ? valor.trim() : '';
}

// Devuelve un entero positivo o null (evita inyecciones y valores raros en parámetros de ruta).
function aEntero(valor) {
  return /^\d+$/.test(String(valor)) ? Number(valor) : null;
}

function paginaDe(valor) {
  return Math.max(1, parseInt(valor, 10) || 1);
}



function validarClave(valor) {
  return typeof valor === 'string' && CLAVE_RE.test(valor)
    ? null
    : 'La clave debe tener entre 8 y 72 caracteres, con letras y números.';
}

function validarRegistro(body = {}) {
  const errores = {};
  const datos = {
    nombre: texto(body.nombre),
    email: texto(body.email).toLowerCase(),
    password: typeof body.password === 'string' ? body.password : '',
  };
  if (datos.nombre.length < 3 || datos.nombre.length > 60) {
    errores.nombre = 'El nombre debe tener entre 3 y 60 caracteres.';
  }
  if (!EMAIL_RE.test(datos.email) || datos.email.length > 120) {
    errores.email = 'Ingresa un correo válido.';
  }
  const errorClave = validarClave(datos.password);
  if (errorClave) errores.password = errorClave;
  return { errores, datos };
}

function validarLogin(body = {}) {
  const errores = {};
  const datos = {
    email: texto(body.email).toLowerCase(),
    password: typeof body.password === 'string' ? body.password : '',
  };
  if (!EMAIL_RE.test(datos.email)) errores.email = 'Ingresa un correo válido.';
  if (!datos.password) errores.password = 'Ingresa tu clave.';
  return { errores, datos };
}




module.exports = {
  texto,
  aEntero,
  paginaDe,
  validarClave,
  validarRegistro,
  validarLogin,
};
