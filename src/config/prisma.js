const { PrismaClient } = require('@prisma/client');

// Una sola instancia compartida por toda la aplicación.
const prisma = new PrismaClient();

module.exports = prisma;
