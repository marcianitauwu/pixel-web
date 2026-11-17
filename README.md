# Pixel Web

Proyecto de la materia Aplicaciones Web Avanzadas (EPN). Primer bimestre: aplicación web monolítica.

Esta es una versión intermedia. El README completo llega en la versión 5.

## Qué incluye esta versión

- **v1, base de datos y estructura:** esquema de Prisma con todos los modelos, seed con el administrador y los juegos de ejemplo, servidor Express con vistas EJS, estilos, fuentes y portadas.
- **v2, autenticación:** registro, inicio de sesión, cierre de sesión, recuperación de clave con token de un solo uso y envío de correo, roles, protección CSRF y auditoría de accesos.

## Pasos para ejecutar

```bash
npm install
cp .env.example .env        # en Windows: copy .env.example .env
npx prisma db push
npm run seed
npm run dev
```

La aplicación queda en `http://localhost:3000`.

El administrador entra con `ADMIN_EMAIL` y `ADMIN_PASSWORD` del archivo `.env`. Para ejecutar las pruebas:

```bash
npm test
```
