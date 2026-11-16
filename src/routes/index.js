const express = require('express');
const prisma = require('../config/prisma');
const inicio = require('../controllers/inicioController');

const router = express.Router();

// Inicio provisional: lista los juegos de la base de datos.
router.get('/', inicio.inicio);

module.exports = router;
