/**
 * main.js — Orquestador de la Experiencia para Yohandry
 *
 * Flujo:
 * 1. Pantalla de bienvenida interactiva (desbloqueo de audio y contexto en iOS/Android/Desktop).
 * 2. Prólogo cósmico poético + Cinemática (Galaxia 3D -> Constelación "Yohandry" -> Corazón "Te amo" -> Supernova).
 * 3. Formación animada en motion graphics de la carta floral con rosas y sello de cera.
 * 4. Botón floral interactivo:
 *    - Al presionar: se reproducen los acordes de "Dame Amor", las 12 rosas 3D florecen en tiempo real
 *      y caen pétalos de terciopelo.
 *    - La carta floral se despliega con motion graphics en un formato dinámico interactivo por capítulos.
 * 5. Visor dinámico de capítulos:
 *    - Navegación fluida por los 6 capítulos con efecto typewriter.
 *    - Iluminación interactiva de las rosas del ramo según el capítulo.
 *    - Navegación táctil (swipe), por botones y por teclado.
 *    - Autoplay opcional con timer circular.
 * 6. Bottom sheet con la carta completa, firma SVG animada, y galería de los 12 meses.
 *
 * Efectos inmersivos integrados:
 * - #1  Typewriter (texto letra a letra)
 * - #3  Viñeta/Bloom pulsante
 * - #5  Firma caligráfica SVG animada
 * - #6  Barra de progreso de audio
 * - #8  Autoplay de capítulos con timer circular
 * - #10 Indicador "Toca una rosa"
 * - #11 Pétalos reactivos al tacto
 * - #12 Pulso visual sincronizado con beats de audio
 * - #13 Giroscopio (parallax al inclinar móvil)
 * - #14 Sonidos táctiles (whoosh, campanita, crujido)
 * - #15 Transición final envolvente
 */

import './style.css';
import gsap from 'gsap';
import { EscenaRosas } from './rose.js';
import { SistemaCorazones } from './particles.js';
import { SistemaMusica } from './audio.js';
import { MonitorRendimiento } from './performance.js';
import { inicializarGalerias, abrirModalRecuerdo } from './photos.js';
import { CARTA_COMPLETA, CAPITULOS_CARTA } from './carta.js';
import { IntroCinematica } from './intro.js';
import {
  EfectoTypewriter,
  VinetaBloom,
  IndicadorTocaRosa,
  ParallaxGiroscopio,
  PetalosReactivosTacto,
  SonidosTactiles,
  AutoplayCapitulos,
  SincronizadorBeats,
  TransicionFinal
} from './effects.js';

const $ = (id) => document.getElementById(id);

const DOM = {
  entrada: $('entrada'),
  btnAbrir: $('btn-abrir'),
  heartsEntrada: $('hearts-canvas-entrada'),

  // Intro
  introContainer: $('intro-container'),
  canvasIntro: $('canvas-intro'),
  btnSaltarIntro: $('btn-saltar-intro'),

  // Experiencia principal
  experiencia: $('experiencia'),
  canvas3d: $('canvas-3d'),
  heartsCanvas: $('hearts-canvas'),
  petalosTactoCanvas: $('petalos-tacto-canvas'),

  // Fase 1: Carta floral con botón de apertura
  cartaFloralBox: $('carta-floral-box'),
  btnAbrirCartaFloral: $('btn-abrir-carta-floral'),

  // Fase 2: Visor de carta dinámico
  visorCartaDinamica: $('visor-carta-dinamica'),
  trackerLineaProgreso: $('tracker-linea-progreso'),
  trackerNodos: $('tracker-nodos'),
  tarjetaDinamicaCard: $('tarjeta-dinamica-card'),
  capBadgeIcono: $('cap-badge-icono'),
  capBadgeEtiqueta: $('cap-badge-etiqueta'),
  capContador: $('cap-contador'),
  capTitulo: $('cap-titulo'),
  capCita: $('cap-cita'),
  capTexto: $('cap-texto'),
  btnCapPrev: $('btn-cap-prev'),
  btnCapNext: $('btn-cap-next'),
  btnAbrirSheet: $('btn-abrir-sheet'),
  btnVerRecuerdos: $('btn-ver-recuerdos'),

  // Bottom Sheet
  sheet: $('carta-sheet'),
  sheetBackdrop: $('carta-sheet-backdrop'),
  sheetContenido: $('carta-sheet-contenido'),
  btnCerrarSheet: $('btn-cerrar-sheet'),

  // Firma SVG
  firmaSvg: $('firma-svg'),
  firmaTrazo: $('firma-trazo'),

  // Sección 12 meses
  seccionDoceMeses: $('seccion-doce-meses'),

  // Modal de aprecio de ramo (regalo eterno)
  modalRamoBackdrop: $('modal-ramo-backdrop'),
  modalRamoRegalo: $('modal-ramo-regalo'),
  btnCerrarRamoRegalo: $('btn-cerrar-ramo-regalo'),
  btnApreciarRamo: $('btn-apreciar-ramo'),
  btnRamoAcariciar: $('btn-ramo-acariciar'),
  btnRamoGiro: $('btn-ramo-giro'),
  btnRamoRecuerdos: $('btn-ramo-recuerdos'),
  iconoRamoGiro: $('icono-ramo-giro'),
  textoRamoGiro: $('texto-ramo-giro'),

  // Píldora de controles en vista despejada
  ramoPillDespejado: $('ramo-pill-despejado'),
  btnRestaurarDedicatoria: $('btn-restaurar-dedicatoria'),
  btnDespejadoPetalos: $('btn-despejado-petalos'),
  btnDespejadoPausar: $('btn-despejado-pausar'),
  btnCerrarVistaDespejada: $('btn-cerrar-vista-despejada'),
  iconoDespejadoPausa: $('icono-despejado-pausa'),
  textoDespejadoPausa: $('texto-despejado-pausa')
};

let escenaRosas = null;
let monitor = null;
let musicaSistema = null;
let corazonesMain = null;
let corazonesEntrada = null;
let introInstance = null;
let bucleActivo = false;
let rafId = null;
let introRafId = null;

let capituloActual = 0;
let ramoAbierto = false;

// ── Instancias de efectos inmersivos ──
let typewriter = null;
let vinetaBloom = null;
let indicadorTocaRosa = null;
let giroscopio = null;
let petalosTacto = null;
let sonidosTactiles = null;
let autoplayCapitulos = null;
let sincronizadorBeats = null;
let transicionFinalEjecutada = false;

// Track de capítulos ya visitados (typewriter solo en primera visita)
const capitulosVisitados = new Set();

// ── Inicialización base ──
function inicializar() {
  if (DOM.sheetContenido) {
    DOM.sheetContenido.textContent = CARTA_COMPLETA;
  }

  // Corazones 2D en pantalla de bienvenida
  if (DOM.heartsEntrada) {
    corazonesEntrada = new SistemaCorazones(DOM.heartsEntrada, {
      cantidad: 22,
      velocidadMax: 0.65,
      opacidadMax: 0.35,
    });
    corazonesEntrada.iniciar();
  }

  configurarBottomSheet();
  musicaSistema = new SistemaMusica();
  window._musicaSistema = musicaSistema;

  // Inicializar sonidos táctiles (#14)
  sonidosTactiles = new SonidosTactiles();

  // Inicializar typewriter (#1)
  typewriter = new EfectoTypewriter();

  if (DOM.btnAbrir) {
    DOM.btnAbrir.addEventListener('click', comenzarExperiencia);
  }
}

// ── Transición desde pantalla de entrada ──
function comenzarExperiencia() {
  if (DOM.btnAbrir) DOM.btnAbrir.disabled = true;

  // Activar sonidos táctiles en el primer gesto del usuario
  if (sonidosTactiles && !sonidosTactiles.inicializado) {
    sonidosTactiles.inicializar();
  }

  if (corazonesEntrada) {
    corazonesEntrada.detener();
    corazonesEntrada = null;
  }

  if (DOM.entrada) {
    DOM.entrada.classList.add('desvanecer');
    setTimeout(() => {
      DOM.entrada.style.display = 'none';
    }, 1000);
  }

  const params = new URLSearchParams(window.location.search);
  const saltarIntroParam = params.get('intro') === '0';
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  if (saltarIntroParam || reducedMotion) {
    iniciarEscenaPrincipal();
  } else {
    reproducirIntroCinematica();
  }
}

// ── Cinemática cósmica ──
function reproducirIntroCinematica() {
  DOM.introContainer.classList.remove('hidden', 'desvanecer');
  DOM.introContainer.style.opacity = '1';
  DOM.introContainer.style.pointerEvents = 'auto';

  if (DOM.btnSaltarIntro) {
    DOM.btnSaltarIntro.classList.add('hidden');
  }

  if (introRafId) {
    cancelAnimationFrame(introRafId);
    introRafId = null;
  }
  if (introInstance) {
    introInstance.destruir();
    introInstance = null;
  }

  let introTerminada = false;
  const onIntroDone = () => {
    if (introTerminada) return;
    introTerminada = true;

    if (introRafId) {
      cancelAnimationFrame(introRafId);
      introRafId = null;
    }

    DOM.introContainer.classList.add('desvanecer');
    setTimeout(() => {
      DOM.introContainer.classList.add('hidden');
      if (introInstance) {
        introInstance.destruir();
        introInstance = null;
      }
    }, 1200);

    iniciarEscenaPrincipal();
  };

  introInstance = new IntroCinematica(DOM.canvasIntro, onIntroDone);
  window._introInstance = introInstance;
  window.saltarIntroATiempo = (t) => {
    if (introInstance) introInstance.saltarATiempo(t);
  };

  setTimeout(() => {
    if (DOM.btnSaltarIntro && !introTerminada) {
      DOM.btnSaltarIntro.classList.remove('hidden');
      DOM.btnSaltarIntro.onclick = () => {
        if (introInstance) introInstance.saltar();
      };
    }
  }, 2200);

  let lastTime = performance.now();
  const loopIntro = (now) => {
    const dt = Math.min(0.1, (now - lastTime) / 1000);
    lastTime = now;
    if (introInstance) {
      introInstance.render(dt);
    }
    if (!introTerminada) {
      introRafId = requestAnimationFrame(loopIntro);
    }
  };
  introRafId = requestAnimationFrame(loopIntro);
}

// ── Inicializar escena 3D y Carta Floral ──
function iniciarEscenaPrincipal() {
  DOM.experiencia.classList.remove('hidden');
  DOM.experiencia.setAttribute('aria-hidden', 'false');

  // Inicializar ramo 3D (las rosas inician cerradas en capullos)
  escenaRosas = new EscenaRosas(DOM.canvas3d);
  window._escenaRosasPruebas = escenaRosas;

  monitor = new MonitorRendimiento((nivelAnterior, nivelNuevo) => {
    if (nivelNuevo === 'bajo' && escenaRosas) {
      escenaRosas.renderer.setPixelRatio(1.0);
    } else if (nivelNuevo === 'medio' && escenaRosas) {
      escenaRosas.renderer.setPixelRatio(1.5);
    }
  });

  corazonesMain = new SistemaCorazones(DOM.heartsCanvas, {
    cantidad: 26,
    velocidadMax: 0.6,
    opacidadMax: 0.32,
  });
  corazonesMain.iniciar();

  iniciarBucleRender();

  // Inicializar galería de 12 recuerdos conectada a las rosas
  inicializarGalerias((rosaIndex) => {
    if (escenaRosas) {
      escenaRosas.destacarRosa(rosaIndex);
    }
    // Sonido al abrir recuerdo (#14)
    if (sonidosTactiles) sonidosTactiles.campanita();
  });

  // Interacción directa en el ramo 3D: al tocar una rosa, se destaca y abre el recuerdo
  escenaRosas.onRosaClick = (rosaIndex) => {
    // Sonido pétalo (#14)
    if (sonidosTactiles) sonidosTactiles.crujidoPetalo();
    abrirModalRecuerdo(rosaIndex);
    // Ocultar indicador si está visible
    if (indicadorTocaRosa) indicadorTocaRosa.ocultar();
  };

  // ── Inicializar efectos inmersivos ──

  // #3 Viñeta/Bloom pulsante
  vinetaBloom = new VinetaBloom();

  // #11 Pétalos reactivos al tacto
  if (DOM.petalosTactoCanvas) {
    petalosTacto = new PetalosReactivosTacto(DOM.petalosTactoCanvas);
    window._petalosTacto = petalosTacto;
  }

  // #13 Giroscopio parallax (solo móvil)
  const esMovil = window.innerWidth < 600 || (window.innerWidth / window.innerHeight < 0.85);
  if (esMovil && escenaRosas) {
    giroscopio = new ParallaxGiroscopio((tiltX, tiltY) => {
      if (escenaRosas) {
        escenaRosas.rotacionObjetivo.y += tiltX * 0.003;
        escenaRosas.rotacionObjetivo.x = Math.max(0.10, Math.min(0.65,
          escenaRosas.rotacionObjetivo.x + tiltY * 0.002
        ));
      }
    });
    giroscopio.iniciar();
  }

  // Configurar Modal Especial de Aprecio de Ramo (Regalo eterno)
  configurarModalRamoRegalo();

  // Mostrar la Carta Floral con animación motion-graphics
  mostrarCartaFloralInicial();
}

// ── Fase 1: Formación animada de la carta floral con botón ──
function mostrarCartaFloralInicial() {
  if (!DOM.cartaFloralBox) return;

  DOM.cartaFloralBox.classList.remove('hidden');
  gsap.fromTo(DOM.cartaFloralBox,
    { opacity: 0, scale: 0.88, y: 35 },
    { opacity: 1, scale: 1.0, y: 0, duration: 1.3, ease: 'back.out(1.2)' }
  );

  if (DOM.btnAbrirCartaFloral) {
    DOM.btnAbrirCartaFloral.addEventListener('click', () => {
      abrirCartaYRosas();
    }, { once: true });
  }
}

// ── Fase 2: Apertura de rosas y despliegue del visor dinámico ──
function abrirCartaYRosas() {
  if (ramoAbierto) return;
  ramoAbierto = true;

  // 1. Iniciar banda sonora "Dame Amor" con fade in progresivo
  if (musicaSistema) {
    musicaSistema.reproducirConFade(3.0);

    // #12 Conectar sincronizador de beats después de que el audio esté reproduciendo
    setTimeout(() => {
      if (musicaSistema && musicaSistema.audio) {
        sincronizadorBeats = new SincronizadorBeats(musicaSistema.audio);
        sincronizadorBeats.conectar();
        sincronizadorBeats.onBeat((intensidadCombinada, bassIntensidad) => {
          // Sincronizar bloom con beats
          if (vinetaBloom) vinetaBloom.sincronizarBeat(intensidadCombinada);

          // Pulso sutil en la tarjeta y bordes
          if (DOM.tarjetaDinamicaCard && intensidadCombinada > 0.35) {
            const scale = 1.0 + (intensidadCombinada - 0.35) * 0.015;
            DOM.tarjetaDinamicaCard.style.transform = `scale(${scale})`;
            setTimeout(() => {
              if (DOM.tarjetaDinamicaCard) {
                DOM.tarjetaDinamicaCard.style.transform = '';
              }
            }, 80);
          }
        });
      }
    }, 1500);
  }

  // 2. Florecer las rosas 3D y soltar pétalos aterciopelados
  if (escenaRosas) {
    escenaRosas.abrirRamo(4.8);
    escenaRosas.soltarPetalos(16);
  }

  // 3. Activar viñeta/bloom (#3)
  if (vinetaBloom) vinetaBloom.iniciar();

  // 4. Animación motion graphics de salida de la caja floral
  gsap.to(DOM.cartaFloralBox, {
    opacity: 0,
    scale: 1.08,
    y: -25,
    duration: 0.8,
    ease: 'power2.inOut',
    onComplete: () => {
      DOM.cartaFloralBox.classList.add('hidden');
      mostrarVisorDinamico();
    }
  });
}

// ── Visor de carta dinámico interactivo ──
function mostrarVisorDinamico() {
  if (!DOM.visorCartaDinamica) return;

  DOM.visorCartaDinamica.classList.remove('hidden');

  // Construir nodos del tracker de capítulos
  construirTrackerCapitulos();

  // Configurar eventos de navegación
  configurarNavegacionCapitulos();

  // #8 Autoplay con timer circular
  autoplayCapitulos = new AutoplayCapitulos(() => {
    if (capituloActual < CAPITULOS_CARTA.length - 1) {
      cargarCapitulo(capituloActual + 1, 'siguiente');
    } else {
      autoplayCapitulos.detener();
    }
  }, 12);

  // Montar botón autoplay en la zona de acciones secundarias
  const accionesSecundarias = document.querySelector('.cap-acciones-secundarias');
  if (accionesSecundarias && autoplayCapitulos) {
    autoplayCapitulos.montar(accionesSecundarias);
  }

  // Mostrar el primer capítulo con animación motion graphics
  cargarCapitulo(0, 'siguiente');

  // Si hay sección de fotos, asegurarla accesible
  if (DOM.seccionDoceMeses) {
    DOM.seccionDoceMeses.classList.remove('hidden');
  }

  gsap.fromTo(DOM.visorCartaDinamica,
    { opacity: 0, y: 30 },
    { opacity: 1, y: 0, duration: 1.0, ease: 'power2.out' }
  );

  // #10 Indicador "Toca una rosa" — mostrar después de 2.5s
  setTimeout(() => {
    indicadorTocaRosa = new IndicadorTocaRosa();
    indicadorTocaRosa.mostrar();
  }, 2500);
}

function construirTrackerCapitulos() {
  if (!DOM.trackerNodos) return;
  DOM.trackerNodos.innerHTML = '';

  CAPITULOS_CARTA.forEach((cap, idx) => {
    const btnNodo = document.createElement('button');
    btnNodo.className = `tracker-nodo ${idx === 0 ? 'activo' : ''}`;
    btnNodo.setAttribute('aria-label', `Capítulo ${cap.numero}: ${cap.etiqueta}`);
    btnNodo.setAttribute('title', `${cap.numero}. ${cap.etiqueta}`);

    btnNodo.innerHTML = `
      <span class="nodo-punto"></span>
      <span class="nodo-romano">${cap.numero}</span>
    `;

    btnNodo.addEventListener('click', () => {
      if (idx !== capituloActual) {
        const direccion = idx > capituloActual ? 'siguiente' : 'anterior';
        cargarCapitulo(idx, direccion);
      }
    });

    DOM.trackerNodos.appendChild(btnNodo);
  });

  actualizarTrackerProgreso(0);
}

function actualizarTrackerProgreso(index) {
  if (DOM.trackerLineaProgreso) {
    const total = CAPITULOS_CARTA.length - 1;
    const pct = total > 0 ? (index / total) * 100 : 0;
    DOM.trackerLineaProgreso.style.width = `${pct}%`;
  }

  const nodos = DOM.trackerNodos ? DOM.trackerNodos.querySelectorAll('.tracker-nodo') : [];
  nodos.forEach((nodo, idx) => {
    if (idx === index) {
      nodo.classList.add('activo');
      nodo.classList.remove('visitado');
    } else if (idx < index) {
      nodo.classList.remove('activo');
      nodo.classList.add('visitado');
    } else {
      nodo.classList.remove('activo', 'visitado');
    }
  });
}

function cargarCapitulo(index, direccion = 'siguiente') {
  if (index < 0 || index >= CAPITULOS_CARTA.length) return;
  capituloActual = index;

  const cap = CAPITULOS_CARTA[index];

  // Sonido whoosh al cambiar capítulo (#14)
  if (sonidosTactiles) sonidosTactiles.whoosh();

  // Reiniciar autoplay timer si activo (#8)
  if (autoplayCapitulos && autoplayCapitulos.activo) {
    autoplayCapitulos.reiniciarTimer();
  }

  // Iluminar rosa en el ramo 3D correspondiente al tema
  if (escenaRosas) {
    escenaRosas.iluminarRosa(index * 2);
    if (cap.faseRosa) {
      escenaRosas.setFase(cap.faseRosa);
    }
    escenaRosas.soltarPetalos(3);
  }

  // Transición motion graphics de la tarjeta
  const card = DOM.tarjetaDinamicaCard;
  if (!card) return;

  const deltaX = direccion === 'siguiente' ? -25 : 25;
  const entraX = direccion === 'siguiente' ? 25 : -25;

  gsap.to(card, {
    opacity: 0,
    x: deltaX,
    duration: 0.28,
    ease: 'power2.in',
    onComplete: () => {
      // Inyectar datos del capítulo
      if (DOM.capBadgeIcono) DOM.capBadgeIcono.textContent = cap.icono;
      if (DOM.capBadgeEtiqueta) DOM.capBadgeEtiqueta.textContent = cap.etiqueta;
      if (DOM.capContador) DOM.capContador.textContent = `Capítulo ${index + 1} de ${CAPITULOS_CARTA.length}`;
      if (DOM.capTitulo) DOM.capTitulo.textContent = cap.titulo;
      if (DOM.capCita) DOM.capCita.textContent = cap.cita.replace(/^[«"]|[»"]$/g, '');

      // #1 Typewriter: primera visita = letra a letra, revisita = instantáneo
      if (DOM.capTexto) {
        if (!capitulosVisitados.has(index)) {
          capitulosVisitados.add(index);
          typewriter.escribir(DOM.capTexto, cap.texto, 20);
        } else {
          typewriter.completarInstantaneo(DOM.capTexto, cap.texto);
        }
      }

      actualizarTrackerProgreso(index);
      actualizarBotonesNav();

      gsap.fromTo(card,
        { opacity: 0, x: entraX },
        { opacity: 1, x: 0, duration: 0.42, ease: 'power2.out' }
      );

      // #15 Transición final: si es el último capítulo y llega al final
      if (index === CAPITULOS_CARTA.length - 1 && !transicionFinalEjecutada) {
        // La transición se activará al presionar "Final" (ir a doce meses)
      }
    }
  });
}

function actualizarBotonesNav() {
  if (DOM.btnCapPrev) {
    DOM.btnCapPrev.disabled = capituloActual === 0;
  }
  if (DOM.btnCapNext) {
    if (capituloActual === CAPITULOS_CARTA.length - 1) {
      DOM.btnCapNext.innerHTML = `<span>Final</span><span style="font-size:1.1rem;margin-left:4px;">🌹</span>`;
    } else {
      DOM.btnCapNext.innerHTML = `<span>Siguiente</span><svg viewBox="0 0 24 24" aria-hidden="true"><polyline points="9 18 15 12 9 6"/></svg>`;
    }
  }
}

function configurarNavegacionCapitulos() {
  if (DOM.btnCapPrev) {
    DOM.btnCapPrev.addEventListener('click', () => {
      if (capituloActual > 0) {
        cargarCapitulo(capituloActual - 1, 'anterior');
      }
    });
  }

  if (DOM.btnCapNext) {
    DOM.btnCapNext.addEventListener('click', () => {
      if (capituloActual < CAPITULOS_CARTA.length - 1) {
        cargarCapitulo(capituloActual + 1, 'siguiente');
      } else {
        // En el último capítulo, activar transición final (#15)
        activarTransicionFinal();
      }
    });
  }

  if (DOM.btnVerRecuerdos) {
    DOM.btnVerRecuerdos.addEventListener('click', () => {
      if (DOM.seccionDoceMeses) {
        DOM.seccionDoceMeses.scrollIntoView({ behavior: 'smooth' });
      }
    });
  }

  // Soporte para flechas de teclado (Left / Right)
  window.addEventListener('keydown', (e) => {
    if (!ramoAbierto) return;
    if (e.key === 'ArrowRight' || e.key === ' ') {
      if (capituloActual < CAPITULOS_CARTA.length - 1) {
        cargarCapitulo(capituloActual + 1, 'siguiente');
      }
    } else if (e.key === 'ArrowLeft') {
      if (capituloActual > 0) {
        cargarCapitulo(capituloActual - 1, 'anterior');
      }
    }
  });

  // Soporte para gestos táctiles (Swipe en móvil)
  let touchStartX = 0;
  let touchEndX = 0;
  const visor = DOM.visorCartaDinamica;
  if (visor) {
    visor.addEventListener('touchstart', (e) => {
      touchStartX = e.changedTouches[0].screenX;
    }, { passive: true });

    visor.addEventListener('touchend', (e) => {
      touchEndX = e.changedTouches[0].screenX;
      handleSwipe();
    }, { passive: true });
  }

  function handleSwipe() {
    const diff = touchEndX - touchStartX;
    if (Math.abs(diff) > 50) {
      if (diff < 0 && capituloActual < CAPITULOS_CARTA.length - 1) {
        cargarCapitulo(capituloActual + 1, 'siguiente');
      } else if (diff > 0 && capituloActual > 0) {
        cargarCapitulo(capituloActual - 1, 'anterior');
      }
    }
  }
}

// ── #15 Transición Final Envolvente ──
function activarTransicionFinal() {
  if (transicionFinalEjecutada) {
    // Si ya se ejecutó, simplemente scroll a doce meses
    if (DOM.seccionDoceMeses) {
      DOM.seccionDoceMeses.scrollIntoView({ behavior: 'smooth' });
    }
    return;
  }
  transicionFinalEjecutada = true;

  // Detener autoplay si estaba activo
  if (autoplayCapitulos) autoplayCapitulos.detener();

  const transicion = new TransicionFinal(escenaRosas, () => {
    transicion.ocultar();
    setTimeout(() => {
      // Al culminar la carta, abrir el regalo especial para contemplar el ramo
      if (typeof window.abrirModalRamoRegalo === 'function') {
        window.abrirModalRamoRegalo();
      }
    }, 700);
  });

  transicion.ejecutar();
}

// ── Configurar Modal Especial de Aprecio de Ramo (Regalo eterno) ──
function configurarModalRamoRegalo() {
  let enVistaDespejada = false;

  const abrirModalRamo = () => {
    if (!DOM.modalRamoRegalo || !DOM.modalRamoBackdrop) return;
    enVistaDespejada = false;
    document.body.classList.add('modal-ramo-abierto');
    document.body.classList.remove('modo-ramo-despejado');
    DOM.modalRamoRegalo.classList.remove('modo-despejado');
    DOM.modalRamoBackdrop.classList.remove('despejado');
    if (DOM.ramoPillDespejado) DOM.ramoPillDespejado.classList.add('hidden');

    if (escenaRosas) {
      escenaRosas.modoDetalleRamo(true, false);
      // Asegurar floración completa y exuberante si no se abrió antes
      escenaRosas.abrirRamo(2.4);
      escenaRosas.soltarPetalos(16);
    }
    if (petalosTacto) petalosTacto.lluviaDePetalos(25);
    if (sonidosTactiles) sonidosTactiles.campanita();

    DOM.modalRamoBackdrop.classList.remove('hidden');
    DOM.modalRamoRegalo.classList.remove('hidden');
    void DOM.modalRamoRegalo.offsetWidth;
    DOM.modalRamoBackdrop.classList.add('visible');
    DOM.modalRamoRegalo.classList.add('visible');
  };

  const cerrarModalRamo = () => {
    if (!DOM.modalRamoRegalo || !DOM.modalRamoBackdrop) return;
    enVistaDespejada = false;
    document.body.classList.remove('modal-ramo-abierto');
    document.body.classList.remove('modo-ramo-despejado');
    if (escenaRosas) escenaRosas.modoDetalleRamo(false);

    DOM.modalRamoRegalo.classList.remove('visible', 'modo-despejado');
    DOM.modalRamoBackdrop.classList.remove('visible', 'despejado');
    if (DOM.ramoPillDespejado) DOM.ramoPillDespejado.classList.add('hidden');

    setTimeout(() => {
      DOM.modalRamoRegalo.classList.add('hidden');
      DOM.modalRamoBackdrop.classList.add('hidden');
    }, 450);
  };

  // Modo Vista Despejada: solo el ramo girando en 360° en pantalla completa
  const activarVistaDespejada = () => {
    enVistaDespejada = true;
    document.body.classList.add('modo-ramo-despejado');
    if (DOM.modalRamoRegalo) DOM.modalRamoRegalo.classList.add('modo-despejado');
    if (DOM.modalRamoBackdrop) DOM.modalRamoBackdrop.classList.add('despejado');
    if (DOM.ramoPillDespejado) DOM.ramoPillDespejado.classList.remove('hidden');

    if (escenaRosas) {
      escenaRosas.modoDetalleRamo(true, true);
      escenaRosas.autoGiro = true;
    }
    if (sonidosTactiles) sonidosTactiles.campanita();

    if (DOM.textoDespejadoPausa) DOM.textoDespejadoPausa.textContent = 'Pausar';
    if (DOM.iconoDespejadoPausa) DOM.iconoDespejadoPausa.textContent = '⏸️';
  };

  // Restaurar dedicatoria y tarjeta sin salir de la vista de aprecio
  const restaurarDedicatoria = () => {
    enVistaDespejada = false;
    document.body.classList.remove('modo-ramo-despejado');
    if (DOM.modalRamoRegalo) DOM.modalRamoRegalo.classList.remove('modo-despejado');
    if (DOM.modalRamoBackdrop) DOM.modalRamoBackdrop.classList.remove('despejado');
    if (DOM.ramoPillDespejado) DOM.ramoPillDespejado.classList.add('hidden');

    if (escenaRosas) {
      escenaRosas.modoDetalleRamo(true, false);
    }
  };

  if (DOM.btnApreciarRamo) DOM.btnApreciarRamo.addEventListener('click', abrirModalRamo);
  if (DOM.btnCerrarRamoRegalo) DOM.btnCerrarRamoRegalo.addEventListener('click', cerrarModalRamo);
  if (DOM.modalRamoBackdrop) DOM.modalRamoBackdrop.addEventListener('click', cerrarModalRamo);

  // Cerrar al hacer clic en el fondo fuera de la tarjeta (cuando no está despejado)
  if (DOM.modalRamoRegalo) {
    DOM.modalRamoRegalo.addEventListener('click', (e) => {
      if (e.target === DOM.modalRamoRegalo && !enVistaDespejada) {
        cerrarModalRamo();
      }
    });
  }

  // Cerrar con tecla Escape
  window.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && DOM.modalRamoRegalo && !DOM.modalRamoRegalo.classList.contains('hidden')) {
      if (enVistaDespejada) {
        restaurarDedicatoria();
      } else {
        cerrarModalRamo();
      }
    }
  });

  if (DOM.btnRamoAcariciar) {
    DOM.btnRamoAcariciar.addEventListener('click', () => {
      if (escenaRosas) escenaRosas.soltarPetalos(25);
      if (petalosTacto) petalosTacto.lluviaDePetalos(45);
      if (sonidosTactiles) sonidosTactiles.crujidoPetalo();
      gsap.fromTo(DOM.btnRamoAcariciar, { scale: 0.92 }, { scale: 1.0, duration: 0.35, ease: 'back.out(2)' });
    });
  }

  // Al presionar "Giro 360°" se despeja la vista completamente para apreciar el ramo
  if (DOM.btnRamoGiro) {
    DOM.btnRamoGiro.addEventListener('click', () => {
      activarVistaDespejada();
    });
  }

  // Controles de la píldora flotante en vista despejada
  if (DOM.btnRestaurarDedicatoria) {
    DOM.btnRestaurarDedicatoria.addEventListener('click', () => {
      restaurarDedicatoria();
    });
  }

  if (DOM.btnDespejadoPetalos) {
    DOM.btnDespejadoPetalos.addEventListener('click', () => {
      if (escenaRosas) escenaRosas.soltarPetalos(25);
      if (petalosTacto) petalosTacto.lluviaDePetalos(45);
      if (sonidosTactiles) sonidosTactiles.crujidoPetalo();
      gsap.fromTo(DOM.btnDespejadoPetalos, { scale: 0.90 }, { scale: 1.0, duration: 0.3, ease: 'back.out(2)' });
    });
  }

  if (DOM.btnDespejadoPausar) {
    DOM.btnDespejadoPausar.addEventListener('click', () => {
      if (escenaRosas) {
        escenaRosas.autoGiro = !escenaRosas.autoGiro;
        const girando = escenaRosas.autoGiro;
        if (DOM.textoDespejadoPausa) DOM.textoDespejadoPausa.textContent = girando ? 'Pausar' : 'Girar';
        if (DOM.iconoDespejadoPausa) DOM.iconoDespejadoPausa.textContent = girando ? '⏸️' : '▶️';
      }
    });
  }

  if (DOM.btnCerrarVistaDespejada) {
    DOM.btnCerrarVistaDespejada.addEventListener('click', () => {
      cerrarModalRamo();
    });
  }

  if (DOM.btnRamoRecuerdos) {
    DOM.btnRamoRecuerdos.addEventListener('click', () => {
      cerrarModalRamo();
      setTimeout(() => {
        if (DOM.seccionDoceMeses) {
          DOM.seccionDoceMeses.scrollIntoView({ behavior: 'smooth' });
        }
      }, 500);
    });
  }

  window.abrirModalRamoRegalo = abrirModalRamo;
  window.activarVistaDespejadaRamo = activarVistaDespejada;
}

// ── Configurar Bottom Sheet (Hoja inferior de carta completa) ──
function configurarBottomSheet() {
  const abrirSheet = () => {
    if (!DOM.sheetBackdrop || !DOM.sheet) return;
    DOM.sheetBackdrop.classList.remove('hidden');
    void DOM.sheetBackdrop.offsetWidth;
    DOM.sheetBackdrop.classList.add('visible');
    DOM.sheet.classList.add('abierto');

    // #5 Firma SVG animada: activar al abrir la carta completa
    setTimeout(() => {
      if (DOM.firmaTrazo) {
        DOM.firmaTrazo.classList.remove('animando');
        void DOM.firmaTrazo.offsetWidth;
        DOM.firmaTrazo.classList.add('animando');
      }
    }, 600);
  };

  const cerrarSheet = () => {
    if (!DOM.sheetBackdrop || !DOM.sheet) return;
    DOM.sheet.classList.remove('abierto');
    DOM.sheetBackdrop.classList.remove('visible');
    setTimeout(() => {
      DOM.sheetBackdrop.classList.add('hidden');
    }, 450);
  };

  if (DOM.btnAbrirSheet) DOM.btnAbrirSheet.addEventListener('click', abrirSheet);
  if (DOM.btnCerrarSheet) DOM.btnCerrarSheet.addEventListener('click', cerrarSheet);
  if (DOM.sheetBackdrop) DOM.sheetBackdrop.addEventListener('click', cerrarSheet);
}

// ── Bucle de animación 3D ──
function iniciarBucleRender() {
  bucleActivo = true;

  function frame(timestamp) {
    if (!bucleActivo) return;
    rafId = requestAnimationFrame(frame);

    if (monitor) monitor.tick(timestamp);
    if (escenaRosas) escenaRosas.actualizar();
  }

  rafId = requestAnimationFrame(frame);
}

function pausarBucleRender() {
  bucleActivo = false;
  if (rafId) cancelAnimationFrame(rafId);
}

// ── Visibilidad de pestaña ──
document.addEventListener('visibilitychange', () => {
  if (document.hidden) {
    pausarBucleRender();
    if (monitor) monitor.pausar();
    if (musicaSistema && musicaSistema.reproduciendo) musicaSistema.pausar();
  } else {
    if (monitor) monitor.reanudar();
    iniciarBucleRender();
  }
});

// Arrancar al cargar el DOM
window.addEventListener('DOMContentLoaded', inicializar);
