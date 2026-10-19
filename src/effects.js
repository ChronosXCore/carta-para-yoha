/**
 * effects.js — Módulo de efectos inmersivos avanzados
 *
 * Contiene:
 * - Typewriter: texto escrito letra a letra
 * - Viñeta/Bloom pulsante
 * - Indicador "Toca una rosa"
 * - Giroscopio (DeviceOrientation parallax)
 * - Pétalos reactivos al tacto sobre canvas
 * - Sonidos táctiles (whoosh, campanita, pétalo)
 * - Autoplay de capítulos con timer circular
 * - Pulso visual sincronizado con beats de audio
 * - Transición final envolvente
 */

// ─────────────────────────────────────────────────────────
// 1. TYPEWRITER — Texto escrito letra a letra
// ─────────────────────────────────────────────────────────
export class EfectoTypewriter {
  constructor() {
    this.intervalId = null;
    this.currentText = '';
    this.currentIndex = 0;
    this.callback = null;
  }

  escribir(elemento, texto, velocidadMs = 22, onComplete = null) {
    this.detener();
    if (!elemento) return;

    this.currentText = texto;
    this.currentIndex = 0;
    this.callback = onComplete;
    elemento.textContent = '';
    elemento.classList.add('typewriter-activo');

    // Cursor parpadeante al final
    const cursor = document.createElement('span');
    cursor.className = 'typewriter-cursor';
    cursor.textContent = '|';
    elemento.appendChild(cursor);

    this.intervalId = setInterval(() => {
      if (this.currentIndex < this.currentText.length) {
        // Insertar carácter antes del cursor
        const charNode = document.createTextNode(this.currentText[this.currentIndex]);
        elemento.insertBefore(charNode, cursor);
        this.currentIndex++;

        // Velocidad variable: pausas naturales en puntos y comas
        const char = this.currentText[this.currentIndex - 1];
        if (char === '.' || char === '…') {
          clearInterval(this.intervalId);
          this.intervalId = setTimeout(() => {
            this.intervalId = setInterval(() => {
              if (this.currentIndex < this.currentText.length) {
                const cn = document.createTextNode(this.currentText[this.currentIndex]);
                elemento.insertBefore(cn, cursor);
                this.currentIndex++;
              } else {
                this.finalizar(elemento, cursor);
              }
            }, velocidadMs);
          }, 280);
          return;
        }
        if (char === ',' || char === ';') {
          clearInterval(this.intervalId);
          this.intervalId = setTimeout(() => {
            this.intervalId = setInterval(() => {
              if (this.currentIndex < this.currentText.length) {
                const cn = document.createTextNode(this.currentText[this.currentIndex]);
                elemento.insertBefore(cn, cursor);
                this.currentIndex++;
              } else {
                this.finalizar(elemento, cursor);
              }
            }, velocidadMs);
          }, 140);
          return;
        }
      } else {
        this.finalizar(elemento, cursor);
      }
    }, velocidadMs);
  }

  finalizar(elemento, cursor) {
    clearInterval(this.intervalId);
    this.intervalId = null;
    elemento.classList.remove('typewriter-activo');

    // Desvanecer cursor
    setTimeout(() => {
      if (cursor && cursor.parentNode) {
        cursor.classList.add('desvanecido');
        setTimeout(() => cursor.remove(), 600);
      }
    }, 800);

    if (this.callback) this.callback();
  }

  /**
   * Escribir instantáneamente (para skip o cuando ya se leyó)
   */
  completarInstantaneo(elemento, texto) {
    this.detener();
    if (elemento) {
      elemento.textContent = texto;
      elemento.classList.remove('typewriter-activo');
    }
  }

  detener() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
  }
}

// ─────────────────────────────────────────────────────────
// 2. VIÑETA / BLOOM PULSANTE
// ─────────────────────────────────────────────────────────
export class VinetaBloom {
  constructor() {
    this.overlay = null;
    this.activo = false;
    this.rafId = null;
    this.intensidad = 0;
    this.crear();
  }

  crear() {
    this.overlay = document.createElement('div');
    this.overlay.className = 'vineta-bloom-overlay';
    this.overlay.setAttribute('aria-hidden', 'true');
    document.body.appendChild(this.overlay);
  }

  iniciar() {
    this.activo = true;
    this.overlay.classList.add('activo');
    this.animar();
  }

  animar() {
    if (!this.activo) return;

    const t = performance.now() * 0.001;
    // Respiración suave 4 segundos de ciclo
    const respiracion = 0.45 + 0.55 * Math.sin(t * 0.78) * Math.sin(t * 0.78);
    // Pulso más rápido sutil
    const pulso = 0.85 + 0.15 * Math.sin(t * 2.4);
    this.intensidad = respiracion * pulso;

    this.overlay.style.opacity = String(0.25 + this.intensidad * 0.35);

    this.rafId = requestAnimationFrame(() => this.animar());
  }

  /** Recibe la intensidad del audio para sincronizar */
  sincronizarBeat(intensidadBeat) {
    if (this.overlay) {
      const boost = Math.min(1.0, intensidadBeat * 1.5);
      this.overlay.style.setProperty('--bloom-beat', String(boost));
    }
  }

  detener() {
    this.activo = false;
    if (this.rafId) cancelAnimationFrame(this.rafId);
    this.overlay.classList.remove('activo');
  }
}

// ─────────────────────────────────────────────────────────
// 3. INDICADOR "TOCA UNA ROSA"
// ─────────────────────────────────────────────────────────
export class IndicadorTocaRosa {
  constructor() {
    this.elemento = null;
    this.visible = false;
  }

  mostrar() {
    if (this.elemento) return;

    this.elemento = document.createElement('div');
    this.elemento.className = 'indicador-toca-rosa';
    this.elemento.setAttribute('aria-hidden', 'true');
    this.elemento.innerHTML = `
      <div class="toca-rosa-contenido">
        <div class="toca-rosa-mano">👆</div>
        <span class="toca-rosa-texto">Toca una rosa para descubrir un recuerdo</span>
      </div>
    `;

    document.body.appendChild(this.elemento);
    this.visible = true;

    // Aparecer con animación
    requestAnimationFrame(() => {
      this.elemento.classList.add('visible');
    });

    // Auto-ocultar después de 6 segundos
    setTimeout(() => this.ocultar(), 6000);
  }

  ocultar() {
    if (!this.elemento || !this.visible) return;
    this.visible = false;
    this.elemento.classList.remove('visible');
    this.elemento.classList.add('saliendo');
    setTimeout(() => {
      if (this.elemento && this.elemento.parentNode) {
        this.elemento.remove();
        this.elemento = null;
      }
    }, 600);
  }
}

// ─────────────────────────────────────────────────────────
// 4. GIROSCOPIO — Parallax al inclinar el móvil
// ─────────────────────────────────────────────────────────
export class ParallaxGiroscopio {
  constructor(onUpdate) {
    this.onUpdate = onUpdate; // callback(tiltX, tiltY)
    this.activo = false;
    this.tiltX = 0;
    this.tiltY = 0;
    this._handler = null;
  }

  async iniciar() {
    // Pedir permisos en iOS 13+
    if (typeof DeviceOrientationEvent !== 'undefined' &&
        typeof DeviceOrientationEvent.requestPermission === 'function') {
      try {
        const permiso = await DeviceOrientationEvent.requestPermission();
        if (permiso !== 'granted') return;
      } catch (e) {
        return;
      }
    }

    this.activo = true;
    this._handler = (e) => {
      if (!this.activo) return;
      // beta: inclinación frontal-trasera [-180, 180]
      // gamma: inclinación izq-der [-90, 90]
      const beta = e.beta || 0;
      const gamma = e.gamma || 0;

      // Normalizar a rango [-1, 1] suave
      this.tiltX = Math.max(-1, Math.min(1, gamma / 30));
      this.tiltY = Math.max(-1, Math.min(1, (beta - 45) / 30));

      if (this.onUpdate) {
        this.onUpdate(this.tiltX, this.tiltY);
      }
    };

    window.addEventListener('deviceorientation', this._handler, { passive: true });
  }

  detener() {
    this.activo = false;
    if (this._handler) {
      window.removeEventListener('deviceorientation', this._handler);
    }
  }
}

// ─────────────────────────────────────────────────────────
// 5. PÉTALOS REACTIVOS AL TACTO
// ─────────────────────────────────────────────────────────
export class PetalosReactivosTacto {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = null;
    this.particulas = [];
    this.activo = false;
    this.rafId = null;

    this.iniciar();
  }

  iniciar() {
    if (!this.canvas) return;
    this.canvas.style.pointerEvents = 'none';
    this.ctx = this.canvas.getContext('2d');
    this.activo = true;
    this.redimensionar();

    // Escuchar touch/mouse en el document
    const handler = (e) => {
      const x = e.touches ? e.touches[0].clientX : e.clientX;
      const y = e.touches ? e.touches[0].clientY : e.clientY;
      this.emitir(x, y, 3);
    };

    document.addEventListener('touchmove', handler, { passive: true });
    document.addEventListener('mousemove', (e) => {
      if (e.buttons > 0) handler(e);
    });

    window.addEventListener('resize', () => this.redimensionar());
    this.animar();
  }

  redimensionar() {
    if (!this.canvas) return;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    this.canvas.width = window.innerWidth * dpr;
    this.canvas.height = window.innerHeight * dpr;
    if (this.ctx) {
      this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }
  }

  lluviaDePetalos(cantidad = 45) {
    if (!this.canvas) return;
    const w = window.innerWidth;

    for (let i = 0; i < cantidad; i++) {
      const delay = Math.random() * 950;
      setTimeout(() => {
        if (!this.activo) return;
        this.particulas.push({
          x: Math.random() * w,
          y: -25 - Math.random() * 85,
          vx: (Math.random() - 0.5) * 1.6,
          vy: 2.0 + Math.random() * 3.0,
          size: 11 + Math.random() * 16,
          rotation: Math.random() * Math.PI * 2,
          rotSpeed: (Math.random() - 0.5) * 0.05,
          flip: Math.random() * Math.PI * 2,
          flipSpeed: 0.02 + Math.random() * 0.04,
          swaySpeed: 0.002 + Math.random() * 0.0025,
          swayAmp: 1.4 + Math.random() * 2.2,
          opacity: 0.88 + Math.random() * 0.12,
          life: 1.0,
          decay: 0.0018 + Math.random() * 0.0018,
          tipo: 'lluvia',
          hue: 338 + Math.random() * 22,
          sat: 82 + Math.random() * 12,
          light: 48 + Math.random() * 18
        });
      }, delay);
    }
  }

  emitir(x, y, cantidad = 2) {
    for (let i = 0; i < cantidad; i++) {
      this.particulas.push({
        x, y,
        vx: (Math.random() - 0.5) * 3.5,
        vy: -1.5 - Math.random() * 2.5,
        size: 5 + Math.random() * 9,
        rotation: Math.random() * Math.PI * 2,
        rotSpeed: (Math.random() - 0.5) * 0.15,
        opacity: 0.7 + Math.random() * 0.3,
        life: 1.0,
        decay: 0.008 + Math.random() * 0.012,
        hue: 330 + Math.random() * 30
      });
    }
  }

  animar() {
    if (!this.activo || !this.ctx) return;

    const ctx = this.ctx;
    ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);

    for (let i = this.particulas.length - 1; i >= 0; i--) {
      const p = this.particulas[i];

      if (p.tipo === 'lluvia') {
        p.x += p.vx + Math.sin(performance.now() * p.swaySpeed + i) * p.swayAmp;
        p.y += p.vy;
        p.rotation += p.rotSpeed;
        p.flip += p.flipSpeed;
        p.life -= p.decay;

        if (p.y > window.innerHeight + 50 || p.life <= 0) {
          this.particulas.splice(i, 1);
          continue;
        }

        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rotation);
        const scaleY = Math.cos(p.flip);
        ctx.scale(1.0, scaleY);
        ctx.globalAlpha = Math.min(1.0, p.life * 1.4) * p.opacity;

        const s = p.size;
        ctx.beginPath();
        ctx.moveTo(0, -s * 0.85);
        ctx.bezierCurveTo(s * 0.75, -s * 0.7, s * 0.95, s * 0.35, 0, s * 0.95);
        ctx.bezierCurveTo(-s * 0.95, s * 0.35, -s * 0.75, -s * 0.7, 0, -s * 0.85);

        const grad = ctx.createRadialGradient(-s * 0.15, -s * 0.25, s * 0.1, 0, 0, s);
        grad.addColorStop(0, `hsla(${p.hue}, ${p.sat}%, ${p.light + 16}%, 0.95)`);
        grad.addColorStop(0.55, `hsla(${p.hue}, ${p.sat}%, ${p.light}%, 0.90)`);
        grad.addColorStop(1, `hsla(${p.hue}, ${p.sat + 8}%, ${Math.max(15, p.light - 22)}%, 0.85)`);

        ctx.fillStyle = grad;
        ctx.shadowColor = `rgba(180, 20, 60, 0.35)`;
        ctx.shadowBlur = 6;
        ctx.fill();
        ctx.restore();
      } else {
        p.x += p.vx;
        p.y += p.vy;
        p.vy += 0.04;
        p.vx += Math.sin(performance.now() * 0.003 + i) * 0.08;
        p.rotation += p.rotSpeed;
        p.life -= p.decay;

        if (p.life <= 0) {
          this.particulas.splice(i, 1);
          continue;
        }

        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rotation);
        ctx.globalAlpha = p.life * p.opacity;

        ctx.beginPath();
        ctx.ellipse(0, 0, p.size, p.size * 0.6, 0, 0, Math.PI * 2);
        const grad = ctx.createRadialGradient(0, 0, 0, 0, 0, p.size);
        grad.addColorStop(0, `hsla(${p.hue}, 75%, 65%, 0.9)`);
        grad.addColorStop(1, `hsla(${p.hue}, 85%, 40%, 0)`);
        ctx.fillStyle = grad;
        ctx.fill();
        ctx.restore();
      }
    }

    this.rafId = requestAnimationFrame(() => this.animar());
  }

  detener() {
    this.activo = false;
    if (this.rafId) cancelAnimationFrame(this.rafId);
  }
}

// ─────────────────────────────────────────────────────────
// 6. SONIDOS TÁCTILES (WebAudio micro-sounds)
// ─────────────────────────────────────────────────────────
export class SonidosTactiles {
  constructor() {
    this.ctx = null;
    this.inicializado = false;
  }

  inicializar() {
    try {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (AC) {
        this.ctx = new AC();
        this.inicializado = true;
      }
    } catch (e) {
      console.warn('SonidosTactiles: WebAudio no disponible');
    }
  }

  _resumeIfNeeded() {
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  /** Whoosh suave al cambiar capítulo */
  whoosh() {
    if (!this.inicializado) return;
    this._resumeIfNeeded();
    try {
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      const filter = this.ctx.createBiquadFilter();

      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(800, now);
      osc.frequency.exponentialRampToValueAtTime(200, now + 0.15);

      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(2000, now);
      filter.frequency.exponentialRampToValueAtTime(400, now + 0.12);

      gain.gain.setValueAtTime(0.0, now);
      gain.gain.linearRampToValueAtTime(0.06, now + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.18);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now);
      osc.stop(now + 0.2);
    } catch (e) {}
  }

  /** Campanita cristalina al abrir recuerdo */
  campanita() {
    if (!this.inicializado) return;
    this._resumeIfNeeded();
    try {
      const now = this.ctx.currentTime;
      const notas = [1568, 2093, 2637]; // G6, C7, E7

      notas.forEach((freq, idx) => {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now + idx * 0.06);

        gain.gain.setValueAtTime(0.0, now + idx * 0.06);
        gain.gain.linearRampToValueAtTime(0.04, now + idx * 0.06 + 0.01);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + idx * 0.06 + 0.8);

        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(now + idx * 0.06);
        osc.stop(now + idx * 0.06 + 0.9);
      });
    } catch (e) {}
  }

  /** Crujido sutil de pétalo al tocar rosa */
  crujidoPetalo() {
    if (!this.inicializado) return;
    this._resumeIfNeeded();
    try {
      const now = this.ctx.currentTime;
      // Ruido filtrado que simula un pétalo suave
      const bufferSize = this.ctx.sampleRate * 0.12;
      const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        data[i] = (Math.random() * 2 - 1) * 0.3;
      }

      const source = this.ctx.createBufferSource();
      source.buffer = buffer;

      const filter = this.ctx.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.setValueAtTime(2500, now);
      filter.Q.setValueAtTime(2.0, now);

      const gain = this.ctx.createGain();
      gain.gain.setValueAtTime(0.0, now);
      gain.gain.linearRampToValueAtTime(0.05, now + 0.01);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.1);

      source.connect(filter);
      filter.connect(gain);
      gain.connect(this.ctx.destination);

      source.start(now);
    } catch (e) {}
  }
}

// ─────────────────────────────────────────────────────────
// 7. AUTOPLAY DE CAPÍTULOS CON TIMER CIRCULAR
// ─────────────────────────────────────────────────────────
export class AutoplayCapitulos {
  constructor(onSiguiente, duracionSegundos = 12) {
    this.onSiguiente = onSiguiente;
    this.duracion = duracionSegundos;
    this.activo = false;
    this.progreso = 0;
    this.intervalId = null;
    this.boton = null;
    this.svgCircle = null;
    this.crear();
  }

  crear() {
    this.boton = document.createElement('button');
    this.boton.className = 'btn-autoplay';
    this.boton.setAttribute('aria-label', 'Lectura automática');
    this.boton.innerHTML = `
      <svg class="autoplay-ring" viewBox="0 0 36 36" aria-hidden="true">
        <circle class="autoplay-ring-bg" cx="18" cy="18" r="15.5" />
        <circle class="autoplay-ring-progress" cx="18" cy="18" r="15.5" />
      </svg>
      <span class="autoplay-icono">▶</span>
    `;

    this.boton.addEventListener('click', () => this.alternar());
    this.svgCircle = this.boton.querySelector('.autoplay-ring-progress');
  }

  montar(contenedor) {
    if (contenedor && this.boton) {
      contenedor.appendChild(this.boton);
    }
  }

  alternar() {
    if (this.activo) {
      this.detener();
    } else {
      this.iniciar();
    }
  }

  iniciar() {
    this.activo = true;
    this.progreso = 0;
    this.boton.classList.add('activo');
    this.boton.querySelector('.autoplay-icono').textContent = '⏸';
    this.actualizarAnillo(0);

    const intervaloMs = 50;
    const totalPasos = (this.duracion * 1000) / intervaloMs;
    let paso = 0;

    this.intervalId = setInterval(() => {
      paso++;
      this.progreso = paso / totalPasos;
      this.actualizarAnillo(this.progreso);

      if (paso >= totalPasos) {
        this.progreso = 0;
        paso = 0;
        this.actualizarAnillo(0);
        if (this.onSiguiente) this.onSiguiente();
      }
    }, intervaloMs);
  }

  reiniciarTimer() {
    if (!this.activo) return;
    this.detener();
    this.iniciar();
  }

  detener() {
    this.activo = false;
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
    this.progreso = 0;
    this.actualizarAnillo(0);
    if (this.boton) {
      this.boton.classList.remove('activo');
      this.boton.querySelector('.autoplay-icono').textContent = '▶';
    }
  }

  actualizarAnillo(pct) {
    if (!this.svgCircle) return;
    const circumference = 2 * Math.PI * 15.5;
    const offset = circumference * (1 - pct);
    this.svgCircle.style.strokeDasharray = `${circumference}`;
    this.svgCircle.style.strokeDashoffset = `${offset}`;
  }
}

// ─────────────────────────────────────────────────────────
// 8. PULSO VISUAL SINCRONIZADO CON BEATS DEL AUDIO
// ─────────────────────────────────────────────────────────
export class SincronizadorBeats {
  constructor(audioElement) {
    this.audioElement = audioElement;
    this.ctx = null;
    this.analyser = null;
    this.source = null;
    this.dataArray = null;
    this.conectado = false;
    this.intensidad = 0;
    this.rafId = null;
    this.callbacks = [];
  }

  conectar() {
    if (this.conectado || !this.audioElement) return;

    try {
      const AC = window.AudioContext || window.webkitAudioContext;
      this.ctx = new AC();

      this.analyser = this.ctx.createAnalyser();
      this.analyser.fftSize = 256;
      this.analyser.smoothingTimeConstant = 0.82;

      this.source = this.ctx.createMediaElementSource(this.audioElement);
      this.source.connect(this.analyser);
      this.analyser.connect(this.ctx.destination);

      this.dataArray = new Uint8Array(this.analyser.frequencyBinCount);
      this.conectado = true;

      this.analizar();
    } catch (e) {
      console.warn('SincronizadorBeats: no se pudo conectar:', e);
    }
  }

  onBeat(callback) {
    this.callbacks.push(callback);
  }

  analizar() {
    if (!this.conectado || !this.analyser) return;

    this.analyser.getByteFrequencyData(this.dataArray);

    // Promediar las frecuencias bajas (bass) para detectar beats
    let sum = 0;
    const bassRange = 12; // Primeras 12 bandas ≈ 0-500Hz
    for (let i = 0; i < bassRange; i++) {
      sum += this.dataArray[i];
    }
    this.intensidad = sum / (bassRange * 255);

    // Promediar frecuencias medias para el bloom general
    let midSum = 0;
    for (let i = 12; i < 40; i++) {
      midSum += this.dataArray[i];
    }
    const midIntensidad = midSum / (28 * 255);

    const combinada = this.intensidad * 0.7 + midIntensidad * 0.3;

    this.callbacks.forEach(cb => cb(combinada, this.intensidad));

    this.rafId = requestAnimationFrame(() => this.analizar());
  }

  detener() {
    if (this.rafId) cancelAnimationFrame(this.rafId);
    this.conectado = false;
  }
}

// ─────────────────────────────────────────────────────────
// 9. TRANSICIÓN FINAL ENVOLVENTE
// ─────────────────────────────────────────────────────────
export class TransicionFinal {
  constructor(escenaRosas, onComplete) {
    this.escenaRosas = escenaRosas;
    this.onComplete = onComplete;
    this.overlay = null;
  }

  ejecutar() {
    // 1. Todas las rosas brillan simultáneamente
    if (this.escenaRosas) {
      this.escenaRosas.rosas.forEach((item, idx) => {
        setTimeout(() => {
          this.escenaRosas.iluminarRosa(idx);
        }, idx * 150);
      });

      // Lluvia intensa de pétalos dorados
      setTimeout(() => {
        this.escenaRosas.soltarPetalos(25);
      }, 800);
      setTimeout(() => {
        this.escenaRosas.soltarPetalos(20);
      }, 1600);
    }

    // 2. Crear overlay de luz celestial
    this.overlay = document.createElement('div');
    this.overlay.className = 'transicion-final-overlay';
    this.overlay.setAttribute('aria-hidden', 'true');
    this.overlay.innerHTML = `
      <div class="final-mensaje-container">
        <p class="final-sub">Para siempre en mi corazón</p>
        <h2 class="final-nombre">Yohandry</h2>
        <div class="final-corazon-animado">❤️</div>
        <p class="final-cierre">Con todo mi amor — David</p>
      </div>
    `;

    document.body.appendChild(this.overlay);

    // Aparecer con efecto de luz celestial después de 2.5s
    setTimeout(() => {
      this.overlay.classList.add('visible');
    }, 2500);

    // Al terminar: callback
    setTimeout(() => {
      if (this.onComplete) this.onComplete();
    }, 8000);
  }

  ocultar() {
    if (this.overlay) {
      this.overlay.classList.remove('visible');
      setTimeout(() => {
        if (this.overlay && this.overlay.parentNode) {
          this.overlay.remove();
        }
      }, 1000);
    }
  }
}
