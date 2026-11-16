const { requireLogin, requireAdmin } = require('../src/middlewares/auth');

function crearRes() {
  return {
    statusCode: 200,
    body: null,
    view: null,
    location: null,
    status(code) { this.statusCode = code; return this; },
    render(view) { this.view = view; return this; },
    json(body) { this.body = body; return this; },
    redirect(url) { this.location = url; return this; },
  };
}

describe('control de acceso', () => {
  test('requireLogin redirige al login cuando no hay sesión', () => {
    const res = crearRes();
    const next = jest.fn();
    requireLogin({ session: {}, originalUrl: '/catalogo' }, res, next);
    expect(res.location).toBe('/login');
    expect(next).not.toHaveBeenCalled();
  });

  test('requireLogin responde 401 en la API sin sesión', () => {
    const res = crearRes();
    requireLogin({ session: {}, originalUrl: '/api/mensajes' }, res, jest.fn());
    expect(res.statusCode).toBe(401);
  });

  test('requireAdmin responde 403 a un usuario normal', () => {
    const res = crearRes();
    const next = jest.fn();
    requireAdmin({ session: { usuario: { id: 2, rol: 'usuario' } } }, res, next);
    expect(res.statusCode).toBe(403);
    expect(next).not.toHaveBeenCalled();
  });

  test('requireAdmin deja pasar al administrador', () => {
    const next = jest.fn();
    requireAdmin({ session: { usuario: { id: 1, rol: 'admin' } } }, crearRes(), next);
    expect(next).toHaveBeenCalled();
  });
});

describe('pantallas de jugar', () => {
  const { requireJugador } = require('../src/middlewares/auth');

  test('el administrador es enviado a su panel en lugar del catálogo', () => {
    const res = crearRes();
    const next = jest.fn();
    requireJugador({ session: { usuario: { id: 1, rol: 'admin' } }, originalUrl: '/catalogo' }, res, next);
    expect(res.location).toBe('/admin/juegos');
    expect(next).not.toHaveBeenCalled();
  });

  test('el administrador no registra partidas', () => {
    const res = crearRes();
    requireJugador({ session: { usuario: { id: 1, rol: 'admin' } }, originalUrl: '/api/juegos/1/partida' }, res, jest.fn());
    expect(res.statusCode).toBe(403);
  });

  test('un jugador entra al catálogo', () => {
    const next = jest.fn();
    requireJugador({ session: { usuario: { id: 2, rol: 'usuario' } }, originalUrl: '/catalogo' }, crearRes(), next);
    expect(next).toHaveBeenCalled();
  });
});
