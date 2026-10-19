/**
 * rose-lab.js — Laboratorio interactivo para verificar la anatomía real de la rosa 3D
 * y el arreglo botánico completo del ramo de 12 rosas.
 */

import * as THREE from 'three';
import { HDRLoader } from 'three/addons/loaders/HDRLoader.js';
import {
  generarNormalMapPetalos,
  crearMaterialesRosa,
  RosaIndividual
} from './rose-anatomy.js';
import { construirRamo12 } from './rose.js';

class LaboratorioRosa {
  constructor() {
    this.canvas = document.getElementById('canvas-lab');
    this.distanciaCamara = 4.8;
    this.distanciaObjetivo = 4.8;
    this.alturaCamara = 1.8;
    this.alturaObjetivo = 1.8;
    this.lookY = -0.15;
    this.lookYObjetivo = -0.15;
    this.girando = true;
    this.wireframe = false;
    this.modo = 'rosa'; // 'rosa' | 'ramo'
    this.aperturaActual = 1.0;

    this.init();
    this.setupUI();
    this.animate();
  }

  init() {
    this.renderer = new THREE.WebGLRenderer({
      canvas: this.canvas,
      antialias: true,
      alpha: false,
      powerPreference: 'high-performance'
    });

    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    this.renderer.setPixelRatio(dpr);
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.10;
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;

    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x09030a);

    this.camera = new THREE.PerspectiveCamera(40, window.innerWidth / window.innerHeight, 0.1, 50);
    this.camera.position.set(0, this.alturaCamara, this.distanciaCamara);
    this.camera.lookAt(0, this.lookY, 0);

    // Iluminación
    const ambientLight = new THREE.AmbientLight(0x221026, 1.0);
    this.scene.add(ambientLight);

    this.luzClave = new THREE.DirectionalLight(0xffeedd, 2.2);
    this.luzClave.position.set(3.0, 4.5, 3.5);
    this.scene.add(this.luzClave);

    this.luzRim = new THREE.DirectionalLight(0xa83ec4, 1.6);
    this.luzRim.position.set(-3.5, 3.0, -3.0);
    this.scene.add(this.luzRim);

    this.luzRelleno = new THREE.DirectionalLight(0x35123d, 0.8);
    this.luzRelleno.position.set(0, -2.5, 2.5);
    this.scene.add(this.luzRelleno);

    // HDRI de Poly Haven
    const pmrem = new THREE.PMREMGenerator(this.renderer);
    pmrem.compileEquirectangularShader();
    new HDRLoader().load('/environment.hdr', (texture) => {
      this.scene.environment = pmrem.fromEquirectangular(texture).texture;
      texture.dispose();
      pmrem.dispose();
    });

    // Materiales comunes
    this.normalMap = generarNormalMapPetalos(512);
    this.materiales = crearMaterialesRosa(this.normalMap);

    // 1. Rosa individual anatómica
    this.rosa = new RosaIndividual(this.materiales, {
      calidadAlta: true,
      incluirTallo: true,
      aperturaInicial: 1.0
    });

    this.rosaGrupo = new THREE.Group();
    this.rosaGrupo.position.set(0, -0.42, 0);
    this.rosaGrupo.rotation.x = 0.36;
    this.rosaGrupo.add(this.rosa.grupo);
    this.scene.add(this.rosaGrupo);

    // 2. Ramo completo de 12 rosas + envoltura + follaje collar + gypsophila
    this.ramoDatos = construirRamo12({
      normalMap: this.normalMap,
      aperturaInicial: 1.0
    });

    this.ramoGrupo = new THREE.Group();
    this.ramoGrupo.position.set(0, -0.15, 0);
    this.ramoGrupo.rotation.x = 0.22;
    this.ramoGrupo.add(this.ramoDatos.ramoGrupo);
    this.ramoGrupo.visible = false;
    this.scene.add(this.ramoGrupo);

    this.actualizarEstadisticas();

    window.addEventListener('resize', this.onResize.bind(this));

    // Exponer para pruebas automatizadas
    window._labRosa = this;
  }

  actualizarEstadisticas() {
    let triCount = 0;
    const targetGrupo = (this.modo === 'rosa') ? this.rosa.grupo : this.ramoDatos.ramoGrupo;
    targetGrupo.traverse((child) => {
      if (child.isMesh && child.geometry) {
        if (child.geometry.index) {
          triCount += child.geometry.index.count / 3;
        } else if (child.geometry.attributes.position) {
          triCount += child.geometry.attributes.position.count / 3;
        }
      }
    });

    const triElem = document.getElementById('tri-count');
    if (triElem) {
      triElem.textContent = `${Math.round(triCount).toLocaleString()} tris (${this.modo === 'rosa' ? '1 Flor' : '12 Flores + Ramo'})`;
    }
  }

  cambiarModo(nuevoModo) {
    this.modo = nuevoModo;
    if (nuevoModo === 'rosa') {
      this.rosaGrupo.visible = true;
      this.ramoGrupo.visible = false;
      this.distanciaObjetivo = 4.8;
      this.alturaObjetivo = 1.8;
      this.lookYObjetivo = -0.15;
    } else {
      this.rosaGrupo.visible = false;
      this.ramoGrupo.visible = true;
      this.distanciaObjetivo = 5.8;
      this.alturaObjetivo = 2.2;
      this.lookYObjetivo = 0.10;
    }
    this.aplicarApertura(this.aperturaActual);
    this.actualizarEstadisticas();
  }

  aplicarApertura(val) {
    this.aperturaActual = val;
    this.rosa.setApertura(val);
    if (this.ramoDatos && this.ramoDatos.rosas) {
      this.ramoDatos.rosas.forEach(r => {
        if (r.setApertura) r.setApertura(val);
      });
    }
  }

  setupUI() {
    const btnModRosa = document.getElementById('mod-rosa');
    const btnModRamo = document.getElementById('mod-ramo');

    if (btnModRosa && btnModRamo) {
      btnModRosa.addEventListener('click', () => {
        btnModRosa.classList.add('active');
        btnModRamo.classList.remove('active');
        this.cambiarModo('rosa');
      });

      btnModRamo.addEventListener('click', () => {
        btnModRamo.classList.add('active');
        btnModRosa.classList.remove('active');
        this.cambiarModo('ramo');
      });
    }

    const btnCerca = document.getElementById('cam-cerca');
    const btnMedia = document.getElementById('cam-media');
    const btnLejos = document.getElementById('cam-lejos');
    const btnCenital = document.getElementById('cam-cenital');
    const sliderApertura = document.getElementById('apertura');
    const btnWireframe = document.getElementById('wireframe');
    const btnRotacion = document.getElementById('rotacion');

    const updateBtns = (activeBtn) => {
      [btnCerca, btnMedia, btnLejos, btnCenital].forEach(b => b && b.classList.remove('active'));
      if (activeBtn) activeBtn.classList.add('active');
    };

    if (btnCerca) {
      btnCerca.addEventListener('click', () => {
        this.distanciaObjetivo = (this.modo === 'rosa') ? 3.0 : 4.0;
        this.alturaObjetivo = 1.4;
        this.lookYObjetivo = -0.10;
        updateBtns(btnCerca);
      });
    }

    if (btnMedia) {
      btnMedia.addEventListener('click', () => {
        this.distanciaObjetivo = (this.modo === 'rosa') ? 4.8 : 5.8;
        this.alturaObjetivo = (this.modo === 'rosa') ? 1.8 : 2.2;
        this.lookYObjetivo = (this.modo === 'rosa') ? -0.15 : 0.10;
        updateBtns(btnMedia);
      });
    }

    if (btnLejos) {
      btnLejos.addEventListener('click', () => {
        this.distanciaObjetivo = (this.modo === 'rosa') ? 7.5 : 8.5;
        this.alturaObjetivo = 2.4;
        this.lookYObjetivo = 0.0;
        updateBtns(btnLejos);
      });
    }

    if (btnCenital) {
      btnCenital.addEventListener('click', () => {
        // Vista cenital vertical desde arriba para verificar cúpula y ausencia de huecos
        this.distanciaObjetivo = 0.1;
        this.alturaObjetivo = (this.modo === 'rosa') ? 4.2 : 5.6;
        this.lookYObjetivo = 0.20;
        updateBtns(btnCenital);
      });
    }

    const btnCapullo = document.getElementById('btn-capullo');
    const btnSemi = document.getElementById('btn-semi');
    const btnAbierta = document.getElementById('btn-abierta');

    const updateEstadoBtns = (activeBtn) => {
      [btnCapullo, btnSemi, btnAbierta].forEach(b => b && b.classList.remove('active'));
      if (activeBtn) activeBtn.classList.add('active');
    };

    if (btnCapullo) {
      btnCapullo.addEventListener('click', () => {
        sliderApertura.value = '0.0';
        this.aplicarApertura(0.0);
        updateEstadoBtns(btnCapullo);
      });
    }

    if (btnSemi) {
      btnSemi.addEventListener('click', () => {
        sliderApertura.value = '0.5';
        this.aplicarApertura(0.5);
        updateEstadoBtns(btnSemi);
      });
    }

    if (btnAbierta) {
      btnAbierta.addEventListener('click', () => {
        sliderApertura.value = '1.0';
        this.aplicarApertura(1.0);
        updateEstadoBtns(btnAbierta);
      });
    }

    sliderApertura.addEventListener('input', (e) => {
      const val = parseFloat(e.target.value);
      this.aplicarApertura(val);
      if (val < 0.25) updateEstadoBtns(btnCapullo);
      else if (val < 0.75) updateEstadoBtns(btnSemi);
      else updateEstadoBtns(btnAbierta);
    });

    btnWireframe.addEventListener('click', () => {
      this.wireframe = !this.wireframe;
      const targetMat = (this.modo === 'rosa') ? this.rosa.grupo : this.ramoDatos.ramoGrupo;
      targetMat.traverse((child) => {
        if (child.isMesh && child.material) {
          child.material.wireframe = this.wireframe;
        }
      });
      btnWireframe.classList.toggle('active', this.wireframe);
    });

    btnRotacion.addEventListener('click', () => {
      this.girando = !this.girando;
      btnRotacion.textContent = this.girando ? 'Pausar' : 'Girar';
      btnRotacion.classList.toggle('active', this.girando);
    });

    // Control táctil o con ratón para rotación orbital
    let isDragging = false;
    let prevMouseX = 0;
    let prevMouseY = 0;

    const onPointerDown = (e) => {
      isDragging = true;
      prevMouseX = e.clientX || (e.touches && e.touches[0].clientX) || 0;
      prevMouseY = e.clientY || (e.touches && e.touches[0].clientY) || 0;
    };

    const onPointerMove = (e) => {
      if (!isDragging) return;
      const x = e.clientX || (e.touches && e.touches[0].clientX) || 0;
      const y = e.clientY || (e.touches && e.touches[0].clientY) || 0;
      const dx = x - prevMouseX;
      const dy = y - prevMouseY;
      prevMouseX = x;
      prevMouseY = y;

      const activeGroup = (this.modo === 'rosa') ? this.rosaGrupo : this.ramoGrupo;
      activeGroup.rotation.y += dx * 0.01;
      activeGroup.rotation.x = Math.max(-0.5, Math.min(0.8, activeGroup.rotation.x + dy * 0.01));
    };

    const onPointerUp = () => { isDragging = false; };

    this.canvas.addEventListener('mousedown', onPointerDown);
    window.addEventListener('mousemove', onPointerMove);
    window.addEventListener('mouseup', onPointerUp);

    this.canvas.addEventListener('touchstart', onPointerDown, { passive: true });
    window.addEventListener('touchmove', onPointerMove, { passive: true });
    window.addEventListener('touchend', onPointerUp);
  }

  onResize() {
    this.camera.aspect = window.innerWidth / window.innerHeight;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(window.innerWidth, window.innerHeight);
  }

  animate() {
    requestAnimationFrame(this.animate.bind(this));

    // Suavizado de distancia de cámara y altura
    this.distanciaCamara += (this.distanciaObjetivo - this.distanciaCamara) * 0.1;
    this.alturaCamara += (this.alturaObjetivo - this.alturaCamara) * 0.1;
    this.lookY += (this.lookYObjetivo - this.lookY) * 0.1;

    this.camera.position.z = this.distanciaCamara;
    this.camera.position.y = this.alturaCamara;
    this.camera.lookAt(0, this.lookY, 0);

    // Giro suave continuo
    if (this.girando) {
      const activeGroup = (this.modo === 'rosa') ? this.rosaGrupo : this.ramoGrupo;
      activeGroup.rotation.y += 0.008;
    }

    this.renderer.render(this.scene, this.camera);
  }
}

new LaboratorioRosa();
