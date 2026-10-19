/**
 * audio.js — Sistema de Música de Fondo (OfficialAlex425 - Dame Amor)
 * 
 * Gestiona la reproducción con fundido suave (fade-in), control de volumen,
 * ecualizador visual interactivo, barra de progreso con seek, y
 * sincronización de estado.
 */

import { PLAYLIST_AUDIO, RUTA_AUDIO } from './carta.js';

export class SistemaMusica {
  constructor(elementos = {}) {
    this.elementos = {
      btnPlay: elementos.btnPlay || document.getElementById('btn-musica-play'),
      btnMute: elementos.btnMute || document.getElementById('btn-musica-mute'),
      iconoPlay: elementos.iconoPlay || document.getElementById('musica-icon-play'),
      iconoPausa: elementos.iconoPausa || document.getElementById('musica-icon-pausa'),
      iconoVol: elementos.iconoVol || document.getElementById('musica-icon-vol'),
      iconoMute: elementos.iconoMute || document.getElementById('musica-icon-mute'),
      eq: elementos.eq || document.getElementById('musica-eq'),
      widget: elementos.widget || document.getElementById('widget-musica'),
      titulo: document.querySelector('.musica-titulo') || document.getElementById('musica-titulo'),
      artista: document.querySelector('.musica-artista') || document.getElementById('musica-artista'),
      // Nuevos: barra de progreso (#6)
      progresoBar: document.getElementById('musica-progreso-bar'),
      progresoFill: document.getElementById('musica-progreso-fill'),
      tiempo: document.getElementById('musica-tiempo')
    };

    this.playlist = PLAYLIST_AUDIO;
    this.trackActual = 0;

    this.audio = new Audio();
    this.audio.src = this.playlist[0].src;
    this.audio.loop = false; // Permite que el evento 'ended' active la siguiente canción
    this.audio.preload = 'auto';
    this.audio.volume = 0;
    this.audio.crossOrigin = 'anonymous'; // Necesario para AnalyserNode

    this.reproduciendo = false;
    this.silenciado = false;
    this.volumenObjetivo = 0.75;
    this.fadeInterval = null;
    this.progresoRafId = null;

    this.actualizarMetadatosUI();
    this.initEventListeners();
    this.initProgresoBarra();
  }

  initEventListeners() {
    const { btnPlay, btnMute } = this.elementos;

    if (btnPlay) {
      btnPlay.addEventListener('click', () => {
        this.alternarPlay();
      });
    }

    if (btnMute) {
      btnMute.addEventListener('click', () => {
        this.alternarMute();
      });
    }

    this.audio.addEventListener('play', () => {
      this.reproduciendo = true;
      this.actualizarUI();
      this.iniciarActualizacionProgreso();
    });

    this.audio.addEventListener('pause', () => {
      this.reproduciendo = false;
      this.actualizarUI();
      this.detenerActualizacionProgreso();
    });

    // ── Transición automática a la siguiente canción al terminar ──
    this.audio.addEventListener('ended', () => {
      this.siguientePista(true);
    });
  }

  siguientePista(autoPlay = true) {
    this.trackActual = (this.trackActual + 1) % this.playlist.length;
    this.cargarPista(this.trackActual, autoPlay);
  }

  cargarPista(indice, autoPlay = false) {
    this.trackActual = indice;
    const track = this.playlist[this.trackActual];
    this.audio.src = track.src;
    this.actualizarMetadatosUI();
    if (autoPlay) {
      this.reproducirConFade(1.5);
    }
  }

  actualizarMetadatosUI() {
    const track = this.playlist[this.trackActual];
    if (this.elementos.titulo) this.elementos.titulo.textContent = track.titulo;
    if (this.elementos.artista) this.elementos.artista.textContent = track.artista;
  }

  // ── Barra de progreso de audio (#6) ──
  initProgresoBarra() {
    const { progresoBar } = this.elementos;
    if (!progresoBar) return;

    let arrastrando = false;

    const seekTo = (e) => {
      const rect = progresoBar.getBoundingClientRect();
      const clientX = e.touches ? e.touches[0].clientX : e.clientX;
      const pct = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
      if (this.audio.duration && isFinite(this.audio.duration)) {
        this.audio.currentTime = pct * this.audio.duration;
      }
    };

    progresoBar.addEventListener('mousedown', (e) => {
      arrastrando = true;
      seekTo(e);
    });
    progresoBar.addEventListener('touchstart', (e) => {
      arrastrando = true;
      seekTo(e);
    }, { passive: true });

    window.addEventListener('mousemove', (e) => {
      if (arrastrando) seekTo(e);
    });
    window.addEventListener('touchmove', (e) => {
      if (arrastrando) seekTo(e);
    }, { passive: true });

    window.addEventListener('mouseup', () => { arrastrando = false; });
    window.addEventListener('touchend', () => { arrastrando = false; });
  }

  iniciarActualizacionProgreso() {
    const actualizar = () => {
      if (!this.reproduciendo) return;

      const { progresoFill, tiempo } = this.elementos;
      if (this.audio.duration && isFinite(this.audio.duration)) {
        const pct = (this.audio.currentTime / this.audio.duration) * 100;
        if (progresoFill) progresoFill.style.width = `${pct}%`;

        if (tiempo) {
          const min = Math.floor(this.audio.currentTime / 60);
          const sec = Math.floor(this.audio.currentTime % 60);
          tiempo.textContent = `${min}:${sec.toString().padStart(2, '0')}`;
        }
      }

      this.progresoRafId = requestAnimationFrame(actualizar);
    };
    actualizar();
  }

  detenerActualizacionProgreso() {
    if (this.progresoRafId) {
      cancelAnimationFrame(this.progresoRafId);
      this.progresoRafId = null;
    }
  }

  mostrarWidget() {
    if (this.elementos.widget) {
      this.elementos.widget.classList.remove('hidden');
    }
  }

  reproducirConFade(duracionSegundos = 2.5) {
    this.mostrarWidget();

    if (this.fadeInterval) clearInterval(this.fadeInterval);
    this.audio.volume = 0.02;

    const playPromise = this.audio.play();
    if (playPromise !== undefined) {
      playPromise
        .then(() => {
          this.reproduciendo = true;
          this.actualizarUI();

          const pasos = 25;
          const intervaloMs = (duracionSegundos * 1000) / pasos;
          const incremento = this.volumenObjetivo / pasos;

          this.fadeInterval = setInterval(() => {
            if (this.audio.volume + incremento < this.volumenObjetivo) {
              this.audio.volume = Math.min(1.0, this.audio.volume + incremento);
            } else {
              this.audio.volume = this.volumenObjetivo;
              clearInterval(this.fadeInterval);
              this.fadeInterval = null;
            }
          }, intervaloMs);
        })
        .catch((err) => {
          console.warn('Autoplay bloqueado por el navegador hasta interacción:', err);
        });
    }
  }

  pausar() {
    if (this.fadeInterval) clearInterval(this.fadeInterval);
    this.audio.pause();
    this.reproduciendo = false;
    this.actualizarUI();
  }

  alternarPlay() {
    if (this.audio.paused) {
      this.audio.play().catch(e => console.warn(e));
      this.reproduciendo = true;
    } else {
      this.pausar();
    }
    this.actualizarUI();
  }

  alternarMute() {
    this.silenciado = !this.silenciado;
    this.audio.muted = this.silenciado;
    this.actualizarUI();
  }

  actualizarUI() {
    const { iconoPlay, iconoPausa, iconoVol, iconoMute, eq } = this.elementos;

    if (iconoPlay && iconoPausa) {
      if (this.reproduciendo) {
        iconoPlay.classList.add('hidden');
        iconoPausa.classList.remove('hidden');
      } else {
        iconoPlay.classList.remove('hidden');
        iconoPausa.classList.add('hidden');
      }
    }

    if (iconoVol && iconoMute) {
      if (this.silenciado) {
        iconoVol.classList.add('hidden');
        iconoMute.classList.remove('hidden');
      } else {
        iconoVol.classList.remove('hidden');
        iconoMute.classList.add('hidden');
      }
    }

    if (eq) {
      if (this.reproduciendo && !this.silenciado) {
        eq.classList.add('activo');
      } else {
        eq.classList.remove('activo');
      }
    }
  }
}

// Exportar también como SistemaAudio para compatibilidad
export { SistemaMusica as SistemaAudio };
