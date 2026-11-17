// Validación en el cliente (complementaria: el servidor siempre vuelve a validar).
(() => {
  const CLAVE = /^(?=.*[A-Za-z])(?=.*\d).{8,72}$/;

  document.querySelectorAll('form[data-validar]').forEach(form => {
    form.addEventListener('submit', event => {
      form.querySelectorAll('input[data-clave]').forEach(input => {
        input.setCustomValidity(
          CLAVE.test(input.value) ? '' : 'La clave necesita entre 8 y 72 caracteres, con letras y números.',
        );
      });

      if (!form.checkValidity()) {
        event.preventDefault();
        form.reportValidity();
      }
    });
  });
})();
