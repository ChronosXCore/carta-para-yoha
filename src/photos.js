/**
 * photos.js — Galería de 12 Recuerdos y Modal Interactivo vinculados a las 12 Rosas 3D
 */

import { RECUERDOS } from './carta.js';

let indiceRecuerdoActivo = 0;
let callbackDestacarRosa = null;

export function inicializarGalerias(onDestacarRosa) {
  callbackDestacarRosa = onDestacarRosa;
  const contenedor = document.getElementById('galeria-doce-meses');
  if (!contenedor) return;

  contenedor.innerHTML = '';

  const seccionFotos = document.getElementById('seccion-doce-meses');
  if (seccionFotos) {
    seccionFotos.classList.remove('hidden');
  }

  RECUERDOS.forEach((recuerdo, index) => {
    const tarjeta = document.createElement('div');
    tarjeta.className = 'mes-tarjeta';
    tarjeta.dataset.recuerdoIndex = String(index);

    tarjeta.innerHTML = `
      <div class="mes-foto-wrap">
        <img src="${recuerdo.foto}" alt="${recuerdo.titulo}" class="mes-foto" loading="lazy" decoding="async" />
        <span class="mes-rosa-badge">🌹 Rosa ${recuerdo.id}</span>
      </div>
      <div class="mes-caption">
        <span class="mes-numero">Recuerdo ${recuerdo.id}</span>
        <h4 class="mes-titulo">${recuerdo.titulo}</h4>
        <p class="mes-anecdota-preview">${recuerdo.anecdota}</p>
        <span class="mes-ver-btn">Ver recuerdo completo ✨</span>
      </div>
    `;

    // Click en la tarjeta de la galería
    tarjeta.addEventListener('click', () => {
      abrirModalRecuerdo(index);
    });

    contenedor.appendChild(tarjeta);
  });

  configurarModalRecuerdo();
}

/**
 * Abre el modal con la foto, título y anécdota del recuerdo,
 * y activa la animación de salida de la rosa 3D correspondiente.
 */
export function abrirModalRecuerdo(index) {
  if (index < 0 || index >= RECUERDOS.length) return;
  indiceRecuerdoActivo = index;
  const recuerdo = RECUERDOS[index];

  // Destacar e iluminar la rosa en el ramo 3D
  if (typeof callbackDestacarRosa === 'function') {
    callbackDestacarRosa(recuerdo.rosaIndex);
  }

  const modal = document.getElementById('modal-recuerdo');
  const backdrop = document.getElementById('modal-recuerdo-backdrop');
  const img = document.getElementById('modal-recuerdo-img');
  const badge = document.getElementById('modal-recuerdo-badge');
  const contador = document.getElementById('modal-recuerdo-contador');
  const titulo = document.getElementById('modal-recuerdo-titulo');
  const texto = document.getElementById('modal-recuerdo-texto');
  const btnPrev = document.getElementById('btn-recuerdo-prev');
  const btnNext = document.getElementById('btn-recuerdo-next');

  if (!modal || !backdrop) return;

  if (img) img.src = recuerdo.foto;
  if (badge) badge.textContent = `🌹 Rosa ${recuerdo.id}`;
  if (contador) contador.textContent = `Recuerdo ${recuerdo.id} de ${RECUERDOS.length}`;
  if (titulo) titulo.textContent = recuerdo.titulo;
  if (texto) texto.textContent = recuerdo.anecdota;

  if (btnPrev) btnPrev.disabled = index === 0;
  if (btnNext) btnNext.disabled = index === RECUERDOS.length - 1;

  backdrop.classList.remove('hidden');
  modal.classList.remove('hidden');

  requestAnimationFrame(() => {
    backdrop.classList.add('visible');
    modal.classList.add('visible');
  });
}

export function cerrarModalRecuerdo() {
  const modal = document.getElementById('modal-recuerdo');
  const backdrop = document.getElementById('modal-recuerdo-backdrop');

  if (!modal || !backdrop) return;

  modal.classList.remove('visible');
  backdrop.classList.remove('visible');

  setTimeout(() => {
    modal.classList.add('hidden');
    backdrop.classList.add('hidden');
  }, 350);
}

function configurarModalRecuerdo() {
  const btnCerrar = document.getElementById('btn-cerrar-recuerdo');
  const backdrop = document.getElementById('modal-recuerdo-backdrop');
  const btnPrev = document.getElementById('btn-recuerdo-prev');
  const btnNext = document.getElementById('btn-recuerdo-next');

  if (btnCerrar) btnCerrar.onclick = cerrarModalRecuerdo;
  if (backdrop) backdrop.onclick = cerrarModalRecuerdo;

  if (btnPrev) {
    btnPrev.onclick = () => {
      if (indiceRecuerdoActivo > 0) {
        abrirModalRecuerdo(indiceRecuerdoActivo - 1);
      }
    };
  }

  if (btnNext) {
    btnNext.onclick = () => {
      if (indiceRecuerdoActivo < RECUERDOS.length - 1) {
        abrirModalRecuerdo(indiceRecuerdoActivo + 1);
      }
    };
  }

  // Tecla Escape para cerrar
  window.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      cerrarModalRecuerdo();
    }
  });
}
