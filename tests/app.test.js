const request = require('supertest');
const app = require('../src/app');

// Requiere haber ejecutado `npx prisma generate` (lo hace `npm install` automáticamente).
describe('protección de rutas de la aplicación', () => {
  test('el catálogo redirige al login sin sesión', async () => {
    const res = await request(app).get('/catalogo');
    expect(res.status).toBe(302);
    expect(res.headers.location).toBe('/login');
  });

  test('la API del chat responde 401 sin sesión', async () => {
    const res = await request(app).get('/api/mensajes');
    expect(res.status).toBe(401);
  });

  test('un POST sin token CSRF se rechaza con 403', async () => {
    const res = await request(app).post('/logout');
    expect(res.status).toBe(403);
  });
});
