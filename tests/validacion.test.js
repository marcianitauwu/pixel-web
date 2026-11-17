const v = require('../src/services/validacion');

describe('validación de URLs de juegos', () => {
  test('acepta un juego publicado en GitHub Pages', () => {
    expect(v.validarUrlJuego('https://2026b-sof-jueg-gr1.github.io/salazar-dominguez/')).toBeNull();
  });

  test('rechaza URLs que no son de GitHub Pages', () => {
    expect(v.validarUrlJuego('https://ejemplo.com/juego')).toMatch(/GitHub Pages/);
  });

  test('rechaza conexiones sin cifrar', () => {
    expect(v.validarUrlJuego('http://usuario.github.io/juego')).toMatch(/https/);
  });
});

describe('validación de registro y login', () => {
  test('rechaza una clave sin números', () => {
    const { errores } = v.validarRegistro({ nombre: 'Ana', email: 'ana@mail.com', password: 'solotexto' });
    expect(errores.password).toBeDefined();
  });

  test('acepta datos válidos y normaliza el correo', () => {
    const { errores, datos } = v.validarRegistro({ nombre: 'Ana', email: ' ANA@mail.com ', password: 'clave1234' });
    expect(errores).toEqual({});
    expect(datos.email).toBe('ana@mail.com');
  });

  test('exige correo válido en el login', () => {
    const { errores } = v.validarLogin({ email: 'no-es-correo', password: 'x' });
    expect(errores.email).toBeDefined();
  });
});

describe('validación del CRUD de juegos', () => {
  test('rechaza categoría inexistente y título demasiado corto', () => {
    const { errores } = v.validarJuego({
      titulo: 'ab',
      descripcion: 'Una descripción suficiente',
      categoria: 'Inventada',
      url: 'https://usuario.github.io/juego/',
    });
    expect(errores.titulo).toBeDefined();
    expect(errores.categoria).toBeDefined();
    expect(errores.url).toBeUndefined();
  });
});

describe('validación de mensajes y reseñas', () => {
  test('elimina caracteres de control y rechaza mensajes vacíos', () => {
    expect(v.validarMensaje('hola\u0007 mundo').texto).toBe('hola mundo');
    expect(v.validarMensaje('   ').valido).toBe(false);
  });

  test('rechaza mensajes de más de 500 caracteres', () => {
    expect(v.validarMensaje('a'.repeat(501)).valido).toBe(false);
  });

  test('la calificación de una reseña debe estar entre 1 y 5', () => {
    expect(v.validarResena({ calificacion: '6', comentario: 'Muy bueno' }).errores.calificacion).toBeDefined();
    expect(v.validarResena({ calificacion: '4', comentario: 'Muy bueno' }).errores).toEqual({});
  });
});
