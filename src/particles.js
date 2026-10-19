/**
 * particles.js — Corazones flotantes en canvas 2D
 *
 * Capa decorativa ligera independiente del bucle WebGL.
 * Los corazones son todos distintos en tamaño, color y velocidad.
 */
import { CONFIG } from './carta.js';

// Paleta de colores para los corazones
const COLORES_CORAZONES = [
  'rgba(200, 80, 192, ',   // magenta
  'rgba(155, 89, 182, ',   // morado
  'rgba(220, 60, 160, ',   // rosa caliente
  'rgba(180, 100, 220, ',  // lila
  'rgba(240, 80, 140, ',   // rosa fuerte
  'rgba(130, 60, 200, ',   // violeta
];

/**
 * Dibuja un corazón en el canvas usando path2D
 * @param {CanvasRenderingContext2D} ctx
 * @param {number} x - centro X
 * @param {number} y - centro Y
 * @param {number} tam - tamaño (radio aprox.)
 */
function dibujarCorazon(ctx, x, y, tam) {
  ctx.save();
  ctx.translate(x, y);
  ctx.beginPath();
  // Corazón paramétrico escalado
  const k = tam * 0.5;
  ctx.moveTo(0, -k * 0.5);
  ctx.bezierCurveTo( k,      -k * 1.5,  k * 2,  k * 0.2,  0,       k * 1.2);
  ctx.bezierCurveTo(-k * 2,  k * 0.2,  -k,     -k * 1.5,  0,      -k * 0.5);
  ctx.closePath();
  ctx.restore();
}

class Corazon {
  constructor(w, h, maxCorazones) {
    this.w = w;
    this.h = h;
    this.reiniciar(true);
  }

  reiniciar(inicial = false) {
    const tam = 4 + Math.random() * 22;
    this.x    = Math.random() * this.w;
    this.y    = inicial ? Math.random() * this.h : this.h + tam + 10;
    this.tam  = tam;

    // Velocidades distintas para sensación de profundidad
    this.vy    = -(0.15 + Math.random() * 0.55);    // sube lentamente
    this.vx    = (Math.random() - 0.5) * 0.3;       // deriva lateral suave
    this.alpha = 0.15 + Math.random() * 0.55;
    this.angulo = Math.random() * Math.PI * 2;
    this.velocidadRotacion = (Math.random() - 0.5) * 0.012;

    // Pulso
    this.fasePulso    = Math.random() * Math.PI * 2;
    this.velocidadPulso = 0.008 + Math.random() * 0.012;

    // Color
    const base = COLORES_CORAZONES[Math.floor(Math.random() * COLORES_CORAZONES.length)];
    this.color = base;
  }

  actualizar() {
    this.y      += this.vy;
    this.x      += this.vx;
    this.angulo += this.velocidadRotacion;
    this.fasePulso += this.velocidadPulso;

    // Al salir por arriba, reiniciar desde abajo
    if (this.y < -this.tam * 2) {
      this.reiniciar(false);
    }
  }

  dibujar(ctx) {
    const pulso = 1 + Math.sin(this.fasePulso) * 0.08;
    const t = this.tam * pulso;

    ctx.save();
    ctx.translate(this.x, this.y);
    ctx.rotate(this.angulo);

    ctx.globalAlpha = this.alpha;
    ctx.fillStyle   = this.color + '1)';

    // Borde muy sutil
    ctx.shadowColor  = this.color + '0.4)';
    ctx.shadowBlur   = t * 1.5;

    dibujarCorazon(ctx, 0, 0, t);
    ctx.fill();

    // Destello interior pequeño
    ctx.globalAlpha = this.alpha * 0.35;
    ctx.fillStyle   = 'rgba(255, 200, 255, 1)';
    dibujarCorazon(ctx, -t * 0.2, -t * 0.25, t * 0.35);
    ctx.fill();

    ctx.restore();
  }
}

export class SistemaCorazones {
  /**
   * @param {HTMLCanvasElement} canvas
   * @param {number} cantidad - número de corazones
   */
  constructor(canvas, cantidad) {
    this.canvas = canvas;
    this.ctx    = canvas.getContext('2d');
    this.corazones = [];
    this._raf   = null;
    this._activo = false;
    this._reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    this._redimensionar();
    this._crearCorazones(cantidad);

    // Escuchar cambios de tamaño
    const ro = new ResizeObserver(() => this._redimensionar());
    ro.observe(canvas.parentElement || document.body);
    window.addEventListener('resize', () => this._redimensionar());
  }

  _redimensionar() {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const w   = this.canvas.offsetWidth  || window.innerWidth;
    const h   = this.canvas.offsetHeight || window.innerHeight;
    this.canvas.width  = w * dpr;
    this.canvas.height = h * dpr;
    this.ctx.scale(dpr, dpr);
    this._w = w;
    this._h = h;

    // Actualizar límites de corazones existentes
    this.corazones.forEach(c => { c.w = w; c.h = h; });
  }

  _crearCorazones(n) {
    this.corazones = [];
    for (let i = 0; i < n; i++) {
      this.corazones.push(new Corazon(this._w, this._h));
    }
  }

  setCantidad(n) {
    // Ajuste dinámico de cantidad (para calidad adaptativa)
    const diff = n - this.corazones.length;
    if (diff > 0) {
      for (let i = 0; i < diff; i++) {
        this.corazones.push(new Corazon(this._w, this._h));
      }
    } else if (diff < 0) {
      this.corazones.splice(n);
    }
  }

  iniciar() {
    if (this._activo) return;
    this._activo = true;
    this._bucle();
  }

  _bucle() {
    if (!this._activo) return;
    const ctx = this.ctx;

    ctx.clearRect(0, 0, this._w, this._h);

    if (!this._reducedMotion) {
      this.corazones.forEach(c => {
        c.actualizar();
        c.dibujar(ctx);
      });
    } else {
      // Sin movimiento: solo dibuja una vez, estáticos
      this.corazones.forEach(c => c.dibujar(ctx));
    }

    this._raf = requestAnimationFrame(() => this._bucle());
  }

  detener() {
    this._activo = false;
    if (this._raf) cancelAnimationFrame(this._raf);
  }
}
