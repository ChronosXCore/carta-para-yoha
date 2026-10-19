/**
 * intro.js — Intro cinematográfica cósmica: Galaxia, Yohandry, Te amo & Corazón de partículas
 * 
 * Flujo:
 * 1. 0.0s – 3.8s: Formación de la galaxia espiral tridimensional a partir del cosmos.
 * 2. 4.0s – 8.2s: Las estrellas de la galaxia se condensan para trazar el nombre "Yohandry"
 *                 en constelación dorada con acorde etéreo WebAudio.
 * 3. 8.2s – 12.8s: Las partículas forman un corazón tridimensional perfecto palpitante con las palabras
 *                  "Te amo" en estrellas brillantes y latidos rítmicos.
 * 4. 12.8s – 14.5s: El corazón reúne energía y estalla en una supernova cósmica de miles de
 *                   partículas y chispas radiantes.
 * 5. 14.5s – 15.6s: Transición fluida donde la luz se disuelve para revelar el ramo de rosas y la carta.
 */

import * as THREE from 'three';
import gsap from 'gsap';

export class IntroCinematica {
  constructor(canvas, onComplete, opciones = {}) {
    this.canvas = canvas;
    this.onComplete = onComplete;
    this.opciones = opciones;

    this.numParticulas = 24000;
    this.tiempo = 0;
    this.saltada = false;
    this.finalizada = false;
    this.audioCtx = null;

    this.initRenderer();
    this.initAudioContext();
    this.initParticulas();
    this.crearTimeline();
    this._onResizeBound = this.onResize.bind(this);
    window.addEventListener('resize', this._onResizeBound);
  }

  initRenderer() {
    this.renderer = new THREE.WebGLRenderer({
      canvas: this.canvas,
      antialias: true,
      alpha: false,
      powerPreference: 'high-performance'
    });

    const dpr = Math.min(window.devicePixelRatio || 1, 1.75);
    this.renderer.setPixelRatio(dpr);
    this.renderer.setSize(window.innerWidth, window.innerHeight);

    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x050108);

    this.camera = new THREE.PerspectiveCamera(50, window.innerWidth / window.innerHeight, 0.1, 100);
    this.camera.position.set(0, 1.8, 4.8);
    this.camera.lookAt(0, 0, 0);

    // Niebla tenue ambiental
    this.scene.fog = new THREE.FogExp2(0x050108, 0.04);
  }

  initAudioContext() {
    try {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (AudioContext) {
        this.audioCtx = new AudioContext();
      }
    } catch (e) {
      console.warn('WebAudio no disponible:', e);
    }
  }

  tocarAcordeNombre() {
    if (!this.audioCtx) return;
    try {
      if (this.audioCtx.state === 'suspended') {
        this.audioCtx.resume();
      }

      // Acorde cinematográfico D maj 9 (D3, A3, F#4, C#5, E5) cálido y resonante
      const notas = [146.83, 220.00, 369.99, 554.37, 659.25];
      const now = this.audioCtx.currentTime;

      const masterGain = this.audioCtx.createGain();
      masterGain.gain.setValueAtTime(0.001, now);
      masterGain.gain.linearRampToValueAtTime(0.18, now + 1.2);
      masterGain.gain.exponentialRampToValueAtTime(0.0001, now + 6.0);
      masterGain.connect(this.audioCtx.destination);

      const filter = this.audioCtx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(800, now);
      filter.frequency.linearRampToValueAtTime(1400, now + 2.0);
      filter.connect(masterGain);

      notas.forEach((freq, idx) => {
        const osc = this.audioCtx.createOscillator();
        osc.type = idx % 2 === 0 ? 'sine' : 'triangle';
        osc.frequency.setValueAtTime(freq, now);

        const oscGain = this.audioCtx.createGain();
        oscGain.gain.setValueAtTime(0.25 / notas.length, now);
        osc.connect(oscGain);
        oscGain.connect(filter);

        osc.start(now + idx * 0.08);
        osc.stop(now + 6.5);
      });
    } catch (err) {
      console.warn('Error al tocar acorde:', err);
    }
  }

  tocarLatido() {
    if (!this.audioCtx) return;
    try {
      if (this.audioCtx.state === 'suspended') {
        this.audioCtx.resume();
      }
      const now = this.audioCtx.currentTime;
      // Doble pulso cálido 'lub-dub'
      [0, 0.2].forEach((offset, idx) => {
        const osc = this.audioCtx.createOscillator();
        const gain = this.audioCtx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(idx === 0 ? 56 : 48, now + offset);
        osc.frequency.exponentialRampToValueAtTime(28, now + offset + 0.16);

        gain.gain.setValueAtTime(0.001, now + offset);
        gain.gain.linearRampToValueAtTime(0.12, now + offset + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + offset + 0.2);

        osc.connect(gain);
        gain.connect(this.audioCtx.destination);
        osc.start(now + offset);
        osc.stop(now + offset + 0.24);
      });
    } catch (e) {}
  }

  tocarExplosionCosmica() {
    if (!this.audioCtx) return;
    try {
      if (this.audioCtx.state === 'suspended') {
        this.audioCtx.resume();
      }
      const now = this.audioCtx.currentTime;

      // 1. Impacto grave cálido y etéreo (sub-bass suave)
      const subOsc = this.audioCtx.createOscillator();
      const subGain = this.audioCtx.createGain();
      subOsc.type = 'sine';
      subOsc.frequency.setValueAtTime(95, now);
      subOsc.frequency.exponentialRampToValueAtTime(26, now + 1.4);
      subGain.gain.setValueAtTime(0.24, now);
      subGain.gain.exponentialRampToValueAtTime(0.0001, now + 1.8);
      subOsc.connect(subGain);
      subGain.connect(this.audioCtx.destination);
      subOsc.start(now);
      subOsc.stop(now + 2.0);

      // 2. Chime en cascada de destellos cristalinos
      const frecuencias = [523.25, 659.25, 783.99, 1046.50, 1318.51, 1567.98];
      frecuencias.forEach((freq, idx) => {
        const osc = this.audioCtx.createOscillator();
        const gain = this.audioCtx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now + idx * 0.04);
        gain.gain.setValueAtTime(0.001, now + idx * 0.04);
        gain.gain.linearRampToValueAtTime(0.06 / frecuencias.length, now + idx * 0.04 + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + idx * 0.04 + 1.6);
        osc.connect(gain);
        gain.connect(this.audioCtx.destination);
        osc.start(now + idx * 0.04);
        osc.stop(now + idx * 0.04 + 1.8);
      });
    } catch (e) {}
  }

  initParticulas() {
    // 1. Sprite circular suave con caída exponencial
    const spriteCanvas = document.createElement('canvas');
    spriteCanvas.width = 64;
    spriteCanvas.height = 64;
    const sCtx = spriteCanvas.getContext('2d');
    const grad = sCtx.createRadialGradient(32, 32, 0, 32, 32, 30);
    grad.addColorStop(0, 'rgba(255, 255, 255, 1.0)');
    grad.addColorStop(0.35, 'rgba(255, 225, 140, 0.85)');
    grad.addColorStop(0.7, 'rgba(215, 90, 160, 0.35)');
    grad.addColorStop(1, 'rgba(0, 0, 0, 0)');
    sCtx.fillStyle = grad;
    sCtx.fillRect(0, 0, 64, 64);
    const spriteTex = new THREE.CanvasTexture(spriteCanvas);

    // 2. Buffer Geometry de morphing
    const geom = new THREE.BufferGeometry();
    const count = this.numParticulas;

    const pos = new Float32Array(count * 3);
    const aTo = new Float32Array(count * 3);
    const aColorFrom = new Float32Array(count * 3);
    const aColorTo = new Float32Array(count * 3);
    const aPart = new Float32Array(count);
    const aSeed = new Float32Array(count);

    for (let i = 0; i < count; i++) {
      aSeed[i] = Math.random() * 100.0;
    }

    geom.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    geom.setAttribute('aTo', new THREE.BufferAttribute(aTo, 3));
    geom.setAttribute('aColorFrom', new THREE.BufferAttribute(aColorFrom, 3));
    geom.setAttribute('aColorTo', new THREE.BufferAttribute(aColorTo, 3));
    geom.setAttribute('aPart', new THREE.BufferAttribute(aPart, 1));
    geom.setAttribute('aSeed', new THREE.BufferAttribute(aSeed, 1));

    // Shader Material propio con blending aditivo y sin depthWrite
    this.uniforms = {
      uTime: { value: 0 },
      uT: { value: 0 },
      uHeartGlow: { value: 1.0 },
      uExplosion: { value: 0.0 },
      uPointSize: { value: 20.0 * (window.devicePixelRatio || 1) },
      uOpacity: { value: 1.0 },
      uMap: { value: spriteTex }
    };

    const vertShader = `
      uniform float uTime;
      uniform float uT;
      uniform float uHeartGlow;
      uniform float uExplosion;
      uniform float uPointSize;

      attribute vec3 aTo;
      attribute vec3 aColorFrom;
      attribute vec3 aColorTo;
      attribute float aPart;
      attribute float aSeed;

      varying vec3 vColor;
      varying float vAlpha;

      // Pseudo curl noise simple para trayectorias curvadas
      vec3 curlCurve(vec3 p, float t) {
        float s = sin(t * 3.14159265);
        float nx = sin(p.y * 1.5 + t * 4.0 + aSeed) * 0.45;
        float ny = cos(p.x * 1.5 + t * 3.5 + aSeed * 1.2) * 0.35;
        float nz = sin(p.z * 1.5 + t * 4.2 + aSeed * 0.8) * 0.45;
        return vec3(nx, ny, nz) * s;
      }

      void main() {
        float easeT = smoothstep(0.0, 1.0, uT);
        vec3 p = mix(position, aTo, easeT);

        // Añadir desplazamiento curvado orgánico durante la transición
        p += curlCurve(p, uT);

        // Rotación diferencial en la galaxia espiral (aPart == 6.0)
        if (aPart == 6.0) {
          float dist = length(p.xz);
          float ang = uTime * (0.32 / (0.45 + dist * 0.32));
          float cosA = cos(ang);
          float sinA = sin(ang);
          p.xz = mat2(cosA, -sinA, sinA, cosA) * p.xz;
        }

        // Latido rítmico del corazón y de "Te amo" (aPart == 8.0 o 9.0)
        if (aPart == 8.0 || aPart == 9.0) {
          float beatCycle = mod(uTime * 1.25, 1.0);
          float beat1 = smoothstep(0.0, 0.07, beatCycle) * smoothstep(0.16, 0.07, beatCycle);
          float beat2 = smoothstep(0.14, 0.22, beatCycle) * smoothstep(0.32, 0.22, beatCycle) * 0.65;
          float beat = (beat1 + beat2) * uHeartGlow;
          p.xy *= 1.0 + beat * 0.085;
          p.z *= 1.0 + beat * 0.14;
        }

        vec3 col = mix(aColorFrom, aColorTo, easeT);

        // Pulsación de brillo en el corazón
        if (aPart == 8.0 || aPart == 9.0) {
          float beatCycle = mod(uTime * 1.25, 1.0);
          float beat = (smoothstep(0.0, 0.1, beatCycle) * smoothstep(0.25, 0.1, beatCycle)) * uHeartGlow;
          col += vec3(0.4, 0.12, 0.25) * beat;
        }

        // Explosión de partículas cósmica en supernova
        if (uExplosion > 0.001) {
          vec3 center = vec3(0.0, 0.0, 0.0);
          vec3 fromCenter = p - center;
          vec3 rndDir = vec3(sin(aSeed * 23.1 + uTime), cos(aSeed * 17.5 + uTime), sin(aSeed * 31.3));
          vec3 explodeDir = normalize(fromCenter + rndDir * 0.35);
          float speed = 1.8 + fract(aSeed * 53.1) * 3.2;
          p += explodeDir * (pow(uExplosion, 0.8) * speed);

          // Chispazo de luz inicial durante el estallido
          float flash = smoothstep(0.0, 0.08, uExplosion) * smoothstep(0.40, 0.08, uExplosion) * 2.8;
          col += vec3(1.1, 1.0, 0.85) * flash;
        }

        vColor = col;

        // Alpha y desvanecimiento progresivo en la explosión
        float alpha = 1.0;
        if (uExplosion > 0.001) {
          alpha = max(0.0, 1.0 - pow(uExplosion, 1.6));
        }
        vAlpha = alpha;

        vec4 mvPosition = modelViewMatrix * vec4(p, 1.0);
        gl_Position = projectionMatrix * mvPosition;

        // Tamaño de punto: las letras se ven nítidas y elegantes
        float sizeFactor = (aPart == 7.0 || aPart == 9.0) ? 0.78 : ((aPart == 8.0) ? 0.95 : 0.82);
        float sparkle = (0.75 + 0.45 * sin(aSeed + uTime * 3.0));
        float expScale = (1.0 + smoothstep(0.0, 0.15, uExplosion) * 1.5 - uExplosion * 0.4);
        gl_PointSize = (uPointSize * sizeFactor / -mvPosition.z) * sparkle * expScale;
      }
    `;

    const fragShader = `
      uniform sampler2D uMap;
      uniform float uOpacity;
      varying vec3 vColor;
      varying float vAlpha;

      void main() {
        vec4 tex = texture2D(uMap, gl_PointCoord);
        if (tex.a < 0.02) discard;

        float a = tex.a * vAlpha * uOpacity;
        gl_FragColor = vec4(vColor * 1.35, a);
      }
    `;

    this.material = new THREE.ShaderMaterial({
      uniforms: this.uniforms,
      vertexShader: vertShader,
      fragmentShader: fragShader,
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false
    });

    this.puntosMesh = new THREE.Points(geom, this.material);
    this.scene.add(this.puntosMesh);

    // Formas de la narrativa
    this.formas = {
      cosmosInicial: this.generarCosmosInicial(),
      galaxia: this.generarGalaxia(),
      nombre: this.generarNombreYohandry(),
      corazonTeAmo: this.generarCorazonTeAmo()
    };

    // Comenzar desde el cosmos disperso
    this.aplicarFormaInmediata(this.formas.cosmosInicial);
  }

  // ─────────────────────────────────────────────────────────────
  // GENERADORES DE FORMAS DE PARTÍCULAS
  // ─────────────────────────────────────────────────────────────

  generarCosmosInicial() {
    const count = this.numParticulas;
    const pos = new Float32Array(count * 3);
    const col = new Float32Array(count * 3);
    const parts = new Float32Array(count);

    for (let i = 0; i < count; i++) {
      const r = 0.6 + Math.pow(Math.random(), 0.7) * 4.4;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);

      pos[i * 3]     = r * Math.sin(phi) * Math.cos(theta);
      pos[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta) * 0.6;
      pos[i * 3 + 2] = r * Math.cos(phi) * 1.4;

      const rnd = Math.random();
      if (rnd < 0.3) {
        col[i * 3]     = 1.0;
        col[i * 3 + 1] = 0.85;
        col[i * 3 + 2] = 0.35; // Dorado estelar
      } else if (rnd < 0.7) {
        col[i * 3]     = 0.55;
        col[i * 3 + 1] = 0.20;
        col[i * 3 + 2] = 0.80; // Violeta cósmico
      } else {
        col[i * 3]     = 0.25;
        col[i * 3 + 1] = 0.40;
        col[i * 3 + 2] = 0.95; // Azul estelar profundo
      }
      parts[i] = 6.0;
    }

    return { pos, col, parts };
  }

  generarGalaxia() {
    const count = this.numParticulas;
    const pos = new Float32Array(count * 3);
    const col = new Float32Array(count * 3);
    const parts = new Float32Array(count);

    const brazos = 3;
    const radioMax = 4.2;

    for (let i = 0; i < count; i++) {
      const r = Math.pow(Math.random(), 1.5) * radioMax;
      const armIndex = i % brazos;
      const spinAngle = r * 1.6;
      const armAngle = (armIndex / brazos) * Math.PI * 2.0;
      const totalAngle = armAngle + spinAngle + (Math.random() - 0.5) * 0.40;

      const spread = (Math.random() - 0.5) * (0.28 + r * 0.18);
      const x = (r + spread) * Math.cos(totalAngle);
      const z = (r + spread) * Math.sin(totalAngle);
      // Centrada verticalmente en y = 0
      const y = (Math.random() - 0.5) * (0.45 * Math.exp(-r * 0.4));

      pos[i * 3]     = x;
      pos[i * 3 + 1] = y;
      pos[i * 3 + 2] = z;

      // Centro dorado resplandeciente -> brazos violetas y fucsia
      const centerFactor = Math.max(0.0, 1.0 - r / radioMax);
      col[i * 3]     = 1.0 * centerFactor + 0.70 * (1.0 - centerFactor);
      col[i * 3 + 1] = 0.90 * centerFactor + 0.22 * (1.0 - centerFactor);
      col[i * 3 + 2] = 0.40 * centerFactor + 0.92 * (1.0 - centerFactor);
      parts[i] = 6.0;
    }

    return { pos, col, parts };
  }

  generarNombreYohandry() {
    const count = this.numParticulas;
    const pos = new Float32Array(count * 3);
    const col = new Float32Array(count * 3);
    const parts = new Float32Array(count);

    const canvas = document.createElement('canvas');
    canvas.width = 1200;
    canvas.height = 400;
    const ctx = canvas.getContext('2d');

    ctx.fillStyle = '#000000';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.font = 'italic 130px "Cormorant Garamond", Georgia, serif';
    ctx.lineWidth = 4.5;
    ctx.strokeStyle = '#ffffff';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.strokeText('Yohandry', canvas.width / 2, canvas.height / 2);

    const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height).data;

    let minX = canvas.width, maxX = 0, minY = canvas.height, maxY = 0;
    for (let y = 0; y < canvas.height; y++) {
      for (let x = 0; x < canvas.width; x++) {
        const idx = (y * canvas.width + x) * 4;
        if (imgData[idx] > 100) {
          if (x < minX) minX = x;
          if (x > maxX) maxX = x;
          if (y < minY) minY = y;
          if (y > maxY) maxY = y;
        }
      }
    }

    const textWidthPx = Math.max(1, maxX - minX);
    const textHeightPx = Math.max(1, maxY - minY);
    const centerX = (minX + maxX) / 2;
    const centerY = (minY + maxY) / 2;

    const aspect = this.camera ? this.camera.aspect : 0.46;
    const targetHeight3D = (aspect < 0.8) ? 0.65 : 0.80;
    let scale = targetHeight3D / textHeightPx;
    const maxAncho3D = (aspect < 0.8) ? 2.25 : 3.60;
    if (textWidthPx * scale > maxAncho3D) {
      scale = maxAncho3D / textWidthPx;
    }

    const puntosTexto = [];
    for (let y = minY; y <= maxY; y += 2) {
      for (let x = minX; x <= maxX; x += 2) {
        const idx = (y * canvas.width + x) * 4;
        if (imgData[idx] > 120) {
          puntosTexto.push({
            x: (x - centerX) * scale,
            y: -(y - centerY) * scale, // Centrado en y = 0
            intensity: imgData[idx] / 255
          });
        }
      }
    }

    const numParticulasTexto = Math.min(count, 3500);

    for (let i = 0; i < count; i++) {
      if (puntosTexto.length > 0 && i < numParticulasTexto) {
        const pt = puntosTexto[i % puntosTexto.length];
        pos[i * 3]     = pt.x + (Math.random() - 0.5) * 0.016;
        pos[i * 3 + 1] = pt.y + (Math.random() - 0.5) * 0.016;
        pos[i * 3 + 2] = (Math.random() - 0.5) * 0.04;

        col[i * 3]     = 1.15;
        col[i * 3 + 1] = 1.05;
        col[i * 3 + 2] = 0.85; // Oro blanco estelar brillante
        parts[i]       = 7.0;  // Trazo estelar refinado
      } else {
        const r = 1.8 + Math.random() * 3.6;
        const ang = Math.random() * Math.PI * 2;
        pos[i * 3]     = r * Math.cos(ang);
        pos[i * 3 + 1] = r * Math.sin(ang) * 0.75;
        pos[i * 3 + 2] = -0.6 + (Math.random() - 0.5) * 1.5;

        col[i * 3]     = 0.45;
        col[i * 3 + 1] = 0.22;
        col[i * 3 + 2] = 0.75; // Violeta sutil
        parts[i]       = 0.0;
      }
    }

    return { pos, col, parts };
  }

  generarCorazonTeAmo() {
    const count = this.numParticulas;
    const pos = new Float32Array(count * 3);
    const col = new Float32Array(count * 3);
    const parts = new Float32Array(count);

    // 1. Muestreo de "Te amo" con canvas offscreen en trazo cursivo fino
    const canvas = document.createElement('canvas');
    canvas.width = 1000;
    canvas.height = 400;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#000000';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.font = 'italic 125px "Cormorant Garamond", Georgia, serif';
    ctx.lineWidth = 4.2;
    ctx.strokeStyle = '#ffffff';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.strokeText('Te amo', canvas.width / 2, canvas.height / 2);

    const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height).data;
    let minX = canvas.width, maxX = 0, minY = canvas.height, maxY = 0;
    for (let y = 0; y < canvas.height; y++) {
      for (let x = 0; x < canvas.width; x++) {
        const idx = (y * canvas.width + x) * 4;
        if (imgData[idx] > 100) {
          if (x < minX) minX = x;
          if (x > maxX) maxX = x;
          if (y < minY) minY = y;
          if (y > maxY) maxY = y;
        }
      }
    }

    const textWidthPx = Math.max(1, maxX - minX);
    const textHeightPx = Math.max(1, maxY - minY);
    const centerX = (minX + maxX) / 2;
    const centerY = (minY + maxY) / 2;

    const aspect = this.camera ? this.camera.aspect : 0.46;
    const targetHeight3D = (aspect < 0.8) ? 0.38 : 0.48;
    let textScale = targetHeight3D / textHeightPx;
    const maxAncho3D = (aspect < 0.8) ? 1.55 : 2.30;
    if (textWidthPx * textScale > maxAncho3D) {
      textScale = maxAncho3D / textWidthPx;
    }

    const puntosTexto = [];
    for (let y = minY; y <= maxY; y += 2) {
      for (let x = minX; x <= maxX; x += 2) {
        const idx = (y * canvas.width + x) * 4;
        if (imgData[idx] > 120) {
          puntosTexto.push({
            x: (x - centerX) * textScale,
            y: -(y - centerY) * textScale + 0.05,
            intensity: imgData[idx] / 255
          });
        }
      }
    }

    // 2. Muestreo uniforme del corazón sin singularidades (rejection sampling uniforme)
    const heartScale = (aspect < 0.8) ? 1.25 : 1.45;
    const puntosCorazon = [];
    let intentos = 0;
    while (puntosCorazon.length < 13500 && intentos < 60000) {
      intentos++;
      // Muestrear un punto aleatorio en la caja envolvente del corazón
      const u = (Math.random() - 0.5) * 3.0; // [-1.5, 1.5]
      const v = (Math.random() - 0.5) * 2.8 + 0.05; // [-1.35, 1.45]
      const u2 = u * u;
      const v2 = v * v;
      // Ecuación implícita estándar del corazón: (x^2 + y^2 - 1)^3 - x^2 * y^3 <= 0
      const term = u2 + v2 - 1.0;
      const f = term * term * term - u2 * (v2 * v);
      if (f <= 0.0) {
        const zThickness = Math.sqrt(Math.max(0.0, -f)) * 0.35;
        const distCenter = Math.sqrt(u2 + v2);
        puntosCorazon.push({
          x: u * heartScale,
          y: v * heartScale,
          z: (Math.random() - 0.5) * zThickness,
          dist: distCenter
        });
      }
    }

    const numTexto = Math.min(count, 3000);
    const numCorazon = puntosCorazon.length;

    for (let i = 0; i < count; i++) {
      if (puntosTexto.length > 0 && i < numTexto) {
        // --- TEXTO "Te amo" (estrellas oro blanco brillante al frente) ---
        const pt = puntosTexto[i % puntosTexto.length];
        pos[i * 3]     = pt.x + (Math.random() - 0.5) * 0.015;
        pos[i * 3 + 1] = pt.y + (Math.random() - 0.5) * 0.015;
        pos[i * 3 + 2] = 0.16 + (Math.random() - 0.5) * 0.03;

        col[i * 3]     = 1.25;
        col[i * 3 + 1] = 1.15;
        col[i * 3 + 2] = 0.90;
        parts[i]       = 9.0;
      } else if (i < numTexto + numCorazon) {
        // --- VOLUMEN DEL CORAZÓN (distribución uniforme suave) ---
        const ptH = puntosCorazon[(i - numTexto) % numCorazon];
        pos[i * 3]     = ptH.x + (Math.random() - 0.5) * 0.02;
        pos[i * 3 + 1] = ptH.y + (Math.random() - 0.5) * 0.02;
        pos[i * 3 + 2] = ptH.z;

        // Degradado de terciopelo carmesí-fucsia hacia núcleo dorado
        const coreFactor = Math.max(0.0, 1.0 - ptH.dist * 0.9);
        col[i * 3]     = 1.0 * (1.0 - coreFactor) + 1.10 * coreFactor;
        col[i * 3 + 1] = 0.18 * (1.0 - coreFactor) + 0.85 * coreFactor;
        col[i * 3 + 2] = 0.44 * (1.0 - coreFactor) + 0.38 * coreFactor;
        parts[i]       = 8.0;
      } else {
        // --- AURA CÓSMICA EXTERIOR ---
        const ang = Math.random() * Math.PI * 2;
        const rad = 2.0 + Math.random() * 2.8;
        pos[i * 3]     = Math.cos(ang) * rad;
        pos[i * 3 + 1] = Math.sin(ang) * (rad * 0.78);
        pos[i * 3 + 2] = -0.3 + (Math.random() - 0.5) * 1.5;

        col[i * 3]     = 0.55;
        col[i * 3 + 1] = 0.22;
        col[i * 3 + 2] = 0.80; // Violeta místico
        parts[i]       = 0.0;
      }
    }

    return { pos, col, parts };
  }

  aplicarFormaInmediata(forma) {
    const attrPos = this.puntosMesh.geometry.attributes.position;
    const attrCol = this.puntosMesh.geometry.attributes.aColorFrom;
    const attrToCol = this.puntosMesh.geometry.attributes.aColorTo;
    const attrTo = this.puntosMesh.geometry.attributes.aTo;
    const attrPart = this.puntosMesh.geometry.attributes.aPart;

    for (let i = 0; i < this.numParticulas * 3; i++) {
      attrPos.array[i] = forma.pos[i];
      attrTo.array[i]  = forma.pos[i];
      attrCol.array[i] = forma.col[i];
      attrToCol.array[i] = forma.col[i];
    }
    for (let i = 0; i < this.numParticulas; i++) {
      attrPart.array[i] = forma.parts[i];
    }

    attrPos.needsUpdate = true;
    attrTo.needsUpdate = true;
    attrCol.needsUpdate = true;
    attrToCol.needsUpdate = true;
    attrPart.needsUpdate = true;
  }

  morphTo(formaDestino, duracion, onCompleteStep) {
    const geom = this.puntosMesh.geometry;
    const attrPos = geom.attributes.position;
    const attrTo  = geom.attributes.aTo;
    const attrColFrom = geom.attributes.aColorFrom;
    const attrColTo   = geom.attributes.aColorTo;
    const attrPart = geom.attributes.aPart;

    for (let i = 0; i < this.numParticulas * 3; i++) {
      attrPos.array[i] = attrTo.array[i];
      attrColFrom.array[i] = attrColTo.array[i];
      attrTo.array[i] = formaDestino.pos[i];
      attrColTo.array[i] = formaDestino.col[i];
    }
    for (let i = 0; i < this.numParticulas; i++) {
      attrPart.array[i] = formaDestino.parts[i];
    }

    attrPos.needsUpdate = true;
    attrTo.needsUpdate = true;
    attrColFrom.needsUpdate = true;
    attrColTo.needsUpdate = true;
    attrPart.needsUpdate = true;

    this.uniforms.uT.value = 0.0;

    return gsap.to(this.uniforms.uT, {
      value: 1.0,
      duration: duracion,
      ease: 'power2.inOut',
      onComplete: () => {
        if (onCompleteStep) onCompleteStep();
      }
    });
  }

  // ─────────────────────────────────────────────────────────────
  // TIMELINE PRINCIPAL
  // ─────────────────────────────────────────────────────────────

  crearTimeline() {
    this.timeline = gsap.timeline({
      onComplete: () => {
        this.finalizarIntro();
      }
    });

    // 0.2s – 3.2s: Prólogo poético sobre las estrellas
    const prologoEl = document.getElementById('intro-prologo');
    if (prologoEl) {
      this.timeline.fromTo(prologoEl,
        { opacity: 0, y: 18, scale: 0.95 },
        { opacity: 1, y: 0, scale: 1.0, duration: 1.4, ease: 'power2.out' },
        0.3
      );
      this.timeline.to(prologoEl,
        { opacity: 0, y: -16, scale: 1.04, duration: 0.9, ease: 'power2.in' },
        3.2
      );
    }

    // 0.2s – 3.8s: Se forma la galaxia espiral desde el cosmos
    this.timeline.add(() => {
      this.morphTo(this.formas.galaxia, 3.4);
    }, 0.2);

    this.timeline.to(this.camera.position, {
      x: 0,
      y: 1.8,
      z: 4.8,
      duration: 3.6,
      ease: 'power2.inOut',
      onUpdate: () => this.camera.lookAt(0, 0, 0)
    }, 0.0);

    // 4.0s – 8.2s: De la galaxia surge el nombre "Yohandry" con estrellas
    this.timeline.add(() => {
      this.morphTo(this.formas.nombre, 3.2, () => {
        this.tocarAcordeNombre();
      });
    }, 4.0);

    const camZNombre = (this.camera && this.camera.aspect < 0.8) ? 5.2 : 3.8;
    this.timeline.to(this.camera.position, {
      x: 0,
      y: 0.0,
      z: camZNombre,
      duration: 3.4,
      ease: 'power2.out',
      onUpdate: () => this.camera.lookAt(0, 0, 0)
    }, 4.0);

    // 8.2s – 12.8s: De "Yohandry" se forma el corazón con "Te amo"
    this.timeline.add(() => {
      this.morphTo(this.formas.corazonTeAmo, 3.0, () => {
        this.tocarLatido();
      });
    }, 8.2);

    const camZCorazon = (this.camera && this.camera.aspect < 0.8) ? 4.9 : 3.6;
    this.timeline.to(this.camera.position, {
      x: 0,
      y: 0.0,
      z: camZCorazon,
      duration: 3.0,
      ease: 'power2.out',
      onUpdate: () => this.camera.lookAt(0, 0, 0)
    }, 8.2);

    // 11.8s – 12.8s: El corazón reúne energía y brilla intensamente
    this.timeline.to(this.uniforms.uHeartGlow, {
      value: 2.8,
      duration: 1.0,
      ease: 'power2.in'
    }, 11.8);

    // 12.8s: ¡EXPLOSIÓN! de partículas en supernova
    this.timeline.add(() => {
      this.tocarExplosionCosmica();
    }, 12.8);

    this.timeline.to(this.uniforms.uExplosion, {
      value: 1.0,
      duration: 2.2,
      ease: 'power3.out'
    }, 12.8);

    // 13.8s – 15.0s: Desvanecimiento suave y transición al ramo de rosas
    this.timeline.to(this.uniforms.uOpacity, {
      value: 0.0,
      duration: 1.2,
      ease: 'power2.inOut'
    }, 13.8);

    // Soporte para saltar a tiempo arbitrario con query param ?t=
    const params = new URLSearchParams(window.location.search);
    const testTime = parseFloat(params.get('t'));
    if (!isNaN(testTime) && testTime >= 0) {
      this.saltarATiempo(testTime);
    }
  }

  saltarATiempo(t) {
    const prologoEl = document.getElementById('intro-prologo');
    if (prologoEl && t >= 3.2) {
      prologoEl.style.opacity = '0';
      prologoEl.style.display = 'none';
    }

    if (t < 4.0) {
      this.aplicarFormaInmediata(this.formas.galaxia);
      this.uniforms.uHeartGlow.value = 1.0;
      this.uniforms.uExplosion.value = 0.0;
      this.uniforms.uOpacity.value = 1.0;
      this.camera.position.set(0, 1.8, 4.8);
      this.camera.lookAt(0, 0, 0);
      this.camera.fov = 50;
    } else if (t < 8.2) {
      this.aplicarFormaInmediata(this.formas.nombre);
      this.uniforms.uHeartGlow.value = 1.0;
      this.uniforms.uExplosion.value = 0.0;
      this.uniforms.uOpacity.value = 1.0;
      const camZNombre = (this.camera && this.camera.aspect < 0.8) ? 5.2 : 3.8;
      this.camera.position.set(0, 0.0, camZNombre);
      this.camera.lookAt(0, 0, 0);
      this.camera.fov = 50;
    } else if (t < 12.8) {
      this.aplicarFormaInmediata(this.formas.corazonTeAmo);
      this.uniforms.uHeartGlow.value = (t > 11.5) ? 2.5 : 1.0;
      this.uniforms.uExplosion.value = 0.0;
      this.uniforms.uOpacity.value = 1.0;
      const camZCorazon = (this.camera && this.camera.aspect < 0.8) ? 4.9 : 3.6;
      this.camera.position.set(0, 0.0, camZCorazon);
      this.camera.lookAt(0, 0, 0);
      this.camera.fov = 50;
    } else {
      this.aplicarFormaInmediata(this.formas.corazonTeAmo);
      const progresoExp = Math.min(1.0, (t - 12.8) / 2.0);
      this.uniforms.uExplosion.value = progresoExp;
      this.uniforms.uOpacity.value = Math.max(0.0, 1.0 - (t - 13.8) / 1.2);
      this.camera.position.set(0, 0.0, 4.0);
      this.camera.lookAt(0, 0, 0);
      this.camera.fov = 50;
    }
    this.camera.updateProjectionMatrix();
    if (this.timeline) {
      this.timeline.seek(t);
    }
  }

  saltar() {
    if (this.saltada) return;
    this.saltada = true;
    if (this.timeline) this.timeline.kill();
    this.finalizarIntro();
  }

  finalizarIntro() {
    if (this.finalizada) return;
    this.finalizada = true;

    try {
      sessionStorage.setItem('intro_vista', 'true');
    } catch (e) {
      // Ignorar si sessionStorage está bloqueado
    }

    if (this.onComplete) {
      this.onComplete();
    }

    // Limpieza de memoria
    setTimeout(() => {
      this.destruir();
    }, 1000);
  }

  destruir() {
    if (this.animId) cancelAnimationFrame(this.animId);
    if (this._onResizeBound) {
      window.removeEventListener('resize', this._onResizeBound);
    }

    if (this.puntosMesh) {
      this.scene.remove(this.puntosMesh);
      this.puntosMesh.geometry.dispose();
      this.material.dispose();
    }
    if (this.renderer) {
      this.renderer.dispose();
    }
    if (this.audioCtx && this.audioCtx.state !== 'closed') {
      try { this.audioCtx.close(); } catch (e) {}
    }
  }

  onResize() {
    this.camera.aspect = window.innerWidth / window.innerHeight;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.uniforms.uPointSize.value = 20.0 * (window.devicePixelRatio || 1);
  }

  render(deltaTime = 0.016) {
    this.tiempo += deltaTime;
    this.uniforms.uTime.value = this.tiempo;
    this.camera.lookAt(0, 0, 0);
    this.renderer.render(this.scene, this.camera);
  }
}
