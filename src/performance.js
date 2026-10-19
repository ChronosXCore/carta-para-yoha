/**
 * performance.js — Monitor de FPS y sistema de calidad adaptativa
 *
 * Detecta la capacidad del dispositivo y ajusta automáticamente:
 * - Pixel ratio del renderer
 * - Número de pétalos sueltos
 * - Número de corazones 2D
 * - Nivel de detalle de geometrías
 */
import { CONFIG } from './carta.js';

// Niveles de calidad
export const NIVEL = {
  ALTO:  'alto',
  MEDIO: 'medio',
  BAJO:  'bajo',
};

export class MonitorRendimiento {
  constructor(onCambioNivel) {
    this.nivel          = NIVEL.ALTO;
    this.onCambioNivel  = onCambioNivel; // callback(nivelAnterior, nivelNuevo)
    this.fps            = 60;
    this._muestras      = [];
    this._ultimoTick    = 0;
    this._frameCount    = 0;
    this._ultImpulso    = 0;
    this._activo        = true;

    const rendimiento = (CONFIG && CONFIG.rendimiento) || { fpsMin: 36, fpsObjetivo: 55, intervaloMs: 1500 };
    this._fpsMin      = rendimiento.fpsMin ?? 36;
    this._fpsObj      = rendimiento.fpsObjetivo ?? 55;
    this._intervalo   = rendimiento.intervaloMs ?? 1500;

    // Detectar capacidades del dispositivo al inicio
    this._detectarDispositivo();
  }

  /** Heurística inicial: si es un móvil o una GPU débil, comenzar en calidad media */
  _detectarDispositivo() {
    const ua = navigator.userAgent;
    const esMovil = /iPhone|iPad|Android/i.test(ua);
    const memoriaGPU = navigator.deviceMemory || 4; // GB

    if (esMovil && memoriaGPU <= 2) {
      this.nivel = NIVEL.BAJO;
    } else if (esMovil) {
      this.nivel = NIVEL.MEDIO;
    } else {
      this.nivel = NIVEL.ALTO;
    }

    // prefers-reduced-motion → siempre baja calidad
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      this.nivel = NIVEL.BAJO;
    }
  }

  /**
   * Llama a este método cada frame con el timestamp de requestAnimationFrame
   */
  tick(ahora) {
    if (!this._activo) return;

    if (this._ultimoTick === 0) {
      this._ultimoTick = ahora;
      this._frameCount = 0;
      return;
    }

    this._frameCount++;
    const delta = ahora - this._ultimoTick;

    if (delta >= this._intervalo) {
      this.fps = Math.round((this._frameCount * 1000) / delta);
      this._frameCount = 0;
      this._ultimoTick = ahora;
      this._evaluarCalidad(ahora);
    }
  }

  _evaluarCalidad(ahora) {
    const { ALTO, MEDIO, BAJO } = NIVEL;
    const cooldown = 5000; // ms entre ajustes para evitar oscilación

    if (ahora - this._ultImpulso < cooldown) return;

    if (this.fps < this._fpsMin) {
      // Degradar calidad
      if (this.nivel === ALTO) {
        this._cambiarNivel(MEDIO);
      } else if (this.nivel === MEDIO) {
        this._cambiarNivel(BAJO);
      }
    } else if (this.fps > this._fpsObj + 10) {
      // Mejorar calidad (solo si llevamos tiempo estable)
      if (this.nivel === BAJO) {
        this._cambiarNivel(MEDIO);
      }
      // No subimos de MEDIO a ALTO automáticamente para no sobre-exigir en móvil
    }
  }

  _cambiarNivel(nuevoNivel) {
    const anterior = this.nivel;
    this.nivel      = nuevoNivel;
    this._ultImpulso = performance.now();
    console.info(`[Rendimiento] ${anterior} → ${nuevoNivel} (${this.fps} fps)`);
    if (this.onCambioNivel) this.onCambioNivel(anterior, nuevoNivel);
  }

  /** Parámetros actuales según el nivel de calidad */
  get params() {
    const base = CONFIG.calidad;
    switch (this.nivel) {
      case NIVEL.ALTO:
        return {
          pixelRatio:       Math.min(window.devicePixelRatio, base.pixelRatioMax),
          petalos:          base.petalosMaximos,
          corazones:        base.corazonesCanvas,
          detalle:          1.0,
          sombras:          base.sombras,
        };
      case NIVEL.MEDIO:
        return {
          pixelRatio:       Math.min(window.devicePixelRatio, 1.5),
          petalos:          Math.floor(base.petalosMaximos * 0.5),
          corazones:        Math.floor(base.corazonesCanvas * 0.6),
          detalle:          0.65,
          sombras:          false,
        };
      case NIVEL.BAJO:
        return {
          pixelRatio:       1,
          petalos:          10,
          corazones:        15,
          detalle:          0.4,
          sombras:          false,
        };
    }
  }

  pausar()   { this._activo = false; }
  reanudar() { this._activo = true; this._ultimoTick = performance.now(); this._frameCount = 0; }
}
