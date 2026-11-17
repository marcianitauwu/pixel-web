// Pide confirmación antes de enviar formularios con data-confirm (por ejemplo, eliminar).
document.addEventListener('submit', event => {
  const mensaje = event.target.dataset && event.target.dataset.confirm;
  if (mensaje && !window.confirm(mensaje)) event.preventDefault();
});
