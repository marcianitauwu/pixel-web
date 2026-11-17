// Flujo completo de "olvidé mi clave" contra la aplicación real.
// La base de datos se reemplaza por una versión en memoria para no depender de Prisma.
const bcrypt = require('bcryptjs');
const request = require('supertest');

const mockDb = { usuarios: [], tokens: [], logs: [] };
let mockSiguienteToken = 1;

jest.mock('../src/config/prisma', () => ({
  usuario: {
    findUnique: async ({ where }) =>
      mockDb.usuarios.find(u => (where.id ? u.id === where.id : u.email === where.email)) || null,
    update: async ({ where, data }) => Object.assign(mockDb.usuarios.find(u => u.id === where.id), data),
  },
  tokenRecuperacion: {
    deleteMany: async ({ where }) => {
      mockDb.tokens = mockDb.tokens.filter(t => !(t.usuarioId === where.usuarioId && t.usado === where.usado));
    },
    create: async ({ data }) => {
      const token = { id: mockSiguienteToken++, usado: false, ...data };
      mockDb.tokens.push(token);
      return token;
    },
    findUnique: async ({ where }) => mockDb.tokens.find(t => t.hash === where.hash) || null,
    updateMany: async ({ where, data }) => {
      const objetivo = mockDb.tokens.filter(t => t.id === where.id && t.usado === where.usado);
      objetivo.forEach(t => Object.assign(t, data));
      return { count: objetivo.length };
    },
  },
  logAccion: { create: async ({ data }) => mockDb.logs.push(data) },
  juego: { findMany: async () => [] },
}));


const app = require('../src/app');

const EMAIL = 'ana@mail.com';
const CLAVE_VIEJA = 'claveVieja1';
const CLAVE_NUEVA = 'claveNueva2';

// Toma el token CSRF de la página y devuelve un agente con la sesión.
async function agenteConCsrf(ruta) {
  const agente = request.agent(app);
  const pagina = await agente.get(ruta);
  const csrf = pagina.text.match(/name="csrf-token" content="([^"]+)"/)[1];
  return { agente, csrf };
}

// Solicita la recuperación y devuelve el token que se "envía" por correo (consola).
async function solicitarToken(email) {
  const log = jest.spyOn(console, 'log').mockImplementation(() => {});
  const { agente, csrf } = await agenteConCsrf('/recuperar');
  const res = await agente.post('/recuperar').type('form').send({ email, _csrf: csrf });
  const salida = log.mock.calls.map(c => c.join(' ')).join('\n');
  log.mockRestore();
  const coincidencia = salida.match(/\/restablecer\/([a-f0-9]{64})/);
  return { res, token: coincidencia ? coincidencia[1] : null };
}

async function restablecer(token, password) {
  const { agente, csrf } = await agenteConCsrf(`/restablecer/${token}`);
  return agente.post(`/restablecer/${token}`).type('form').send({ password, _csrf: csrf });
}

beforeEach(async () => {
  mockDb.usuarios = [{ id: 1, nombre: 'Ana', email: EMAIL, rol: 'usuario', passwordHash: await bcrypt.hash(CLAVE_VIEJA, 4) }];
  mockDb.tokens = [];
  mockDb.logs = [];
});

describe('recuperación de clave', () => {
  test('el flujo completo cambia la clave y permite iniciar sesión con la nueva', async () => {
    const { res, token } = await solicitarToken(EMAIL);
    expect(res.status).toBe(200);
    expect(token).toMatch(/^[a-f0-9]{64}$/);

    // El token se guarda como hash, nunca en claro.
    expect(mockDb.tokens[0].hash).not.toBe(token);

    const cambio = await restablecer(token, CLAVE_NUEVA);
    expect(cambio.status).toBe(302);
    expect(cambio.headers.location).toBe('/login?info=clave');
    expect(await bcrypt.compare(CLAVE_NUEVA, mockDb.usuarios[0].passwordHash)).toBe(true);

    const { agente, csrf } = await agenteConCsrf('/login');
    const login = await agente.post('/login').type('form').send({ email: EMAIL, password: CLAVE_NUEVA, _csrf: csrf });
    expect(login.status).toBe(302);
    expect(login.headers.location).toBe('/');
  });

  test('el token es de un solo uso', async () => {
    const { token } = await solicitarToken(EMAIL);
    await restablecer(token, CLAVE_NUEVA);
    const segundo = await restablecer(token, 'otraClave3');
    expect(segundo.status).toBe(400);
    expect(segundo.text).toContain('no es válido o ya caducó');
    expect(await bcrypt.compare(CLAVE_NUEVA, mockDb.usuarios[0].passwordHash)).toBe(true);
  });

  test('un token caducado se rechaza', async () => {
    const { token } = await solicitarToken(EMAIL);
    mockDb.tokens[0].expira = new Date(Date.now() - 1000);
    const res = await restablecer(token, CLAVE_NUEVA);
    expect(res.status).toBe(400);
    expect(await bcrypt.compare(CLAVE_VIEJA, mockDb.usuarios[0].passwordHash)).toBe(true);
  });

  test('pedir un enlace nuevo invalida el anterior', async () => {
    const { token: primero } = await solicitarToken(EMAIL);
    await solicitarToken(EMAIL);
    const res = await restablecer(primero, CLAVE_NUEVA);
    expect(res.status).toBe(400);
  });

  test('una clave débil se rechaza y el token sigue sirviendo', async () => {
    const { token } = await solicitarToken(EMAIL);
    const debil = await restablecer(token, 'corta');
    expect(debil.status).toBe(400);
    const buena = await restablecer(token, CLAVE_NUEVA);
    expect(buena.status).toBe(302);
  });

  test('un correo no registrado recibe la misma respuesta y no genera enlace', async () => {
    const { res, token } = await solicitarToken('nadie@mail.com');
    expect(res.status).toBe(200);
    expect(res.text).toContain('Si el correo está registrado');
    expect(token).toBeNull();
  });
});
