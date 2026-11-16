require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

// Datos de ejemplo. Títulos y URLs confirmados por el grupo.
// Descripciones redactadas a partir de las pantallas de cada juego: confirmarlas con cada autor.
const JUEGOS = [
  {
    titulo: 'Escape del Maizal',
    categoria: 'Aventura',
    url: 'https://2026b-sof-jueg-gr1.github.io/salazar-dominguez-gregory-leandro-jueg-gr1/',
    portada: '/img/portada-maizal.svg',
    descripcion: 'Terror en primera persona dentro de un laberinto de maíz. Solo tienes una linterna, cada decisión es definitiva y no todos los que te acompañan son tus amigos. Descubre a los impostores antes de que sea tarde.',
  },
  {
    titulo: 'Órbita',
    categoria: 'Arcade',
    url: 'https://2026b-sof-jueg-gr1.github.io/anrango-burga-stalin-rene-jueg-gr1/',
    portada: '/img/portada-orbita.svg',
    descripcion: 'Juego de ritmo en una ciudad flotante bajo un planeta gigante. Golpea cada objetivo al compás: F para los del suelo y J para los del aire. Empieza con un tutorial de siete pasos.',
  },
  {
    titulo: 'Late night feature',
    categoria: 'Terror',
    url: 'https://2026b-sof-jueg-gr1.github.io/davila-navarrete-paul-andres-jueg-Gr3/mi-primer-juego',
    portada: '/img/portada-late-night.svg',
    descripcion: 'Juego de puzles protagonizado por íconos del cine slasher. Resuelve cada nivel, avanza por la función de medianoche y supera tu puntaje máximo. El juego está en inglés.',
  },
  {
    titulo: '¡HUYE, AMIGA, HUYE!',
    categoria: 'Acción',
    url: 'https://2026b-sof-jueg-gr1.github.io/hernandez-quintana-isabella-sarahy-jueg-gr1/',
    portada: '/img/portada-huye.svg',
    descripcion: 'Un grupo de chicos enamorados persigue a una chica con corazones y flores. Ayúdala a escapar y llega lo más lejos que puedas sin que la alcancen.',
  },
  {
    titulo: 'Quito: Guardianes de las Leyendas',
    categoria: 'Estrategia',
    url: 'https://2026b-sof-jueg-gr1.github.io/arizaga-guallpa-samira-fernanda-jueg-gr1/mi-primer-juego/',
    portada: '/img/portada-quito.svg',
    descripcion: 'La ciudad ha olvidado sus historias. Con Nova, la guardiana del farol, recorre cuatro lugares de Quito, reúne cuatro fragmentos y usa dos tipos de bombas para recuperar sus leyendas, una a la vez.',
  },
];

async function main() {
  const email = process.env.ADMIN_EMAIL || 'admin@pixel-web.local';
  const password = process.env.ADMIN_PASSWORD || 'Admin12345';
  const passwordHash = await bcrypt.hash(password, 12);

  await prisma.usuario.upsert({
    where: { email },
    update: { rol: 'admin' },
    create: { nombre: 'Administrador', email, passwordHash, rol: 'admin' },
  });

  for (const juego of JUEGOS) {
    const existe = await prisma.juego.findFirst({ where: { titulo: juego.titulo } });
    if (existe) await prisma.juego.update({ where: { id: existe.id }, data: juego });
    else await prisma.juego.create({ data: juego });
  }

  console.log(`Seed listo: administrador ${email} y ${JUEGOS.length} juegos de ejemplo.`);
}

main()
  .catch(err => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
