const v = require('../src/services/validacion');


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


