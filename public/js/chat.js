// Cliente del chat: WebSocket nativo con reconexión y espera creciente.
(() => {
  const lista = document.getElementById('mensajes');
  const usuarios = document.getElementById('usuarios');
  const conteo = document.getElementById('conteo');
  const estado = document.getElementById('estado');
  const form = document.getElementById('formChat');
  const input = document.getElementById('texto');
  const protocolo = location.protocol === 'https:' ? 'wss' : 'ws';

  const yo = Number(lista.dataset.yo);
  let ws;
  let intentos = 0;

  function insignia() {
    const span = document.createElement('span');
    span.className = 'insignia-admin';
    span.textContent = 'Admin';
    return span;
  }

  // Todo el contenido se escribe con textContent para evitar XSS.
  // Mensajes propios a la derecha, sin nombre. Los del resto a la izquierda, con nombre.
  function agregarMensaje(m) {
    const li = document.createElement('li');
    const propio = m.usuarioId === yo;
    if (m.rol === 'admin') li.classList.add('de-admin');
    if (propio) {
      li.classList.add('propio');
    } else {
      const autor = document.createElement('strong');
      autor.textContent = m.usuario;
      if (m.rol === 'admin') autor.append(insignia());
      li.append(autor);
    }
    const texto = document.createElement('span');
    texto.textContent = m.texto;
    li.append(texto);
    if (m.creadoEn) {
      const hora = document.createElement('time');
      hora.dateTime = m.creadoEn;
      hora.textContent = new Date(m.creadoEn).toLocaleTimeString('es-EC', { hour: '2-digit', minute: '2-digit' });
      li.append(hora);
    }
    lista.append(li);
    lista.scrollTop = lista.scrollHeight;
  }

  function agregarSistema(texto) {
    const li = document.createElement('li');
    li.className = 'sistema';
    li.textContent = texto;
    lista.append(li);
    lista.scrollTop = lista.scrollHeight;
  }

  function pintarUsuarios(lista2) {
    usuarios.replaceChildren(
      ...lista2.map(u => {
        const li = document.createElement('li');
        li.textContent = u.nombre;
        if (u.rol === 'admin') li.append(insignia());
        return li;
      }),
    );
    conteo.textContent = lista2.length;
  }

  function conectar() {
    ws = new WebSocket(`${protocolo}://${location.host}/ws`);

    ws.addEventListener('open', () => {
      intentos = 0;
      estado.textContent = 'Conectado';
      estado.classList.add('conectado');
    });

    ws.addEventListener('message', event => {
      const datos = JSON.parse(event.data);
      if (datos.tipo === 'mensaje') agregarMensaje(datos);
      else if (datos.tipo === 'usuarios') pintarUsuarios(datos.usuarios);
      else if (datos.tipo === 'juego_nuevo') agregarSistema(`Nuevo juego disponible: ${datos.titulo}`);
      else if (datos.tipo === 'error') agregarSistema(datos.mensaje);
    });

    ws.addEventListener('close', () => {
      estado.classList.remove('conectado');
      estado.textContent = 'Sin conexión. Reconectando…';
      const espera = Math.min(1000 * 2 ** intentos, 16000);
      intentos += 1;
      setTimeout(conectar, espera);
    });
  }

  form.addEventListener('submit', event => {
    event.preventDefault();
    const texto = input.value.trim();
    if (!texto || !ws || ws.readyState !== WebSocket.OPEN) return;
    ws.send(JSON.stringify({ texto }));
    input.value = '';
  });

  // Historial por HTTP y después conexión en tiempo real.
  fetch('/api/mensajes?limit=50')
    .then(r => r.json())
    .then(mensajes => mensajes.forEach(agregarMensaje))
    .finally(conectar);
})();
