// Envío del correo de recuperación: real con SMTP configurado, simulado sin él.
const mockSendMail = jest.fn().mockResolvedValue({ messageId: 'prueba' });
jest.mock('nodemailer', () => ({ createTransport: jest.fn(() => ({ sendMail: mockSendMail })) }));

const ENLACE = 'http://localhost:3000/restablecer/abc123';

beforeEach(() => {
  jest.resetModules();
  mockSendMail.mockClear();
  delete process.env.SMTP_HOST;
  delete process.env.SMTP_USER;
  delete process.env.SMTP_PASS;
});

test('con SMTP configurado se envía un correo real con el enlace', async () => {
  process.env.SMTP_HOST = 'smtp.ejemplo.com';
  process.env.SMTP_USER = 'pixel@ejemplo.com';
  process.env.SMTP_PASS = 'secreto';
  jest.doMock('../src/config/prisma', () => ({}));
  const { enviarCorreoRecuperacion } = require('../src/services/recuperacion');

  await enviarCorreoRecuperacion('ana@mail.com', ENLACE);

  expect(mockSendMail).toHaveBeenCalledTimes(1);
  const correo = mockSendMail.mock.calls[0][0];
  expect(correo.to).toBe('ana@mail.com');
  expect(correo.text).toContain(ENLACE);
  expect(correo.html).toContain(ENLACE);
});

test('sin SMTP el correo se simula en la consola y no se envía', async () => {
  jest.doMock('../src/config/prisma', () => ({}));
  const { enviarCorreoRecuperacion } = require('../src/services/recuperacion');
  const log = jest.spyOn(console, 'log').mockImplementation(() => {});

  await enviarCorreoRecuperacion('ana@mail.com', ENLACE);

  expect(mockSendMail).not.toHaveBeenCalled();
  expect(log.mock.calls.join('\n')).toContain(ENLACE);
  log.mockRestore();
});
