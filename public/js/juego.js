// Botón de pantalla completa para el juego embebido.
(() => {
  const boton = document.getElementById('pantalla');
  const visor = document.getElementById('visor');
  if (!boton || !visor) return;
  boton.addEventListener('click', () => {
    const pedir = visor.requestFullscreen || visor.webkitRequestFullscreen;
    if (pedir) pedir.call(visor);
  });
})();
