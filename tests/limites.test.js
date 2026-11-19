// Límite de solicitudes de recuperación: 5 por hora por IP.
const request = require('supertest');

jest.mock('../src/config/prisma', () => ({
  usuario: { findUnique: async () => null },
  juego: { findMany: async () => [] },
}));

const app = require('../src/app');

test('la sexta solicitud de recuperación en una hora se bloquea con 429', async () => {
  const agente = request.agent(app);
  const pagina = await agente.get('/recuperar');
  const csrf = pagina.text.match(/name="csrf-token" content="([^"]+)"/)[1];

  const estados = [];
  for (let i = 0; i < 6; i += 1) {
    const res = await agente.post('/recuperar').type('form').send({ email: 'nadie@mail.com', _csrf: csrf });
    estados.push(res.status);
  }
  expect(estados).toEqual([200, 200, 200, 200, 200, 429]);
});
