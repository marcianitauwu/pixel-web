// Validaciones del servidor. La validación del cliente es complementaria, nunca sustituta.
const CATEGORIAS = ['Aventura', 'Arcade', 'Acción', 'Estrategia', 'Terror'];
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

function validarUrlJuego(valor) {
  let url;
  try {
    url = new URL(valor);
  } catch {
    return 'La URL no es válida.';
  }
  if (url.protocol !== 'https:') return 'La URL debe usar https.';
  if (!url.hostname.endsWith('.github.io')) {
    return 'Solo se aceptan juegos publicados en GitHub Pages (*.github.io).';
  }
  return null;
}

function validarPortada(valor) {
  if (valor.startsWith('/img/') && !valor.includes('..')) return null;
  try {
    return new URL(valor).protocol === 'https:' ? null : 'La portada debe usar https.';
  } catch {
    return 'La portada no es válida.';
  }
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

function validarJuego(body = {}) {
  const errores = {};
  const datos = {
    titulo: texto(body.titulo),
    descripcion: texto(body.descripcion),
    categoria: texto(body.categoria),
    url: texto(body.url),
    portada: texto(body.portada) || '/img/placeholder.svg',
  };
  if (datos.titulo.length < 3 || datos.titulo.length > 80) {
    errores.titulo = 'El título debe tener entre 3 y 80 caracteres.';
  }
  if (datos.descripcion.length < 10 || datos.descripcion.length > 500) {
    errores.descripcion = 'La descripción debe tener entre 10 y 500 caracteres.';
  }
  if (!CATEGORIAS.includes(datos.categoria)) errores.categoria = 'Selecciona una categoría válida.';
  const errorUrl = validarUrlJuego(datos.url);
  if (errorUrl) errores.url = errorUrl;
  const errorPortada = validarPortada(datos.portada);
  if (errorPortada) errores.portada = errorPortada;
  return { errores, datos };
}


function validarResena(body = {}) {
  const errores = {};
  const calificacion = aEntero(body.calificacion);
  const comentario = texto(body.comentario);
  if (calificacion === null || calificacion < 1 || calificacion > 5) {
    errores.calificacion = 'La calificación debe ser un número del 1 al 5.';
  }
  if (comentario.length < 3 || comentario.length > 500) {
    errores.comentario = 'El comentario debe tener entre 3 y 500 caracteres.';
  }
  return { errores, datos: { calificacion, comentario } };
}

module.exports = {
  CATEGORIAS,
  texto,
  aEntero,
  paginaDe,
  validarUrlJuego,
  validarPortada,
  validarClave,
  validarRegistro,
  validarLogin,
  validarJuego,
  validarResena,
};
