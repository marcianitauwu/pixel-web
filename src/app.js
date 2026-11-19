const path = require('path');
const express = require('express');
const helmet = require('helmet');
const { middleware: sesion } = require('./config/sesion');
const { protegerCsrf } = require('./middlewares/csrf');
const rutas = require('./routes');

const app = express();

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.disable('x-powered-by');

// Cabeceras de seguridad. frame-src permite solo los juegos alojados en GitHub Pages.
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'"],
        styleSrc: ["'self'"],
        imgSrc: ["'self'", 'data:', 'https:'],
        frameSrc: ["'self'", 'https://*.github.io'],
        connectSrc: ["'self'", 'ws:', 'wss:'],
        objectSrc: ["'none'"],
      },
    },
  }),
);

app.use(express.static(path.join(__dirname, '..', 'public')));
app.use(express.urlencoded({ extended: false, limit: '10kb' }));
app.use(express.json({ limit: '10kb' }));
app.use(sesion);
app.use(protegerCsrf);
app.use((req, res, next) => {
  res.locals.usuario = req.session.usuario || null;
  next();
});

app.use(rutas);

app.use((req, res) => {
  res.status(404).render('error', { titulo: 'No encontrado', mensaje: 'La página que buscas no existe.' });
});

// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).render('error', { titulo: 'Error interno', mensaje: 'Algo salió mal. Intenta de nuevo.' });
});

module.exports = app;
