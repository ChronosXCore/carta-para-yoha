/**
 * rose.js — Ramo de 12 Rosas Realistas Procedurales con Three.js
 *
 * Arquitectura Botánica Cilíndrica:
 * - 12 rosas completas (una por cada mes de relación) en arreglo armónico de floristería.
 * - Pétalos con envoltura cilíndrica theta(u,v) en espiral áurea:
 *   centro cerrado en capullo que se abre a capas concéntricas redondeadas.
 * - Cero facetas, normales suaves, color por vértice con AO horneada.
 * - Morph targets de floración (capullo -> semiabierta -> abierta) con GSAP.
 * - MeshPhysicalMaterial con sheen aterciopelado, micro-venas, fake SSS y rim fresnel.
 * - HDRI Poly Haven (1k) + luces clave y rim púrpura.
 * - Envoltura de papel y listón de satén morado con lazo.
 * - InstancedMesh para pétalos cayendo y función iluminarRosa(mesIndex).
 */

import * as THREE from 'three';
import { HDRLoader } from 'three/addons/loaders/HDRLoader.js';
import gsap from 'gsap';
import { CONFIG } from './carta.js';
import {
  generarNormalMapPetalos,
  crearMaterialesRosa,
  construirRosaGeometria
} from './rose-anatomy.js';

// ─────────────────────────────────────────────────────────
// TEXTURA PROCEDURAL DE MICRO-VENAS Y TERCIOPELO
// ─────────────────────────────────────────────────────────
function generarNormalMapProcedural() {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext('2d');
  const imgData = ctx.createImageData(512, 512);
  const data = imgData.data;

  for (let y = 0; y < 512; y++) {
    const ny = y / 512;
    for (let x = 0; x < 512; x++) {
      const nx = (x - 256) / 256;
      const freq = 14.0;
      const microVena = Math.sin(nx * freq * (0.8 + 0.4 * ny) + Math.cos(ny * 3.5) * 0.8);
      const microGrano = (Math.random() - 0.5) * 0.08;
      const perturbacion = microVena * 0.10 * Math.sin(ny * Math.PI) + microGrano;

      const dx = perturbacion * 127;
      const dy = microGrano * 30;
      const idx = (y * 512 + x) * 4;

      data[idx]     = Math.min(255, Math.max(0, Math.floor(128 + dx)));
      data[idx + 1] = Math.min(255, Math.max(0, Math.floor(128 + dy)));
      data[idx + 2] = 250;
      data[idx + 3] = 255;
    }
  }

  ctx.putImageData(imgData, 0, 0);
  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(2, 2);
  return texture;
}

// ─────────────────────────────────────────────────────────
// TEXTURA PROCEDURAL DE PAPEL COREANO MATE CON FIBRAS Y PLIEGUES
// ─────────────────────────────────────────────────────────
function generarNormalMapPapelCoreano() {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext('2d');
  const imgData = ctx.createImageData(512, 512);
  const data = imgData.data;

  for (let y = 0; y < 512; y++) {
    const ny = y / 512;
    for (let x = 0; x < 512; x++) {
      const nx = x / 512;

      // 1. Micro-grano de pulpa de papel artesanal mate
      const grano = (Math.random() - 0.5) * 0.18;

      // 2. Ondulaciones suaves de arrugas y tensión de plegado
      const pliegueSuave1 = Math.sin(nx * 18.0 + ny * 12.0) * 0.12;
      const pliegueSuave2 = Math.cos(nx * 26.0 - ny * 16.0) * 0.08;

      // 3. Fibras longitudinales de prensado
      const fibra = Math.sin(nx * 92.0 + Math.sin(ny * 24.0) * 1.5) * 0.06;

      const perturbacionX = (pliegueSuave1 + pliegueSuave2 + fibra) * 0.65 + grano;
      const perturbacionY = (pliegueSuave2 - pliegueSuave1) * 0.45 + grano * 0.8;

      const dx = Math.min(255, Math.max(0, Math.floor(128 + perturbacionX * 110)));
      const dy = Math.min(255, Math.max(0, Math.floor(128 + perturbacionY * 110)));

      const idx = (y * 512 + x) * 4;
      data[idx] = dx;
      data[idx + 1] = dy;
      data[idx + 2] = 245;
      data[idx + 3] = 255;
    }
  }

  ctx.putImageData(imgData, 0, 0);
  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(3, 3);
  return texture;
}

// ─────────────────────────────────────────────────────────
// MATERIAL CON VELVET SHEEN Y TRANSLUCIDEZ FALSA
// ─────────────────────────────────────────────────────────
function crearMaterialPetalos(normalMap) {
  const material = new THREE.MeshPhysicalMaterial({
    vertexColors: true,
    roughness: 0.52,
    metalness: 0.01,
    sheen: 0.90,
    sheenColor: new THREE.Color(0xa82852), // Sheen aterciopelado cálido
    sheenRoughness: 0.46,
    side: THREE.DoubleSide,
    normalMap: normalMap,
    normalScale: new THREE.Vector2(0.12, 0.12),
    envMapIntensity: 0.65,
  });

  material.onBeforeCompile = (shader) => {
    shader.uniforms.uHighlightRose = { value: 0.0 };

    shader.vertexShader = `
      varying vec3 vWorldNormal;
      varying vec3 vWorldPosition;
      ${shader.vertexShader}
    `;

    shader.vertexShader = shader.vertexShader.replace(
      '#include <worldpos_vertex>',
      `
      #include <worldpos_vertex>
      vWorldNormal = normalize(mat3(modelMatrix) * normal);
      vWorldPosition = (modelMatrix * vec4(transformed, 1.0)).xyz;
      `
    );

    shader.fragmentShader = `
      uniform float uHighlightRose;
      varying vec3 vWorldNormal;
      varying vec3 vWorldPosition;
      ${shader.fragmentShader}
    `;

    shader.fragmentShader = shader.fragmentShader.replace(
      '#include <dithering_fragment>',
      `
      #include <dithering_fragment>

      // Fake SSS: Contraluz suave
      vec3 lightDirection = normalize(vec3(0.5, 0.8, -0.6));
      vec3 viewDir = normalize(cameraPosition - vWorldPosition);
      float backlight = pow(clamp(dot(viewDir, -lightDirection), 0.0, 1.0), 3.0);
      vec3 sssColor = vec3(0.55, 0.08, 0.18);
      gl_FragColor.rgb += backlight * sssColor * 0.28;

      // Rim Fresnel terciopelo
      float rimFresnel = pow(1.0 - clamp(abs(dot(viewDir, normalize(vWorldNormal))), 0.0, 1.0), 3.4);
      gl_FragColor.rgb += rimFresnel * vec3(0.24, 0.04, 0.16) * 0.30;

      // Iluminación al ver cada foto
      if (uHighlightRose > 0.001) {
        gl_FragColor.rgb += vec3(0.38, 0.14, 0.30) * uHighlightRose;
      }
      `
    );
  };

  return material;
}



// ─────────────────────────────────────────────────────────
// GENERADOR DE CINTA PLANA DE SATÉN CON CORTE EN V (SWALLOWTAIL)
// ─────────────────────────────────────────────────────────
function crearGeometriaCintaPlana(curva, ancho, segmentos = 30, conCorteV = true) {
  const positions = [];
  const uvs = [];
  const indices = [];

  const up = new THREE.Vector3(0, 0, 1);

  for (let i = 0; i <= segmentos; i++) {
    const t = i / segmentos;
    const pt = curva.getPoint(t);
    const tan = curva.getTangent(t).normalize();
    let binorm = new THREE.Vector3().crossVectors(tan, up).normalize();
    if (binorm.lengthSq() < 0.05) {
      binorm = new THREE.Vector3(1, 0, 0);
    }

    const halfW = (ancho * 0.5) * (0.90 + 0.10 * Math.sin(t * Math.PI));

    if (i === segmentos && conCorteV) {
      // Corte clásico en V de floristería (cola de milano)
      const pIzq = new THREE.Vector3().copy(pt).addScaledVector(binorm, -halfW);
      const pDer = new THREE.Vector3().copy(pt).addScaledVector(binorm, halfW);
      const pCentroV = new THREE.Vector3().copy(pt).addScaledVector(tan, -ancho * 0.70);

      const idxBase = positions.length / 3;
      positions.push(pIzq.x, pIzq.y, pIzq.z);
      positions.push(pCentroV.x, pCentroV.y, pCentroV.z);
      positions.push(pDer.x, pDer.y, pDer.z);

      uvs.push(0, 1, 0.5, 0.88, 1, 1);

      const prevIzq = (segmentos - 1) * 2;
      const prevDer = (segmentos - 1) * 2 + 1;

      indices.push(prevIzq, idxBase, idxBase + 1);
      indices.push(prevIzq, idxBase + 1, prevDer);
      indices.push(idxBase + 1, idxBase + 2, prevDer);
      break;
    }

    const pIzq = new THREE.Vector3().copy(pt).addScaledVector(binorm, -halfW);
    const pDer = new THREE.Vector3().copy(pt).addScaledVector(binorm, halfW);

    positions.push(pIzq.x, pIzq.y, pIzq.z);
    positions.push(pDer.x, pDer.y, pDer.z);

    uvs.push(0, t);
    uvs.push(1, t);

    if (i < segmentos) {
      const a = i * 2;
      const b = i * 2 + 1;
      const c = (i + 1) * 2;
      const d = (i + 1) * 2 + 1;
      indices.push(a, c, b);
      indices.push(b, c, d);
    }
  }

  const geom = new THREE.BufferGeometry();
  geom.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geom.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
  geom.setIndex(indices);
  geom.computeVertexNormals();
  return geom;
}

// ─────────────────────────────────────────────────────────
// TALLOS, ENVOLTURA COREANA ORIGAMI Y LAZO DE SATÉN SEDOSO
// ─────────────────────────────────────────────────────────
function crearTallosYEnvoltura(posicionesRosas) {
  const grupo = new THREE.Group();

  // 1. Materiales de alta fidelidad botánica y floristería
  const matTallo = new THREE.MeshStandardMaterial({
    color: 0x1a3818, // Verde savia oscuro natural
    roughness: 0.48,
    metalness: 0.02
  });

  const matPithTallo = new THREE.MeshStandardMaterial({
    color: 0xd6eec8, // Médula verde clara del corte fresco del tallo
    roughness: 0.60
  });

  const matHojaRosa = new THREE.MeshStandardMaterial({
    color: 0x18421b,
    roughness: 0.36,
    metalness: 0.04,
    side: THREE.DoubleSide
  });

  // Eucalipto plateado / sage glauco mate (Foto 1)
  const matEucalipto = new THREE.MeshStandardMaterial({
    color: 0x486b5b,
    roughness: 0.65,
    metalness: 0.02,
    side: THREE.DoubleSide
  });

  // Gypsophila / Baby's breath: nube blanca etérea pura (Fotos 3 y 4)
  const matGypsophila = new THREE.MeshStandardMaterial({
    color: 0xffffff,
    roughness: 0.35,
    metalness: 0.02
  });

  // Textura procedural de papel coreano con fibras y pliegues
  const normalMapPapel = generarNormalMapPapelCoreano();

  // Papel de floristería exterior: Rosa blush / durazno empolvado mate impermeable con textura de papel
  const matEnvolturaExt = new THREE.MeshPhysicalMaterial({
    color: 0xc47087, // Tono cálido definido, rosa palo / blush kraft mate
    roughness: 0.88,
    metalness: 0.0,
    clearcoat: 0.0, // Cero brillo plástico tipo celofán
    sheen: 0.55,
    sheenColor: new THREE.Color(0xf6dbe3), // Fibras de papel atrapando luz suave
    sheenRoughness: 0.85,
    normalMap: normalMapPapel,
    normalScale: new THREE.Vector2(0.24, 0.24),
    side: THREE.DoubleSide,
    flatShading: true // Vértices y facetas poligonales nítidas de papel plegado real
  });

  // Papel de floristería interior: Perla sedoso con micro-textura
  const matEnvolturaInt = new THREE.MeshPhysicalMaterial({
    color: 0xd699ab, // Tono blush empolvado cálido más suave y armonioso
    roughness: 0.85,
    metalness: 0.0,
    clearcoat: 0.0,
    sheen: 0.45,
    sheenColor: new THREE.Color(0xf7dbe3),
    sheenRoughness: 0.80,
    normalMap: normalMapPapel,
    normalScale: new THREE.Vector2(0.18, 0.18),
    side: THREE.DoubleSide,
    flatShading: true
  });

  // Satén de lujo con brillo sedoso textil (Fotos 1, 4 y 5)
  const matLazoSaten = new THREE.MeshPhysicalMaterial({
    color: 0xe687a0, // Rosa champagne sedoso
    roughness: 0.26,
    metalness: 0.02,
    clearcoat: 0.45,
    clearcoatRoughness: 0.25,
    sheen: 1.0,
    sheenColor: new THREE.Color(0xffdbe6),
    sheenRoughness: 0.30,
    side: THREE.DoubleSide
  });

  // Punto focal de cintura del ramo donde el lazo amarra los tallos y la envoltura
  const yCintura = -1.38;
  const puntoCintura = new THREE.Vector3(0, yCintura, 0);

  // 1. Tallos de las 12 rosas convergiendo en la cintura del ramo
  posicionesRosas.forEach((posRosa, i) => {
    const pBaseRosa = new THREE.Vector3(posRosa.x, posRosa.y - 0.15, posRosa.z);
    const pMedio = new THREE.Vector3(
      posRosa.x * 0.48 + Math.sin(i * 1.8) * 0.04,
      -0.65,
      posRosa.z * 0.48 + Math.cos(i * 1.8) * 0.04
    );
    const pCintura = new THREE.Vector3(
      puntoCintura.x + Math.sin(i * 0.52) * 0.05,
      puntoCintura.y + (i % 3) * 0.03,
      puntoCintura.z + Math.cos(i * 0.52) * 0.05
    );

    const curve = new THREE.CatmullRomCurve3([pBaseRosa, pMedio, pCintura]);
    const stemGeom = new THREE.TubeGeometry(curve, 18, 0.034, 10, false);
    grupo.add(new THREE.Mesh(stemGeom, matTallo));

    // Hojas de rosa dentadas bajo la flor (en la copa superior, dentro de la envoltura)
    if (i >= 2) {
      const pRama = curve.getPoint(0.20);
      const hojaGrupo = new THREE.Group();
      hojaGrupo.position.copy(pRama);

      const leafletGeom = new THREE.PlaneGeometry(0.14, 0.22, 4, 6);
      const pos = leafletGeom.attributes.position;
      for (let k = 0; k < pos.count; k++) {
        const vx = pos.getX(k);
        const vy = pos.getY(k);
        pos.setZ(k, -Math.abs(vx) * 0.22 + Math.sin(vy * 3.5) * 0.02);
      }
      leafletGeom.computeVertexNormals();

      const hojaCentro = new THREE.Mesh(leafletGeom, matHojaRosa);
      hojaCentro.position.set(0, 0.08, 0);

      const hojaIzq = new THREE.Mesh(leafletGeom, matHojaRosa);
      hojaIzq.scale.set(0.72, 0.72, 0.72);
      hojaIzq.position.set(-0.07, 0.02, 0);
      hojaIzq.rotation.z = 0.45;

      const hojaDer = new THREE.Mesh(leafletGeom, matHojaRosa);
      hojaDer.scale.set(0.72, 0.72, 0.72);
      hojaDer.position.set(0.07, 0.02, 0);
      hojaDer.rotation.z = -0.45;

      hojaGrupo.add(hojaCentro, hojaIzq, hojaDer);
      hojaGrupo.lookAt(posRosa);
      hojaGrupo.rotation.x += 0.50;
      grupo.add(hojaGrupo);
    }
  });

  // 2. Manojo de tallos frescos cortados en la base del mango (Foto 2)
  const numTallosBase = 22;
  const geomTalloBase = new THREE.CylinderGeometry(0.026, 0.026, 1.15, 8);
  const geomPithCorte = new THREE.CircleGeometry(0.025, 8);
  geomPithCorte.rotateX(Math.PI * 0.5);

  for (let s = 0; s < numTallosBase; s++) {
    const ang = (s / numTallosBase) * Math.PI * 2.0;
    const rTallo = 0.065 + (s % 3) * 0.030;
    const yCorte = -2.52 - (s % 4) * 0.025;

    const meshTalloBase = new THREE.Mesh(geomTalloBase, matTallo);
    meshTalloBase.position.set(
      Math.cos(ang) * rTallo,
      yCintura - 0.55,
      Math.sin(ang) * rTallo
    );
    meshTalloBase.rotation.set(Math.sin(ang) * 0.04, 0, -Math.cos(ang) * 0.04);
    grupo.add(meshTalloBase);

    // Corte oblicuo de floristería en la base con médula clara
    const meshCorte = new THREE.Mesh(geomPithCorte, matPithTallo);
    meshCorte.position.set(Math.cos(ang) * rTallo * 1.05, yCorte, Math.sin(ang) * rTallo * 1.05);
    meshCorte.rotation.set(0.25, ang, 0);
    grupo.add(meshCorte);
  }

  // 3. Ramas de Eucalipto (Eucalyptus) en el respaldo posterior y laterales (Foto 1)
  const numRamasEucalipto = 5;
  const geomHojaEucalipto = new THREE.CircleGeometry(0.11, 12);
  geomHojaEucalipto.scale(0.85, 1.20, 1.0);

  for (let e = 0; e < numRamasEucalipto; e++) {
    // Solo en el semicírculo posterior (phi de 0.65*PI a 1.35*PI) para no perforar el papel frontal
    const angulo = Math.PI * 0.65 + (e / (numRamasEucalipto - 1)) * Math.PI * 0.70;
    const rRadio = 0.68 + (e % 2) * 0.06;
    const alturaTop = e % 2 === 0 ? 0.48 : 0.32;
    const pEucBase = new THREE.Vector3(
      Math.sin(angulo) * rRadio,
      alturaTop,
      Math.cos(angulo) * rRadio
    );
    const pEucMedio = new THREE.Vector3(
      Math.sin(angulo) * (rRadio * 0.50),
      -0.65,
      Math.cos(angulo) * (rRadio * 0.50)
    );
    const curveEuc = new THREE.CatmullRomCurve3([pEucBase, pEucMedio, puntoCintura]);
    const stemEuc = new THREE.TubeGeometry(curveEuc, 14, 0.018, 8, false);
    grupo.add(new THREE.Mesh(stemEuc, matTallo));

    for (let t = 0.15; t <= 0.85; t += 0.16) {
      const pt = curveEuc.getPoint(t);
      const pairGroup = new THREE.Group();
      pairGroup.position.copy(pt);

      const leafL = new THREE.Mesh(geomHojaEucalipto, matEucalipto);
      leafL.position.set(-0.09, 0, 0);
      leafL.rotation.set(0.18, 0.35, 0.65);

      const leafR = new THREE.Mesh(geomHojaEucalipto, matEucalipto);
      leafR.position.set(0.09, 0, 0);
      leafR.rotation.set(0.18, -0.35, -0.65);

      pairGroup.add(leafL, leafR);
      pairGroup.lookAt(pEucBase);
      grupo.add(pairGroup);
    }
  }

  // 4. Collar botánico de hojas de salal que rodea la base de las rosas perimetrales, anidadas dentro de la envoltura
  const numHojasCollar = 14;
  const geomHojaCollar = new THREE.PlaneGeometry(0.20, 0.26, 6, 8);
  const posHC = geomHojaCollar.attributes.position;
  for (let k = 0; k < posHC.count; k++) {
    const vx = posHC.getX(k);
    const vy = posHC.getY(k);
    const ny = (vy + 0.13) / 0.26;
    const w = (ny < 0.45) ? Math.sin((ny / 0.45) * Math.PI * 0.5) : Math.cos(((ny - 0.45) / 0.55) * Math.PI * 0.48);
    posHC.setX(k, vx * (0.22 + 0.78 * w));
    posHC.setZ(k, -Math.abs(vx) * 0.22 + Math.sin(vy * 4.0) * 0.02);
  }
  geomHojaCollar.computeVertexNormals();

  for (let h = 0; h < numHojasCollar; h++) {
    const ang = (h / numHojasCollar) * Math.PI * 2.0;
    const rHoja = 0.62 + (h % 2) * 0.03;
    const yHoja = 0.10 + Math.sin(ang) * 0.04;
    const hojaMesh = new THREE.Mesh(geomHojaCollar, matHojaRosa);
    hojaMesh.position.set(Math.sin(ang) * rHoja, yHoja, Math.cos(ang) * rHoja);
    // Inclinación suave hacia arriba y hacia adentro para abrazar el cáliz de las rosas
    hojaMesh.rotation.set(0.35, -ang, 0);
    grupo.add(hojaMesh);
  }

  // 5. Nube densa de Gypsophila (Baby's breath) con flores en cruz estrellada entre cada rosa y a lo largo del contorno
  const geomFlorGyps = new THREE.BufferGeometry();
  const vGyps = [
    0, 0, 0,
    0, 0.024, -0.003,
    0.024, 0, -0.003,
    0, -0.024, -0.003,
    -0.024, 0, -0.003
  ];
  const idxGyps = [0, 1, 2, 0, 2, 3, 0, 3, 4, 0, 4, 1];
  geomFlorGyps.setAttribute('position', new THREE.Float32BufferAttribute(vGyps, 3));
  geomFlorGyps.setIndex(idxGyps);
  geomFlorGyps.computeVertexNormals();

  const puntosNube = [];
  // A. Halo perimetral (18 puntos alrededor de las 7 rosas exteriores)
  for (let i = 0; i < 18; i++) {
    const ang = (i / 18) * Math.PI * 2.0;
    const rad = 0.68 + (i % 3) * 0.05;
    puntosNube.push(new THREE.Vector3(
      Math.sin(ang) * rad,
      0.22 + Math.sin(ang * 2.0) * 0.08,
      Math.cos(ang) * rad
    ));
  }

  // B. Racimos entre rosas intermedias y exteriores
  puntosNube.push(
    new THREE.Vector3(0.0, 0.38, 0.46),
    new THREE.Vector3(0.38, 0.36, 0.28),
    new THREE.Vector3(0.48, 0.38, -0.06),
    new THREE.Vector3(0.18, 0.40, -0.42),
    new THREE.Vector3(-0.18, 0.40, -0.42),
    new THREE.Vector3(-0.48, 0.38, -0.06),
    new THREE.Vector3(-0.38, 0.36, 0.28),
    // C. Racimos en el centro alrededor de la rosa central
    new THREE.Vector3(-0.14, 0.50, 0.12),
    new THREE.Vector3(0.14, 0.50, 0.12),
    new THREE.Vector3(0.00, 0.51, -0.15),
    new THREE.Vector3(-0.14, 0.48, -0.12),
    new THREE.Vector3(0.14, 0.48, -0.12)
  );

  puntosNube.forEach((pCentro, idx) => {
    const nubeGrupo = new THREE.Group();
    nubeGrupo.position.copy(pCentro);

    for (let f = 0; f < 6; f++) {
      const flor = new THREE.Mesh(geomFlorGyps, matGypsophila);
      const fx = Math.sin(idx * 2.5 + f * 1.3) * 0.06;
      const fy = Math.cos(idx * 1.9 + f * 1.1) * 0.04;
      const fz = Math.sin(f * 2.1 + idx) * 0.06;
      flor.position.set(fx, fy, fz);
      flor.rotation.set(Math.random() * Math.PI, Math.random() * Math.PI, 0);
      nubeGrupo.add(flor);
    }
    grupo.add(nubeGrupo);
  });

  // 6. ENVOLTURA COREANA ORIGAMI MULTI-PLIEGO (Inspirada en Ramos Reales de Floristería)
  // Construida con facetas poligonales, puntas geométricas y pliegues diagonales reales (Image 2 y 4)

  // A. Gran Abanico de Respaldo Origami (Backdrop Sheet con puntas de diamante estilo Foto 4 y Foto 2)
  const ribsRespaldo = [
    { ang: Math.PI * 0.48, rTop: 1.16, yTop: 0.45, rWaist: 0.36 }, // Ala lateral izquierda
    { ang: Math.PI * 0.66, rTop: 1.28, yTop: 0.92, rWaist: 0.36 }, // Pico de diamante lateral-izq
    { ang: Math.PI * 0.83, rTop: 1.22, yTop: 0.76, rWaist: 0.35 }, // Pliegue interno
    { ang: Math.PI * 1.00, rTop: 1.34, yTop: 1.15, rWaist: 0.35 }, // Gran pico central de diamante origami
    { ang: Math.PI * 1.17, rTop: 1.22, yTop: 0.76, rWaist: 0.35 }, // Pliegue interno
    { ang: Math.PI * 1.34, rTop: 1.28, yTop: 0.92, rWaist: 0.36 }, // Pico de diamante lateral-der
    { ang: Math.PI * 1.52, rTop: 1.16, yTop: 0.45, rWaist: 0.36 }  // Ala lateral derecha
  ];

  const posResp = [];
  const uvsResp = [];
  const idxResp = [];
  const segsUResp = 4;
  const numRibs = ribsRespaldo.length;

  for (let ir = 0; ir < numRibs; ir++) {
    const rib = ribsRespaldo[ir];
    const sinA = Math.sin(rib.ang);
    const cosA = Math.cos(rib.ang);

    for (let iu = 0; iu <= segsUResp; iu++) {
      const u = iu / segsUResp;
      const y = yCintura + (rib.yTop - yCintura) * Math.pow(u, 0.88);
      const creasePliegue = (ir % 2 === 0 ? 0.035 : -0.025) * u;
      const r = THREE.MathUtils.lerp(rib.rWaist, rib.rTop, Math.pow(u, 0.78)) + creasePliegue;

      posResp.push(r * sinA, y, r * cosA);
      uvsResp.push(ir / (numRibs - 1), u);
    }
  }

  const strideResp = segsUResp + 1;
  for (let ir = 0; ir < numRibs - 1; ir++) {
    for (let iu = 0; iu < segsUResp; iu++) {
      const a = ir * strideResp + iu;
      const b = (ir + 1) * strideResp + iu;
      const c = (ir + 1) * strideResp + (iu + 1);
      const d = ir * strideResp + (iu + 1);
      idxResp.push(a, b, d);
      idxResp.push(b, c, d);
    }
  }

  const geomRespaldo = new THREE.BufferGeometry();
  geomRespaldo.setAttribute('position', new THREE.Float32BufferAttribute(posResp, 3));
  geomRespaldo.setAttribute('uv', new THREE.Float32BufferAttribute(uvsResp, 2));
  geomRespaldo.setIndex(idxResp);
  geomRespaldo.computeVertexNormals();

  const meshRespaldo = new THREE.Mesh(geomRespaldo, matEnvolturaExt);
  grupo.add(meshRespaldo);

  // Forro interior de seda del respaldo
  const posRespInt = [];
  for (let k = 0; k < posResp.length; k += 3) {
    const px = posResp[k];
    const py = posResp[k + 1];
    const pz = posResp[k + 2];
    const dist = Math.hypot(px, pz);
    const a = Math.atan2(px, pz);
    const rInt = Math.max(0.34, dist - 0.014);
    posRespInt.push(rInt * Math.sin(a), py - 0.005, rInt * Math.cos(a));
  }
  const geomRespInt = new THREE.BufferGeometry();
  geomRespInt.setAttribute('position', new THREE.Float32BufferAttribute(posRespInt, 3));
  geomRespInt.setAttribute('uv', new THREE.Float32BufferAttribute(uvsResp, 2));
  geomRespInt.setIndex(idxResp);
  geomRespInt.computeVertexNormals();
  const meshRespInt = new THREE.Mesh(geomRespInt, matEnvolturaInt);
  grupo.add(meshRespInt);

  // B. Pliego Envolvente Diagonal Izquierdo (Left Origami Wrap Sheet)
  const ribsWrapIzq = [
    { ang: Math.PI * 0.40, rTop: 1.10, yTop: 0.32 },
    { ang: Math.PI * 0.22, rTop: 1.08, yTop: 0.16 },
    { ang: Math.PI * 0.06, rTop: 1.06, yTop: 0.02 },
    { ang: -Math.PI * 0.12, rTop: 1.04, yTop: -0.06 }
  ];

  const posWrapIzq = [];
  const uvsWrapIzq = [];
  const idxWrapIzq = [];

  for (let ir = 0; ir < ribsWrapIzq.length; ir++) {
    const rib = ribsWrapIzq[ir];
    const sinA = Math.sin(rib.ang);
    const cosA = Math.cos(rib.ang);
    for (let iu = 0; iu <= segsUResp; iu++) {
      const u = iu / segsUResp;
      const y = yCintura + (rib.yTop - yCintura) * Math.pow(u, 0.90);
      const r = THREE.MathUtils.lerp(0.37, rib.rTop, Math.pow(u, 0.80));
      posWrapIzq.push(r * sinA, y, r * cosA);
      uvsWrapIzq.push(ir / (ribsWrapIzq.length - 1), u);
    }
  }

  for (let ir = 0; ir < ribsWrapIzq.length - 1; ir++) {
    for (let iu = 0; iu < segsUResp; iu++) {
      const a = ir * strideResp + iu;
      const b = (ir + 1) * strideResp + iu;
      const c = (ir + 1) * strideResp + (iu + 1);
      const d = ir * strideResp + (iu + 1);
      idxWrapIzq.push(a, b, d);
      idxWrapIzq.push(b, c, d);
    }
  }

  const geomWrapIzq = new THREE.BufferGeometry();
  geomWrapIzq.setAttribute('position', new THREE.Float32BufferAttribute(posWrapIzq, 3));
  geomWrapIzq.setAttribute('uv', new THREE.Float32BufferAttribute(uvsWrapIzq, 2));
  geomWrapIzq.setIndex(idxWrapIzq);
  geomWrapIzq.computeVertexNormals();

  const meshWrapIzq = new THREE.Mesh(geomWrapIzq, matEnvolturaExt);
  grupo.add(meshWrapIzq);

  // C. Pliego Envolvente Diagonal Derecho (Right Origami Wrap Sheet - Overlap en V)
  const ribsWrapDer = [
    { ang: Math.PI * 1.60, rTop: 1.10, yTop: 0.32 },
    { ang: Math.PI * 1.78, rTop: 1.08, yTop: 0.16 },
    { ang: Math.PI * 1.94, rTop: 1.07, yTop: 0.04 },
    { ang: Math.PI * 2.12, rTop: 1.05, yTop: -0.05 }
  ];

  const posWrapDer = [];
  const uvsWrapDer = [];
  const idxWrapDer = [];

  for (let ir = 0; ir < ribsWrapDer.length; ir++) {
    const rib = ribsWrapDer[ir];
    const sinA = Math.sin(rib.ang);
    const cosA = Math.cos(rib.ang);
    for (let iu = 0; iu <= segsUResp; iu++) {
      const u = iu / segsUResp;
      const y = yCintura + (rib.yTop - yCintura) * Math.pow(u, 0.90);
      const r = THREE.MathUtils.lerp(0.38, rib.rTop + 0.015, Math.pow(u, 0.80));
      posWrapDer.push(r * sinA, y, r * cosA);
      uvsWrapDer.push(ir / (ribsWrapDer.length - 1), u);
    }
  }

  for (let ir = 0; ir < ribsWrapDer.length - 1; ir++) {
    for (let iu = 0; iu < segsUResp; iu++) {
      const a = ir * strideResp + iu;
      const b = (ir + 1) * strideResp + iu;
      const c = (ir + 1) * strideResp + (iu + 1);
      const d = ir * strideResp + (iu + 1);
      idxWrapDer.push(a, b, d);
      idxWrapDer.push(b, c, d);
    }
  }

  const geomWrapDer = new THREE.BufferGeometry();
  geomWrapDer.setAttribute('position', new THREE.Float32BufferAttribute(posWrapDer, 3));
  geomWrapDer.setAttribute('uv', new THREE.Float32BufferAttribute(uvsWrapDer, 2));
  geomWrapDer.setIndex(idxWrapDer);
  geomWrapDer.computeVertexNormals();

  const meshWrapDer = new THREE.Mesh(geomWrapDer, matEnvolturaExt);
  grupo.add(meshWrapDer);

  // D. Cono Facetado Conector de 14 Caras Planas (Origami Pleated Cone Underbody)
  const numCaras = 14;
  const posCono = [];
  const uvsCono = [];
  const idxCono = [];

  for (let ic = 0; ic <= numCaras; ic++) {
    const phi = (ic / numCaras) * Math.PI * 2.0;
    const sinP = Math.sin(phi);
    const cosP = Math.cos(phi);
    const factorF = Math.pow((1.0 - cosP) * 0.5, 1.5);
    const yBorde = -0.06 + factorF * 0.38;
    const rBorde = 1.05 + factorF * 0.08;

    for (let iu = 0; iu <= 3; iu++) {
      const u = iu / 3;
      const y = yCintura + (yBorde - yCintura) * u;
      const r = THREE.MathUtils.lerp(0.35, rBorde, Math.pow(u, 0.85));
      posCono.push(r * sinP, y, r * cosP);
      uvsCono.push(ic / numCaras, u);
    }
  }

  for (let ic = 0; ic < numCaras; ic++) {
    for (let iu = 0; iu < 3; iu++) {
      const a = ic * 4 + iu;
      const b = (ic + 1) * 4 + iu;
      const c = (ic + 1) * 4 + (iu + 1);
      const d = ic * 4 + (iu + 1);
      idxCono.push(a, b, d);
      idxCono.push(b, c, d);
    }
  }

  const geomCono = new THREE.BufferGeometry();
  geomCono.setAttribute('position', new THREE.Float32BufferAttribute(posCono, 3));
  geomCono.setAttribute('uv', new THREE.Float32BufferAttribute(uvsCono, 2));
  geomCono.setIndex(idxCono);
  geomCono.computeVertexNormals();

  const meshCono = new THREE.Mesh(geomCono, matEnvolturaInt);
  grupo.add(meshCono);

  // E. Faldón Origami Plisado Inferior (Pleated Origami Skirt below Ribbon)
  const numPliegues = 14;
  const geomFaldon = new THREE.CylinderGeometry(0.36, 0.56, 0.72, numPliegues, 3, true);
  const posFaldon = geomFaldon.attributes.position;
  for (let k = 0; k < posFaldon.count; k++) {
    const y = posFaldon.getY(k);
    const ang = Math.atan2(posFaldon.getZ(k), posFaldon.getX(k));
    const factorPlisado = 1.0 + 0.14 * Math.cos(ang * (numPliegues / 2)) * (0.36 - y);
    posFaldon.setX(k, posFaldon.getX(k) * factorPlisado);
    posFaldon.setZ(k, posFaldon.getZ(k) * factorPlisado);
  }
  geomFaldon.computeVertexNormals();
  const faldonMesh = new THREE.Mesh(geomFaldon, matEnvolturaExt);
  faldonMesh.position.set(0, yCintura - 0.36, 0);
  grupo.add(faldonMesh);

  // 6. Lazo de Satén de Lujo con Bucles y Cintas Planas (Fotos 1, 4 y 5)
  // A. Fajín anular ceñido en la cintura
  const cintaAnilloGeom = new THREE.CylinderGeometry(0.38, 0.38, 0.12, 36, 2, true);
  const cintaAnillo = new THREE.Mesh(cintaAnilloGeom, matLazoSaten);
  cintaAnillo.position.set(0, yCintura, 0);
  grupo.add(cintaAnillo);

  // B. Nudo central abombado con pliegues textiles
  const nudoGeom = new THREE.SphereGeometry(0.085, 14, 12);
  nudoGeom.scale(1.35, 1.0, 1.15);
  const nudoMesh = new THREE.Mesh(nudoGeom, matLazoSaten);
  nudoMesh.position.set(0, yCintura, 0.40);
  grupo.add(nudoMesh);

  // C. Dos grandes bucles tridimensionales de satén
  const ptsBucleIzq = [
    new THREE.Vector3(-0.05, yCintura, 0.40),
    new THREE.Vector3(-0.22, yCintura + 0.11, 0.48),
    new THREE.Vector3(-0.35, yCintura + 0.04, 0.45),
    new THREE.Vector3(-0.28, yCintura - 0.09, 0.41),
    new THREE.Vector3(-0.05, yCintura - 0.03, 0.40)
  ];
  const curvaBucleIzq = new THREE.CatmullRomCurve3(ptsBucleIzq, true);
  const geomBucleIzq = crearGeometriaCintaPlana(curvaBucleIzq, 0.14, 24, false);
  const bucleIzqMesh = new THREE.Mesh(geomBucleIzq, matLazoSaten);
  grupo.add(bucleIzqMesh);

  const ptsBucleDer = [
    new THREE.Vector3(0.05, yCintura, 0.40),
    new THREE.Vector3(0.22, yCintura + 0.11, 0.48),
    new THREE.Vector3(0.35, yCintura + 0.04, 0.45),
    new THREE.Vector3(0.28, yCintura - 0.09, 0.41),
    new THREE.Vector3(0.05, yCintura - 0.03, 0.40)
  ];
  const curvaBucleDer = new THREE.CatmullRomCurve3(ptsBucleDer, true);
  const geomBucleDer = crearGeometriaCintaPlana(curvaBucleDer, 0.14, 24, false);
  const bucleDerMesh = new THREE.Mesh(geomBucleDer, matLazoSaten);
  grupo.add(bucleDerMesh);

  // D. Cintas largas con caída gravitatoria y corte en V (swallowtail)
  const cintaIzqCurva = new THREE.CatmullRomCurve3([
    new THREE.Vector3(-0.04, yCintura - 0.05, 0.41),
    new THREE.Vector3(-0.15, yCintura - 0.42, 0.43),
    new THREE.Vector3(-0.10, yCintura - 0.88, 0.38),
    new THREE.Vector3(-0.22, yCintura - 1.45, 0.30)
  ]);
  const cintaDerCurva = new THREE.CatmullRomCurve3([
    new THREE.Vector3(0.04, yCintura - 0.05, 0.41),
    new THREE.Vector3(0.16, yCintura - 0.44, 0.42),
    new THREE.Vector3(0.12, yCintura - 0.90, 0.36),
    new THREE.Vector3(0.24, yCintura - 1.48, 0.28)
  ]);

  const geomCintaLargaIzq = crearGeometriaCintaPlana(cintaIzqCurva, 0.13, 28, true);
  const geomCintaLargaDer = crearGeometriaCintaPlana(cintaDerCurva, 0.13, 28, true);
  grupo.add(new THREE.Mesh(geomCintaLargaIzq, matLazoSaten), new THREE.Mesh(geomCintaLargaDer, matLazoSaten));

  // 7. Tarjeta de Floristería de Lujo prendida con Broche (Foto 3)
  const geomTarjeta = new THREE.PlaneGeometry(0.34, 0.23);
  const matTarjeta = new THREE.MeshStandardMaterial({
    color: 0xfff0f5,
    roughness: 0.40,
    metalness: 0.10,
    side: THREE.DoubleSide
  });
  const tarjetaMesh = new THREE.Mesh(geomTarjeta, matTarjeta);
  tarjetaMesh.position.set(0.22, yCintura + 0.16, 0.44);
  tarjetaMesh.rotation.set(-0.20, 0.28, -0.16);
  grupo.add(tarjetaMesh);

  return grupo;
}

// ─────────────────────────────────────────────────────────
// PÉTALOS SUELTOS CAYENDO (INSTANCEDMESH)
// ─────────────────────────────────────────────────────────

function crearInstancedPetalosCayendo(material) {
  const count = 60;
  const geomPetalo = new THREE.PlaneGeometry(0.24, 0.32, 6, 6);
  const pos = geomPetalo.attributes.position;
  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i);
    const y = pos.getY(i);
    pos.setZ(i, -0.08 * (1.0 - (x / 0.12) * (x / 0.12)) + Math.sin(y * 4.0) * 0.025);
  }
  geomPetalo.computeVertexNormals();

  const colors = [];
  const cP = new THREE.Color(0x861338);
  for (let i = 0; i < geomPetalo.attributes.position.count; i++) {
    colors.push(cP.r, cP.g, cP.b);
  }
  geomPetalo.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));

  const instancedMesh = new THREE.InstancedMesh(geomPetalo, material, count);
  instancedMesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);

  const dummy = new THREE.Object3D();
  const datosFisica = [];

  for (let i = 0; i < count; i++) {
    datosFisica.push({
      activo: false,
      pos: new THREE.Vector3(0, -999, 0),
      vel: new THREE.Vector3(0, 0, 0),
      rot: new THREE.Euler(0, 0, 0),
      rotVel: new THREE.Vector3(0, 0, 0),
      escala: 1.0
    });

    dummy.position.set(0, -999, 0);
    dummy.scale.set(0, 0, 0);
    dummy.updateMatrix();
    instancedMesh.setMatrixAt(i, dummy.matrix);
  }

  instancedMesh.instanceMatrix.needsUpdate = true;

  const activarSlot = (i) => {
    datosFisica[i].activo = true;
    datosFisica[i].pos.set(
      (Math.random() - 0.5) * 1.5,
      0.75 + Math.random() * 0.45,
      (Math.random() - 0.5) * 1.2 + 0.2
    );
    datosFisica[i].vel.set(
      (Math.random() - 0.5) * 0.018,
      -0.022 - Math.random() * 0.016,
      (Math.random() - 0.5) * 0.018
    );
    datosFisica[i].rot.set(Math.random() * Math.PI, Math.random() * Math.PI, Math.random() * Math.PI);
    datosFisica[i].rotVel.set(
      (Math.random() - 0.5) * 0.035,
      (Math.random() - 0.5) * 0.035,
      (Math.random() - 0.5) * 0.035
    );
    datosFisica[i].escala = 0.85 + Math.random() * 0.45;
  };

  return {
    mesh: instancedMesh,
    datos: datosFisica,
    dummy: dummy,
    dispararPetalos(cantidad = 5) {
      let activados = 0;
      // 1. Activar slots inactivos
      for (let i = 0; i < count && activados < cantidad; i++) {
        if (!datosFisica[i].activo) {
          activarSlot(i);
          activados++;
        }
      }
      // 2. Si se acabaron los slots libres, reciclar los que ya cayeron más abajo
      if (activados < cantidad) {
        const candidatos = datosFisica
          .map((p, idx) => ({ idx, y: p.pos.y }))
          .sort((a, b) => a.y - b.y);
        for (let k = 0; k < candidatos.length && activados < cantidad; k++) {
          activarSlot(candidatos[k].idx);
          activados++;
        }
      }
    },
    actualizar() {
      let huboCambios = false;
      for (let i = 0; i < count; i++) {
        const p = datosFisica[i];
        if (!p.activo) continue;

        p.pos.add(p.vel);
        p.pos.x += Math.sin(Date.now() * 0.002 + i) * 0.003;
        p.rot.x += p.rotVel.x;
        p.rot.y += p.rotVel.y;
        p.rot.z += p.rotVel.z;

        if (p.pos.y < -3.5) {
          p.activo = false;
          dummy.position.set(0, -999, 0);
          dummy.scale.set(0, 0, 0);
        } else {
          dummy.position.copy(p.pos);
          dummy.rotation.copy(p.rot);
          dummy.scale.setScalar(p.escala);
        }

        dummy.updateMatrix();
        instancedMesh.setMatrixAt(i, dummy.matrix);
        huboCambios = true;
      }
      if (huboCambios) {
        instancedMesh.instanceMatrix.needsUpdate = true;
      }
    }
  };
}

// ─────────────────────────────────────────────────────────
// FUNCIÓN MODULAR EXPORTADA: CONSTRUIR RAMO COMPLETO (12 ROSAS)
// ─────────────────────────────────────────────────────────
export function construirRamo12({ normalMap, aperturaInicial = 0.55 } = {}) {
  const ramoGrupo = new THREE.Group();
  const rosas = [];
  const materialesPetalo = [];

  // 12 rosas en arreglo natural de floristería en cúpula escalonada y densa
  const distribucion12 = [
    // Rosa 0: Centro superior (Mes 1) — Tallo alto, corazón en espiral denso
    { pos: new THREE.Vector3(0, 0.54, 0.0), rot: new THREE.Euler(0.05, 0, 0), escala: 0.88, tipo: 'central' },

    // Anillo intermedio: 4 rosas (Meses 2, 3, 4, 5) — En copa equilibrada tocando el centro
    { pos: new THREE.Vector3(-0.26, 0.44, 0.24), rot: new THREE.Euler(0.18, -0.34, 0.10), escala: 0.84, tipo: 'intermedia' },
    { pos: new THREE.Vector3(0.26, 0.43, 0.24),  rot: new THREE.Euler(0.18, 0.34, -0.10), escala: 0.84, tipo: 'intermedia' },
    { pos: new THREE.Vector3(0.26, 0.45, -0.24), rot: new THREE.Euler(-0.16, 0.34, -0.10), escala: 0.84, tipo: 'intermedia' },
    { pos: new THREE.Vector3(-0.26, 0.45, -0.24), rot: new THREE.Euler(-0.16, -0.34, 0.10), escala: 0.84, tipo: 'intermedia' },

    // Anillo perimetral: 7 rosas (Meses 6 al 12) — Distribución amplia que abraza el cáliz sin huecos
    { pos: new THREE.Vector3(0.00, 0.26, 0.65),   rot: new THREE.Euler(0.36, 0.00, 0.00),    escala: 0.83, tipo: 'perimetral' },
    { pos: new THREE.Vector3(0.50, 0.25, 0.42),   rot: new THREE.Euler(0.26, 0.50, -0.22),  escala: 0.82, tipo: 'perimetral' },
    { pos: new THREE.Vector3(0.64, 0.28, -0.14),  rot: new THREE.Euler(-0.08, 0.74, -0.32), escala: 0.82, tipo: 'perimetral' },
    { pos: new THREE.Vector3(0.29, 0.32, -0.58),  rot: new THREE.Euler(-0.30, 0.38, -0.16), escala: 0.82, tipo: 'perimetral' },
    { pos: new THREE.Vector3(-0.29, 0.32, -0.58), rot: new THREE.Euler(-0.30, -0.38, 0.16), escala: 0.82, tipo: 'perimetral' },
    { pos: new THREE.Vector3(-0.64, 0.28, -0.14), rot: new THREE.Euler(-0.08, -0.74, 0.32), escala: 0.82, tipo: 'perimetral' },
    { pos: new THREE.Vector3(-0.50, 0.25, 0.42),  rot: new THREE.Euler(0.26, -0.50, 0.22),  escala: 0.82, tipo: 'perimetral' },
  ];

  const posicionesParaTallos = [];
  const materialesBotanicos = crearMaterialesRosa(normalMap);
  if (materialesBotanicos.matPetalos.userData.uClipEnvoltura) {
    materialesBotanicos.matPetalos.userData.uClipEnvoltura.value = 1.0;
  }
  const uRamoInvMat = materialesBotanicos.matPetalos.userData.uRamoInverseMatrix
    ? materialesBotanicos.matPetalos.userData.uRamoInverseMatrix.value
    : null;
  materialesPetalo.push(materialesBotanicos.matPetalos);

  distribucion12.forEach((cfg, index) => {
    const esPrimerPlano = index < 6;
    const { petalosGeom, calizGeom, gotasGeom } = construirRosaGeometria({
      calidadAlta: esPrimerPlano,
      seed: index * 14.4,
      tipo: cfg.tipo,
      incluirRocio: false
    });

    const meshPetalos = new THREE.Mesh(petalosGeom, materialesBotanicos.matPetalos);
    if (uRamoInvMat) {
      meshPetalos.onBeforeRender = () => {
        uRamoInvMat.copy(ramoGrupo.matrixWorld).invert();
      };
    }
    const meshCaliz = new THREE.Mesh(calizGeom, materialesBotanicos.matCaliz);

    const florGrupo = new THREE.Group();
    florGrupo.add(meshPetalos, meshCaliz);

    // Gotas de rocío matutino translúcidas en los pétalos
    let meshGotas = null;
    if (gotasGeom && materialesBotanicos.matRocio) {
      meshGotas = new THREE.Mesh(gotasGeom, materialesBotanicos.matRocio);
      meshGotas.scale.set(0.001, 0.001, 0.001); // Se escala con la floración
      florGrupo.add(meshGotas);
    }

    florGrupo.position.copy(cfg.pos);
    florGrupo.rotation.copy(cfg.rot);
    florGrupo.scale.setScalar(cfg.escala);

    meshPetalos.userData = { rosaIndex: index };
    meshCaliz.userData = { rosaIndex: index };
    florGrupo.userData = { rosaIndex: index };

    // Función de apertura botánica continua (0.0 = capullo cerrado, 0.5 = semiabierta, 1.0 = abierta plena)
    const setApertura = (progreso) => {
      const p = Math.max(0.0, Math.min(1.0, progreso));
      if (!meshPetalos.morphTargetInfluences) return;
      if (p <= 0.5) {
        const t = p / 0.5;
        meshPetalos.morphTargetInfluences[0] = 1.0 - t;
        meshPetalos.morphTargetInfluences[1] = t;
      } else {
        const t = (p - 0.5) / 0.5;
        meshPetalos.morphTargetInfluences[0] = 0.0;
        meshPetalos.morphTargetInfluences[1] = 1.0 - t;
      }
    };

    setApertura(aperturaInicial);

    ramoGrupo.add(florGrupo);
    rosas.push({
      mesh: meshPetalos,
      grupo: florGrupo,
      material: materialesBotanicos.matPetalos,
      meshGotas,
      index,
      posOriginal: cfg.pos.clone(),
      rotOriginal: cfg.rot.clone(),
      setApertura
    });
    posicionesParaTallos.push(cfg.pos);
  });

  const envolturaGrupo = crearTallosYEnvoltura(posicionesParaTallos);
  ramoGrupo.add(envolturaGrupo);

  return { ramoGrupo, rosas, materialesPetalo, envolturaGrupo };
}

// ─────────────────────────────────────────────────────────
// CLASE PRINCIPAL: ESCENAROSAS
// ─────────────────────────────────────────────────────────

export class EscenaRosas {
  constructor(canvas) {
    this.canvas = canvas;
    this.rosas = [];
    this.materialesPetalo = [];
    this.aperturaTimeline = null;
    this.petalosSistema = null;

    // En móviles (como iPhone 11 / Pro / Max), adaptamos la perspectiva
    const w = typeof window !== 'undefined' ? window.innerWidth : 414;
    const h = typeof window !== 'undefined' ? window.innerHeight : 896;
    const esMovil = w < 600 || (w / h < 0.85);

    // Ángulo de cámara favorecedor
    this.rotacionObjetivo = { x: esMovil ? 0.22 : 0.18, y: 0.0 };
    this.rotacionActual   = { x: esMovil ? 0.22 : 0.18, y: 0.0 };
    this.distanciaCamara  = esMovil ? 6.2 : 5.4;
    this.distanciaObjetivo = esMovil ? 6.2 : 5.4;
    this.tiempo = 0;

    this.iniciar();
  }

  iniciar() {
    this.renderer = new THREE.WebGLRenderer({
      canvas: this.canvas,
      antialias: true,
      alpha: true,
      powerPreference: 'high-performance'
    });

    const dpr = Math.min(window.devicePixelRatio || 1, CONFIG.calidad.pixelRatioMax);
    this.renderer.setPixelRatio(dpr);
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.08;
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;

    this.escena = new THREE.Scene();

    const w = window.innerWidth;
    const h = window.innerHeight;
    const esMovil = w < 600 || (w / h < 0.85);

    this.camara = new THREE.PerspectiveCamera(40, w / h, 0.1, 50);
    this.camara.position.set(0, 1.35, this.distanciaCamara);
    this.camara.lookAt(0, esMovil ? 0.55 : 0.20, 0);

    // Grupo del ramo centrado en la mitad superior de la pantalla
    this.ramoGrupo = new THREE.Group();
    this.ramoGrupo.position.set(0, esMovil ? 0.72 : 0.20, 0);
    this.escena.add(this.ramoGrupo);

    this.crearBlobShadow();

    this.normalMap = generarNormalMapProcedural();

    this.construir12Rosas();

    this.configurarIluminacion();

    const matPetaloGen = crearMaterialPetalos(this.normalMap);
    this.petalosSistema = crearInstancedPetalosCayendo(matPetaloGen);
    this.escena.add(this.petalosSistema.mesh);

    this.configurarInteraccion();
    window.addEventListener('resize', this.onResize.bind(this));
  }

  crearBlobShadow() {
    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 256;
    const ctx = canvas.getContext('2d');
    const grad = ctx.createRadialGradient(128, 128, 0, 128, 128, 120);
    grad.addColorStop(0, 'rgba(8, 0, 12, 0.65)');
    grad.addColorStop(0.5, 'rgba(8, 0, 12, 0.30)');
    grad.addColorStop(1, 'rgba(8, 0, 12, 0)');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 256, 256);

    const shadowTex = new THREE.CanvasTexture(canvas);
    const shadowGeom = new THREE.PlaneGeometry(3.0, 3.0);
    const shadowMat = new THREE.MeshBasicMaterial({
      map: shadowTex,
      transparent: true,
      depthWrite: false
    });
    const shadowMesh = new THREE.Mesh(shadowGeom, shadowMat);
    shadowMesh.rotation.x = -Math.PI * 0.5;
    shadowMesh.position.set(0, -2.2, 0);
    this.ramoGrupo.add(shadowMesh);
  }

  configurarIluminacion() {
    const ambientLight = new THREE.AmbientLight(0x1a0518, 0.45);
    this.escena.add(ambientLight);

    // Luz clave cálida frontal/lateral que modela la curvatura de los pétalos
    this.luzClave = new THREE.DirectionalLight(0xfff0e4, 1.65);
    this.luzClave.position.set(2.6, 4.8, 3.6);
    this.escena.add(this.luzClave);

    // Luz de acento cenital suave hacia el corazón del ramo
    const spotLuz = new THREE.SpotLight(0xffdfcc, 1.2, 14, Math.PI * 0.35, 0.65, 1.0);
    spotLuz.position.set(0, 4.5, 2.2);
    spotLuz.target = this.ramoGrupo;
    this.escena.add(spotLuz);

    // Luz rim para contornos definidos de pétalos
    this.luzRim = new THREE.DirectionalLight(0xda6888, 1.35);
    this.luzRim.position.set(-3.2, 3.4, -2.8);
    this.escena.add(this.luzRim);

    // Luz de relleno cálida suave para evitar sombras negras duras
    this.luzRelleno = new THREE.DirectionalLight(0x2d0d2b, 0.55);
    this.luzRelleno.position.set(0, -2.2, 2.2);
    this.escena.add(this.luzRelleno);

    const pmremGenerator = new THREE.PMREMGenerator(this.renderer);
    pmremGenerator.compileEquirectangularShader();

    new HDRLoader().load(
      '/environment.hdr',
      (texture) => {
        const envMap = pmremGenerator.fromEquirectangular(texture).texture;
        this.escena.environment = envMap;
        texture.dispose();
        pmremGenerator.dispose();
      },
      undefined,
      (err) => {
        console.warn('HDRI local no disponible, utilizando iluminación analítica.', err);
      }
    );
  }

  construir12Rosas() {
    const { ramoGrupo: grupo, rosas, materialesPetalo, envolturaGrupo } = construirRamo12({
      normalMap: this.normalMap,
      aperturaInicial: 0.55
    });

    this.ramoGrupo.add(grupo);
    this.rosas = rosas;
    this.materialesPetalo.push(...materialesPetalo);
    this.envolturaGrupo = envolturaGrupo;
  }

  abrirRamo(duracion = 4.0) {
    if (this.aperturaTimeline) this.aperturaTimeline.kill();
    this.aperturaTimeline = gsap.timeline();

    this.rosas.forEach((item, i) => {
      const delayIndividual = (i === 0 ? 0 : 0.06 + (i * 0.06));

      // De semiabierta fresca (morph 1 = 0.55) a abierta plena (morph 1 = 0.0)
      this.aperturaTimeline.to(
        item.mesh.morphTargetInfluences,
        {
          0: 0.0,
          1: 0.0,
          duration: duracion * 0.75,
          ease: 'power2.out'
        },
        delayIndividual
      );

      // Desplegar las gotas de rocío brillantes con la flor abierta
      if (item.meshGotas) {
        this.aperturaTimeline.to(
          item.meshGotas.scale,
          {
            x: 1.0,
            y: 1.0,
            z: 1.0,
            duration: duracion * 0.50,
            ease: 'back.out(1.4)'
          },
          delayIndividual + duracion * 0.20
        );
      }
    });

    gsap.to(this.luzClave, { intensity: 2.9, duration: duracion });
  }

  iluminarRosa(mesIndex) {
    this.rosas.forEach((item, idx) => {
      const esEsta = idx === mesIndex;
      const targetVal = esEsta ? 1.0 : 0.0;

      // Efecto shader de micro-resplandor terciopelo
      if (item.material.userData && item.material.userData.shader && item.material.userData.shader.uniforms.uHighlight) {
        gsap.to(item.material.userData.shader.uniforms.uHighlight, {
          value: targetVal,
          duration: 0.6,
          ease: 'power2.out'
        });
      } else {
        const targetColor = esEsta ? new THREE.Color(0x72061e) : new THREE.Color(0x000000);
        gsap.to(item.material.emissive, {
          r: targetColor.r,
          g: targetColor.g,
          b: targetColor.b,
          duration: 0.6
        });
      }

      if (esEsta) {
        // Micro-reacción de escala orgánica sin romper la conexión con el tallo
        gsap.timeline()
          .to(item.mesh.scale, {
            x: 1.12,
            y: 1.12,
            z: 1.12,
            duration: 0.35,
            ease: 'back.out(2.0)'
          })
          .to(item.mesh.scale, {
            x: 1.0,
            y: 1.0,
            z: 1.0,
            duration: 0.55,
            ease: 'power2.inOut'
          });
      }
    });
  }

  destacarRosa(index) {
    const item = this.rosas[index];
    if (!item) return;

    // 1. Resaltar con brillo carmesí
    this.iluminarRosa(index);

    // 2. Liberar pétalos cayendo
    this.soltarPetalos(8);

    // 3. Vibración/pulso botánico natural en su propia posición (SIN flotar ni separarse del tallo)
    if (item.grupo && item.rotOriginal) {
      gsap.killTweensOf(item.grupo.rotation);
      gsap.timeline()
        .to(item.grupo.rotation, {
          x: item.rotOriginal.x + 0.08,
          z: item.rotOriginal.z + (index % 2 === 0 ? 0.06 : -0.06),
          duration: 0.25,
          ease: 'power1.out'
        })
        .to(item.grupo.rotation, {
          x: item.rotOriginal.x,
          z: item.rotOriginal.z,
          duration: 0.65,
          ease: 'elastic.out(1, 0.4)'
        });
    }
  }

  soltarPetalos(cantidad = 5) {
    if (this.petalosSistema) {
      this.petalosSistema.dispararPetalos(cantidad);
    }
  }

  setFase(fase) {
    if (fase === 'perdon') {
      this.soltarPetalos(4);
    } else if (fase === 'cambio') {
      this.rosas.forEach((item) => {
        gsap.to(item.mesh.morphTargetInfluences, {
          0: 0.0,
          1: 1.0,
          duration: 3.5,
          ease: 'power2.out'
        });
      });
      gsap.to(this.luzClave, { intensity: 3.2, duration: 3.0 });
      gsap.to(this.luzRim, { intensity: 3.5, duration: 3.0 });
    }
  }

  configurarInteraccion() {
    let arrastrando = false;
    let anteriorX = 0;
    let anteriorY = 0;
    let startX = 0;
    let startY = 0;

    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();

    const onPointerDown = (e) => {
      arrastrando = true;
      startX = e.clientX ?? (e.touches && e.touches[0].clientX) ?? 0;
      startY = e.clientY ?? (e.touches && e.touches[0].clientY) ?? 0;
      anteriorX = startX;
      anteriorY = startY;
    };

    const onPointerMove = (e) => {
      if (!arrastrando) return;
      const x = e.clientX ?? (e.touches && e.touches[0].clientX) ?? 0;
      const y = e.clientY ?? (e.touches && e.touches[0].clientY) ?? 0;
      const deltaX = x - anteriorX;
      const deltaY = y - anteriorY;
      anteriorX = x;
      anteriorY = y;

      this.rotacionObjetivo.y += deltaX * 0.007;
      this.rotacionObjetivo.x = Math.max(0.10, Math.min(0.65, this.rotacionObjetivo.x + deltaY * 0.005));
    };

    const canvas = this.canvas;

    const onPointerUp = (e) => {
      arrastrando = false;
      const endX = (e.changedTouches && e.changedTouches[0]) ? e.changedTouches[0].clientX : (e.clientX ?? anteriorX);
      const endY = (e.changedTouches && e.changedTouches[0]) ? e.changedTouches[0].clientY : (e.clientY ?? anteriorY);
      const dist = Math.hypot(endX - startX, endY - startY);

      if (dist < 8) {
        // Clic o Tap directo sobre el canvas de rosas
        const rect = canvas.getBoundingClientRect();
        mouse.x = ((endX - rect.left) / rect.width) * 2 - 1;
        mouse.y = -((endY - rect.top) / rect.height) * 2 + 1;

        raycaster.setFromCamera(mouse, this.camara);
        const meshes = this.rosas.map(r => r.mesh);
        const intersects = raycaster.intersectObjects(meshes, false);

        if (intersects.length > 0) {
          const hit = intersects[0].object;
          const rIndex = hit.userData?.rosaIndex;
          if (rIndex !== undefined) {
            this.destacarRosa(rIndex);
            if (typeof this.onRosaClick === 'function') {
              this.onRosaClick(rIndex);
            }
          }
        }
      }
    };

    canvas.addEventListener('mousedown', onPointerDown);
    window.addEventListener('mousemove', onPointerMove);
    window.addEventListener('mouseup', onPointerUp);

    canvas.addEventListener('touchstart', onPointerDown, { passive: true });
    window.addEventListener('touchmove', onPointerMove, { passive: true });
    window.addEventListener('touchend', onPointerUp);

    window.addEventListener('wheel', (e) => {
      this.distanciaObjetivo = Math.max(3.8, Math.min(8.0, this.distanciaObjetivo + e.deltaY * 0.003));
    }, { passive: true });
  }

  onResize() {
    const w = window.innerWidth;
    const h = window.innerHeight;
    this.camara.aspect = w / h;
    this.camara.updateProjectionMatrix();

    const esMovil = w < 600 || (w / h < 0.85);
    this.distanciaObjetivo = esMovil ? 6.2 : 5.4;
    if (this.ramoGrupo) {
      this.ramoGrupo.position.y = esMovil ? 0.72 : 0.20;
    }

    const dpr = Math.min(window.devicePixelRatio || 1, CONFIG.calidad.pixelRatioMax);
    this.renderer.setPixelRatio(dpr);
    this.renderer.setSize(w, h);
  }

  modoDetalleRamo(activar, vistaDespejada = false) {
    this.enModoDetalle = activar;
    this.enVistaDespejada = vistaDespejada;
    const w = window.innerWidth;
    const h = window.innerHeight;
    const esMovil = w < 600 || (w / h < 0.85);

    if (activar) {
      this.autoGiro = true;
      const targetY = vistaDespejada ? (esMovil ? 0.38 : 0.28) : (esMovil ? 0.25 : 0.12);
      const targetDist = vistaDespejada ? (esMovil ? 5.2 : 4.6) : (esMovil ? 4.3 : 3.7);
      const targetRotX = vistaDespejada ? (esMovil ? 0.22 : 0.18) : 0.32;

      gsap.to(this.ramoGrupo.position, {
        y: targetY,
        duration: 1.3,
        ease: 'power2.inOut'
      });
      gsap.to(this, {
        distanciaObjetivo: targetDist,
        duration: 1.3,
        ease: 'power2.inOut'
      });
      this.rotacionObjetivo.x = targetRotX;
    } else {
      this.autoGiro = false;
      this.enVistaDespejada = false;
      gsap.to(this.ramoGrupo.position, {
        y: esMovil ? 0.72 : 0.20,
        duration: 1.2,
        ease: 'power2.inOut'
      });
      gsap.to(this, {
        distanciaObjetivo: esMovil ? 6.2 : 5.4,
        duration: 1.2,
        ease: 'power2.inOut'
      });
      this.rotacionObjetivo.x = esMovil ? 0.22 : 0.18;
      this.rotacionObjetivo.y = 0.0;
    }
  }

  actualizar() {
    this.tiempo += 0.016;

    // Giroscopio / auto turntable cuando está en modo detalle o paseo
    if (this.autoGiro) {
      this.rotacionObjetivo.y += 0.012;
    }

    this.rotacionActual.x += (this.rotacionObjetivo.x - this.rotacionActual.x) * 0.08;
    this.rotacionActual.y += (this.rotacionObjetivo.y - this.rotacionActual.y) * 0.08;

    this.distanciaCamara += (this.distanciaObjetivo - this.distanciaCamara) * 0.05;
    const respiracion = Math.sin(this.tiempo * 0.8) * 0.03;

    this.ramoGrupo.rotation.x = this.rotacionActual.x + Math.sin(this.tiempo * 0.5) * 0.008;
    this.ramoGrupo.rotation.y = this.rotacionActual.y + this.tiempo * 0.018;

    // Brisa orgánica suave sobre cada cabeza de rosa (idle breeze)
    this.rosas.forEach((item, i) => {
      if (item.grupo && item.rotOriginal) {
        const t = this.tiempo * 1.35 + i * 0.75;
        item.grupo.rotation.z = item.rotOriginal.z + Math.sin(t) * 0.014;
        item.grupo.rotation.x = item.rotOriginal.x + Math.cos(t * 0.85) * 0.009;
      }
    });

    const esMovil = window.innerWidth < 600 || (window.innerWidth / window.innerHeight < 0.85);
    this.camara.position.z = this.distanciaCamara + respiracion;
    const lookY = this.enModoDetalle
      ? (this.enVistaDespejada ? -0.20 : (esMovil ? 0.20 : 0.10))
      : (esMovil ? 0.55 : 0.25);
    this.camara.lookAt(0, lookY, 0);

    if (this.petalosSistema) {
      this.petalosSistema.actualizar();
    }

    this.renderer.render(this.escena, this.camara);
  }

  destruir() {
    window.removeEventListener('resize', this.onResize);
    this.renderer.dispose();
  }
}
