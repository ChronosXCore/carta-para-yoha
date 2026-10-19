/**
 * rose-anatomy.js — Motor geométrico de rosa fotorrealista con anatomía botánica real.
 * 
 * Hallmarks anatómicos de una rosa auténtica:
 * 1. Silueta de copa/ovoide (altura ≈ 1.15-1.25x ancho en semiabierta; ≈ 1:1 en abierta).
 * 2. Remolino central cerrado (núcleo en espiral cónica muy envolvente).
 * 3. Pétalos obovados anchos (W/H ≈ 1.0-1.15), base estrecha (~35%) y ápice redondeado.
 * 4. Curvatura en cuchara: concavidad transversal profunda y solapamiento del ~40%.
 * 5. Bordes superiores de pétalos exteriores reflexos (doblados hacia atrás 25°-45°).
 * 6. Filotaxia floral de 144° (2/5).
 * 7. Receptáculo verde ovoide en la base y 5 sépalos puntiagudos reflexos (doblados hacia abajo).
 * 8. Tallo curvado con espinas y hojas de 3 folíolos aserrados.
 */

import * as THREE from 'three';

// ─────────────────────────────────────────────────────────────
// NORMAL MAP PROCEDURAL DE MICRO-VENAS
// ─────────────────────────────────────────────────────────────
export function generarNormalMapPetalos(res = 512) {
  const canvas = document.createElement('canvas');
  canvas.width = res;
  canvas.height = res;
  const ctx = canvas.getContext('2d');

  const imgData = ctx.createImageData(res, res);
  const data = imgData.data;

  for (let y = 0; y < res; y++) {
    const v = y / res; // longitudinal (base -> ápice)
    for (let x = 0; x < res; x++) {
      const u = (x / res - 0.5) * 2.0; // transversal (-1 -> +1)
      
      // Venas suaves divergentes en abanico a lo largo del pétalo
      const ray = u / (0.35 + 0.65 * v);
      const veinMajor = Math.sin(ray * 42.0) * 0.28;
      const veinMinor = Math.sin(ray * 96.0 + Math.sin(v * 16.0)) * 0.12;

      const dx = (Math.cos(ray * 42.0) * 0.28 + Math.cos(ray * 96.0) * 0.12) * 0.05;
      const dy = 0.015;

      const norm = new THREE.Vector3(-dx, -dy, 1.0).normalize();

      const idx = (y * res + x) * 4;
      data[idx] = ((norm.x * 0.5 + 0.5) * 255) | 0;
      data[idx + 1] = ((norm.y * 0.5 + 0.5) * 255) | 0;
      data[idx + 2] = ((norm.z * 0.5 + 0.5) * 255) | 0;
      data[idx + 3] = 255;
    }
  }

  ctx.putImageData(imgData, 0, 0);
  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.ClampToEdgeWrapping;
  texture.wrapT = THREE.ClampToEdgeWrapping;
  texture.needsUpdate = true;
  return texture;
}

// ─────────────────────────────────────────────────────────────
// MATERIALES TERCIOPELO Y SÉPALOS
// ─────────────────────────────────────────────────────────────
export function crearMaterialesRosa(normalMapPetalos) {
  // 1. Material de los pétalos (Sheen aterciopelado carmesí + Subsurface Scattering real)
  const matPetalos = new THREE.MeshPhysicalMaterial({
    vertexColors: true,
    roughness: 0.44,
    metalness: 0.01,
    sheen: 1.0,
    sheenColor: new THREE.Color(0x880e28), // Sheen de terciopelo carmesí profundo (NO rosado)
    sheenRoughness: 0.32,
    side: THREE.DoubleSide,
    normalMap: normalMapPetalos,
    normalScale: new THREE.Vector2(0.12, 0.12),
    envMapIntensity: 0.65,
  });

  matPetalos.userData.uClipEnvoltura = { value: 0.0 };
  matPetalos.userData.uRamoInverseMatrix = { value: new THREE.Matrix4() };

  matPetalos.onBeforeCompile = (shader) => {
    shader.uniforms.uHighlight = { value: 0.0 };
    shader.uniforms.uClipEnvoltura = matPetalos.userData.uClipEnvoltura;
    shader.uniforms.uRamoInverseMatrix = matPetalos.userData.uRamoInverseMatrix;

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
      uniform float uHighlight;
      uniform float uClipEnvoltura;
      uniform mat4 uRamoInverseMatrix;
      varying vec3 vWorldNormal;
      varying vec3 vWorldPosition;
      ${shader.fragmentShader}
    `;

    shader.fragmentShader = shader.fragmentShader.replace(
      '#include <clipping_planes_fragment>',
      `
      #include <clipping_planes_fragment>

      // Recorte adaptativo: descarta exclusivamente los fragmentos de pétalo que atraviesan la pared del papel hacia afuera
      if (uClipEnvoltura > 0.5) {
        vec4 localPos4 = uRamoInverseMatrix * vec4(vWorldPosition, 1.0);
        vec3 localPos = localPos4.xyz;
        float r = length(localPos.xz);
        float y = localPos.y;

        float cz = (r > 0.001) ? (localPos.z / r) : 0.0;
        // Altura del borde superior del envoltorio según la dirección angular:
        float yBorde = (cz < 0.0) ? (0.42 - 0.73 * cz) : (0.42 - 0.48 * cz);

        if (y <= yBorde) {
          float ty = clamp((y + 0.72) / max(yBorde + 0.72, 0.001), 0.0, 1.0);
          float rBorde = (cz < 0.0) ? (1.14 - 0.20 * cz) : (1.14 - 0.10 * cz);
          float rPared = mix(0.36, rBorde, pow(ty, 0.82));
          if (r > (rPared - 0.015)) {
            discard;
          }
        }
      }
      `
    );

    shader.fragmentShader = shader.fragmentShader.replace(
      '#include <dithering_fragment>',
      `
      #include <dithering_fragment>

      // Subsurface Scattering (SSS) cálido a contraluz
      vec3 lightBack = normalize(vec3(0.3, 0.8, -0.6));
      vec3 viewDir = normalize(cameraPosition - vWorldPosition);
      float backlight = pow(clamp(dot(viewDir, -lightBack), 0.0, 1.0), 2.8);
      vec3 sssGlow = vec3(0.48, 0.03, 0.10) * backlight * 0.18;
      gl_FragColor.rgb += sssGlow;

      // Rim de terciopelo carmesí profundo (sin sobreiluminar los bordes)
      float NdotV = abs(dot(viewDir, normalize(vWorldNormal)));
      float velvetFresnel = pow(1.0 - clamp(NdotV, 0.0, 1.0), 3.2);
      vec3 velvetColor = vec3(0.55, 0.04, 0.14) * velvetFresnel * 0.14;
      gl_FragColor.rgb += velvetColor;

      if (uHighlight > 0.001) {
        gl_FragColor.rgb += vec3(0.42, 0.14, 0.32) * uHighlight;
      }
      `
    );
  };

  // 2. Material botánico de sépalos y receptáculo (verde satinado natural)
  const matCaliz = new THREE.MeshStandardMaterial({
    color: 0x22481e,
    roughness: 0.45,
    metalness: 0.02,
    side: THREE.DoubleSide,
    bumpScale: 0.02
  });

  // 3. Material de tallos y espinas
  const matTallo = new THREE.MeshStandardMaterial({
    color: 0x1f421c,
    roughness: 0.52,
    metalness: 0.01,
  });

  const matEspina = new THREE.MeshStandardMaterial({
    color: 0x4a241b,
    roughness: 0.38,
    metalness: 0.04,
  });

  // 4. Material de rocío matutino (micro-gotas reflectantes con IOR de agua 1.33)
  const matRocio = new THREE.MeshPhysicalMaterial({
    color: 0xffffff,
    roughness: 0.04,
    metalness: 0.05,
    transmission: 0.92,
    ior: 1.333,
    reflectivity: 0.95,
    clearcoat: 1.0,
    clearcoatRoughness: 0.03,
  });

  return { matPetalos, matCaliz, matTallo, matEspina, matRocio };
}

// ─────────────────────────────────────────────────────────────
// CÁLCULO PARAMÉTRICO DE PÉTALO DE ROSA OBOVADO EN FORMA DE CUCHARA
// ─────────────────────────────────────────────────────────────
/**
 * u in [0, 1] : longitudinalmente desde el cáliz hasta el ápice del pétalo
 * v in [-1, 1]: transversalmente desde el borde izquierdo al derecho
 * stage: 0 = capullo cerrado, 1 = semiabierta, 2 = abierta plena
 */
function calcularPuntoPetaloAnatomico(u, v, stage, props) {
  const {
    capa,
    phi0,
    rAttach,
    hLength,
    wArcSpan,
    flareAngle,
    cupDepth,
    rollBack,
    seed = 0
  } = props;

  const capaRatio = capa / 4.0;

  // 1. Perfil de anchura de pétalo esbelto y alargado (Rosa de floristería Hybrid Tea)
  // Base estrecha donde se inserta al receptáculo, silueta estilizada y alargada
  // que culmina con hombros bien definidos y el pico reflexo clásico
  let widthProfile;
  if (u < 0.68) {
    widthProfile = 0.16 + 0.84 * Math.sin((u / 0.68) * (Math.PI * 0.5));
  } else {
    const tTop = (u - 0.68) / 0.32;
    widthProfile = 1.0 - 0.20 * Math.sin(tTop * (Math.PI * 0.5));
  }

  // Pico reflexo anatómico central en el ápice (característico de la rosa real de floristería)
  const apexPinch = Math.exp(-Math.pow(v * 2.6, 2.0)) * 0.040 * Math.pow(u, 2.0);
  const apexHeight = 1.0 - 0.040 * (v * v) + apexPinch;
  const uEff = u * apexHeight;

  // Micro-ondulaciones y ruffling suave en los márgenes de pétalos exteriores
  let ruffling = 0;
  if (capa >= 2 && u > 0.40) {
    const uRuffle = (u - 0.40) / 0.60;
    const wave = Math.sin(v * 9.0 + seed * 1.2) * Math.cos(v * 3.5);
    ruffling = wave * (0.016 * Math.pow(uRuffle, 1.8) * (1.0 - 0.12 * v * v));
  }

  // Curvatura lateral hacia afuera de los bordes del pétalo (separa visualmente pétalos superpuestos)
  const edgeCurl = Math.pow(Math.max(0.0, Math.abs(v) - 0.38) / 0.62, 1.8);

  // 2. Curvatura en copa esbelta y reflejo según la etapa
  let angleTilt;
  let cup;
  let reflexY = 0;
  let reflexR = 0;

  if (stage === 0) {
    // ── CAPULLO FRESCO DE FLORISTERÍA (Alargado y esbelto con volumen firme) ──
    angleTilt = 0.04 + 0.18 * capaRatio;
    const belly = (0.04 + 0.07 * capaRatio) * Math.sin(uEff * Math.PI) * (1.0 - 0.25 * v * v);
    cup = (0.08 + 0.05 * capaRatio) * (1.0 - 0.55 * v * v) * Math.sin(uEff * Math.PI * 0.95);
    reflexR = -Math.pow(uEff, 1.8) * (0.02 + 0.03 * capaRatio) + belly;
    reflexY = 0.0;
  } else if (stage === 1) {
    // ── SEMIABIERTA ELEGANTE / CHALICE (Copa alta y esbelta con corazón en espiral) ──
    angleTilt = flareAngle * 0.60;
    const belly = (0.03 + 0.05 * capaRatio) * Math.sin(uEff * Math.PI) * (1.0 - 0.25 * v * v);
    cup = cupDepth * (1.0 - 0.55 * v * v) * Math.sin(uEff * Math.PI * 0.90);
    const tRoll = Math.max(0.0, (u - 0.66) / 0.34);
    reflexY = -rollBack * (0.42 * Math.pow(tRoll, 2.0) + 0.26 * edgeCurl * Math.pow(uEff, 1.4)) + ruffling * 0.5;
    reflexR = rollBack * (0.48 * Math.pow(tRoll, 2.0) + 0.32 * edgeCurl * Math.pow(uEff, 1.4)) + belly * 0.65;
  } else {
    // ── ABIERTA PLENA (Majestuosa copa alta con pétalos reflexos y bordes definidos) ──
    angleTilt = flareAngle * 0.94;
    const belly = (0.02 + 0.03 * capaRatio) * Math.sin(uEff * Math.PI) * (1.0 - 0.25 * v * v);
    cup = cupDepth * 1.10 * (1.0 - 0.55 * v * v) * Math.sin(uEff * Math.PI * 0.88);
    const tRoll = Math.max(0.0, (u - 0.62) / 0.38);
    reflexY = -rollBack * (0.68 * Math.pow(tRoll, 2.0) + 0.38 * edgeCurl * Math.pow(uEff, 1.4)) + ruffling;
    reflexR = rollBack * (0.75 * Math.pow(tRoll, 2.0) + 0.42 * edgeCurl * Math.pow(uEff, 1.4)) + belly * 0.35;
  }

  // 3. Ángulo polar con envolvente (filotaxia y amplitud angular)
  const spanActual = wArcSpan * widthProfile;
  const angulo = phi0 + (v * spanActual * 0.5);

  // 4. Radio radial y altura vertical con volumen esbelto y alargado
  const rExpansion = hLength * Math.pow(uEff, 1.12) * Math.sin(angleTilt);
  const rTotal = Math.max(0.016, rAttach + rExpansion + reflexR + ruffling * 0.20);

  // Concavidad transversal en cuenco
  const cupBowl = cup * 0.80;
  const y = hLength * uEff * Math.cos(angleTilt) + reflexY - cupBowl;

  // Micro-asimetría orgánica
  const microAsim = Math.sin(seed + u * 2.5) * 0.002;
  const x = rTotal * Math.cos(angulo + microAsim);
  const z = rTotal * Math.sin(angulo + microAsim);

  return new THREE.Vector3(x, y, z);
}

// ─────────────────────────────────────────────────────────────
// CONSTRUCCIÓN DE LA GEOMETRÍA COMPLETA DE UNA ROSA
// ─────────────────────────────────────────────────────────────
export function construirRosaGeometria(opciones = {}) {
  const {
    seed = Math.random() * 100,
    calidadAlta = true,
    tipo = 'intermedia', // 'central', 'intermedia', 'perimetral'
    incluirRocio = true
  } = opciones;

  // Filotaxia floral 2/5 (144° = 2.513274 rad)
  const PHYLLOTAXIS_ANGLE = 144.0 * (Math.PI / 180.0);

  // Factores según el tipo de rosa en el ramo
  let flareMult = 1.0;
  let heightMult = 1.0;
  let arcMult = 1.0;
  let rollMult = 1.0;

  if (tipo === 'central') {
    flareMult = 0.90;
    heightMult = 1.04;
    arcMult = 0.96;
    rollMult = 0.85;
  } else if (tipo === 'perimetral') {
    flareMult = 1.05;
    heightMult = 0.98;
    arcMult = 1.04;
    rollMult = 1.10;
  }

  // 5 capas concéntricas (40 pétalos en total: 5 + 7 + 8 + 10 + 10)
  // 5 capas concéntricas (40 pétalos en total: 5 + 7 + 8 + 10 + 10)
  // Pétalos más alargados y esbeltos (estilo Rosa Real de Floristería / Hybrid Tea)
  const capasConfig = [
    // Capa 0: Corazón en espiral turbinada alta y esbelta (5 pétalos)
    {
      numPetalos: 5,
      rAttach: 0.005,
      hLength: 0.55 * heightMult,
      wArcSpan: 4.30 * arcMult,
      flareAngle: 0.10 * flareMult,
      cupDepth: 0.075,
      rollBack: 0.00,
      segsU: calidadAlta ? 14 : 10,
      segsV: calidadAlta ? 12 : 8
    },
    // Capa 1: Capullo interior envolvente alto (7 pétalos)
    {
      numPetalos: 7,
      rAttach: 0.032,
      hLength: 0.62 * heightMult,
      wArcSpan: 3.30 * arcMult,
      flareAngle: 0.22 * flareMult,
      cupDepth: 0.105,
      rollBack: 0.02,
      segsU: calidadAlta ? 14 : 10,
      segsV: calidadAlta ? 12 : 8
    },
    // Capa 2: Copa media de pétalos imbricados esbeltos (8 pétalos)
    {
      numPetalos: 8,
      rAttach: 0.072,
      hLength: 0.68 * heightMult,
      wArcSpan: 2.60 * arcMult,
      flareAngle: 0.38 * flareMult,
      cupDepth: 0.128,
      rollBack: 0.08 * rollMult,
      segsU: calidadAlta ? 14 : 10,
      segsV: calidadAlta ? 12 : 8
    },
    // Capa 3: Copa exterior alta con pétalos ondeados (10 pétalos)
    {
      numPetalos: 10,
      rAttach: 0.122,
      hLength: 0.74 * heightMult,
      wArcSpan: 2.00 * arcMult,
      flareAngle: 0.56 * flareMult,
      cupDepth: 0.148,
      rollBack: 0.14 * rollMult,
      segsU: calidadAlta ? 14 : 10,
      segsV: calidadAlta ? 12 : 8
    },
    // Capa 4: Pétalos de guardia reflexos con bordes esculpidos (10 pétalos)
    {
      numPetalos: 10,
      rAttach: 0.170,
      hLength: 0.79 * heightMult,
      wArcSpan: 1.58 * arcMult,
      flareAngle: 0.74 * flareMult,
      cupDepth: 0.160,
      rollBack: 0.22 * rollMult,
      segsU: calidadAlta ? 14 : 10,
      segsV: calidadAlta ? 12 : 8
    }
  ];

  // Buffers para los pétalos
  const posBase = [];
  const posSemi = [];
  const posOpen = [];
  const uvs = [];
  const colors = [];
  const indices = [];
  const puntosGotas = [];

  let vertOffset = 0;
  let petaloGlobalIdx = 0;

  // Paleta botánica viva, rica y aterciopelada de rosas rojas de lujo (Rojo pasión / carmesí profundo)
  let cProfundo, cCuerpo, cContorno;
  if (tipo === 'central') {
    cProfundo = new THREE.Color(0x180105); // Sombra profunda terciopelo
    cCuerpo    = new THREE.Color(0x8a061e); // Rojo pasión intenso
    cContorno  = new THREE.Color(0xc91238); // Borde vivo carmesí rubí
  } else if (tipo === 'perimetral') {
    cProfundo = new THREE.Color(0x1f0108);
    cCuerpo    = new THREE.Color(0x9c0926); // Rojo terciopelo vibrante
    cContorno  = new THREE.Color(0xd91840); // Borde reflexo luminoso
  } else {
    cProfundo = new THREE.Color(0x1a0106);
    cCuerpo    = new THREE.Color(0x920822);
    cContorno  = new THREE.Color(0xd2153c);
  }

  capasConfig.forEach((capa, cIdx) => {
    const { numPetalos, rAttach, hLength, wArcSpan, flareAngle, cupDepth, rollBack, segsU, segsV } = capa;

    for (let p = 0; p < numPetalos; p++) {
      const phi0 = petaloGlobalIdx * PHYLLOTAXIS_ANGLE + (seed * 0.05);
      const petaloSeed = seed + petaloGlobalIdx * 1.618;

      const props = {
        capa: cIdx,
        phi0,
        rAttach: rAttach * (0.97 + 0.06 * Math.sin(petaloSeed * 1.5)),
        hLength: hLength * (0.97 + 0.06 * Math.cos(petaloSeed * 1.2)),
        wArcSpan,
        flareAngle,
        cupDepth,
        rollBack,
        seed: petaloSeed
      };

      const startPetaloVert = vertOffset;
      const tonalShift = ((petaloGlobalIdx % 5) - 2) * 0.012;
      const cPLocal = cCuerpo.clone().offsetHSL(tonalShift, 0.02, tonalShift * 0.25);

      for (let iu = 0; iu <= segsU; iu++) {
        const u = iu / segsU;
        for (let iv = 0; iv <= segsV; iv++) {
          const v = (iv / segsV) * 2.0 - 1.0;

          const p0 = calcularPuntoPetaloAnatomico(u, v, 0, props);
          const p1 = calcularPuntoPetaloAnatomico(u, v, 1, props);
          const p2 = calcularPuntoPetaloAnatomico(u, v, 2, props);

          posBase.push(p0.x, p0.y, p0.z);
          posSemi.push(p1.x, p1.y, p1.z);
          posOpen.push(p2.x, p2.y, p2.z);

          uvs.push((v + 1.0) * 0.5, u);

          // Guardar puntos para micro-gotas de rocío en pétalos exteriores
          if (incluirRocio && cIdx >= 3 && iu === segsU && Math.abs(v) < 0.65 && (p % 2 === 0) && iv === Math.floor(segsV / 2)) {
            puntosGotas.push(new THREE.Vector3(p2.x, p2.y + 0.008, p2.z));
          }

          // Contraste anatómico y visibilidad nítida de cada pétalo:
          // 1. Sombras profundas en la base/crevices entre pétalos
          const heightAO = Math.pow(u, 0.55);
          const baseCrevice = (u < 0.20) ? (0.42 + 0.58 * (u / 0.20)) : 1.0;
          const factorAO = heightAO * (0.35 + 0.65 * (cIdx / 4.0)) * baseCrevice;

          const col = new THREE.Color().lerpColors(cProfundo, cPLocal, Math.min(1.0, u * 1.30));
          if (u > 0.35) {
            col.lerp(cContorno, Math.pow((u - 0.35) / 0.65, 1.10));
          }
          // Luminosidad aterciopelada
          col.multiplyScalar(0.35 + 0.65 * factorAO);

          // 2. Realce cromático en bordes (rojo rubí vivo) para separar nítidamente cada pétalo sin desteñir a rosa
          const edgeFactor = Math.pow(Math.abs(v), 2.2) * 0.45 * Math.pow(u, 0.70);
          const apexFactor = Math.pow(u, 3.0) * 0.35;
          col.lerp(cContorno, Math.min(0.60, edgeFactor + apexFactor));

          colors.push(col.r, col.g, col.b);
        }
      }

      // Conectividad de cuadrículas para este pétalo
      const cols = segsV + 1;
      for (let iu = 0; iu < segsU; iu++) {
        for (let iv = 0; iv < segsV; iv++) {
          const a = startPetaloVert + iu * cols + iv;
          const b = startPetaloVert + (iu + 1) * cols + iv;
          const c = startPetaloVert + (iu + 1) * cols + (iv + 1);
          const d = startPetaloVert + iu * cols + (iv + 1);

          indices.push(a, b, d);
          indices.push(b, c, d);
        }
      }

      vertOffset += (segsU + 1) * (segsV + 1);
      petaloGlobalIdx++;
    }
  });

  const petalosGeom = new THREE.BufferGeometry();
  // Geometría por defecto: abierta
  petalosGeom.setAttribute('position', new THREE.Float32BufferAttribute(posOpen, 3));
  petalosGeom.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
  petalosGeom.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
  petalosGeom.setIndex(indices);

  // Calcular normales para cada estado morph para GPU interpolation limpia
  const geomBase = new THREE.BufferGeometry();
  geomBase.setAttribute('position', new THREE.Float32BufferAttribute(posBase, 3));
  geomBase.setIndex(indices);
  geomBase.computeVertexNormals();

  const geomSemi = new THREE.BufferGeometry();
  geomSemi.setAttribute('position', new THREE.Float32BufferAttribute(posSemi, 3));
  geomSemi.setIndex(indices);
  geomSemi.computeVertexNormals();

  petalosGeom.computeVertexNormals();

  // Morph targets: 0 = capullo cerrado, 1 = semiabierta
  petalosGeom.morphAttributes.position = [
    new THREE.Float32BufferAttribute(posBase, 3),
    new THREE.Float32BufferAttribute(posSemi, 3)
  ];
  petalosGeom.morphAttributes.normal = [
    geomBase.getAttribute('normal'),
    geomSemi.getAttribute('normal')
  ];

  // Receptáculo floral verde y 5 sépalos puntiagudos reflexos
  const calizGeom = construirCalizYSepalos();

  // Gotas de rocío en pétalos exteriores
  const gotasGeom = construirGotasRocio(puntosGotas);

  return { petalosGeom, calizGeom, gotasGeom };
}

/**
 * Genera micro-gotas de rocío matutino translúcidas en los pétalos exteriores
 */
function construirGotasRocio(puntosGotas) {
  if (!puntosGotas || puntosGotas.length === 0) return null;
  const positions = [];
  const normals = [];
  const indices = [];
  let vertOffset = 0;

  const latSegs = 6;
  const lonSegs = 6;

  puntosGotas.forEach((p, idx) => {
    const radio = 0.016 + (idx % 3) * 0.005;
    for (let lat = 0; lat <= latSegs; lat++) {
      const theta = (lat / latSegs) * Math.PI;
      const sinTheta = Math.sin(theta);
      const cosTheta = Math.cos(theta);

      for (let lon = 0; lon <= lonSegs; lon++) {
        const phi = (lon / lonSegs) * Math.PI * 2.0;
        const sinPhi = Math.sin(phi);
        const cosPhi = Math.cos(phi);

        const nx = sinTheta * cosPhi;
        const ny = Math.max(0.1, cosTheta);
        const nz = sinTheta * sinPhi;

        positions.push(p.x + nx * radio, p.y + ny * radio * 0.7, p.z + nz * radio);
        normals.push(nx, ny, nz);
      }
    }

    const cols = lonSegs + 1;
    for (let lat = 0; lat < latSegs; lat++) {
      for (let lon = 0; lon < lonSegs; lon++) {
        const a = vertOffset + lat * cols + lon;
        const b = vertOffset + (lat + 1) * cols + lon;
        const c = vertOffset + (lat + 1) * cols + (lon + 1);
        const d = vertOffset + lat * cols + (lon + 1);

        indices.push(a, b, d);
        indices.push(b, c, d);
      }
    }
    vertOffset += (latSegs + 1) * (lonSegs + 1);
  });

  const geom = new THREE.BufferGeometry();
  geom.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geom.setAttribute('normal', new THREE.Float32BufferAttribute(normals, 3));
  geom.setIndex(indices);
  return geom;
}

/**
 * Genera el receptáculo ovoide verde y 5 sépalos puntiagudos curvados hacia afuera/abajo
 */
function construirCalizYSepalos() {
  const positions = [];
  const uvs = [];
  const indices = [];
  let vertOffset = 0;

  // 1. Receptáculo ovoide verde (y de 0.02 a -0.18)
  const latSegs = 10;
  const lonSegs = 16;
  const startRecep = vertOffset;

  for (let lat = 0; lat <= latSegs; lat++) {
    const theta = (lat / latSegs) * Math.PI;
    const yNorm = Math.cos(theta); // 1 en polo superior, -1 en inferior
    const y = yNorm * 0.10 - 0.08;
    // Ovoide: ensanchado en la parte media-alta
    const r = Math.sin(theta) * (0.13 + 0.03 * yNorm);

    for (let lon = 0; lon <= lonSegs; lon++) {
      const phi = (lon / lonSegs) * Math.PI * 2.0;
      const x = r * Math.cos(phi);
      const z = r * Math.sin(phi);

      positions.push(x, y, z);
      uvs.push(lon / lonSegs, lat / latSegs);
    }
  }

  const colsRecep = lonSegs + 1;
  for (let lat = 0; lat < latSegs; lat++) {
    for (let lon = 0; lon < lonSegs; lon++) {
      const a = startRecep + lat * colsRecep + lon;
      const b = startRecep + (lat + 1) * colsRecep + lon;
      const c = startRecep + (lat + 1) * colsRecep + (lon + 1);
      const d = startRecep + lat * colsRecep + (lon + 1);

      indices.push(a, b, d);
      indices.push(b, c, d);
    }
  }
  vertOffset += (latSegs + 1) * (lonSegs + 1);

  // 2. 5 Sépalos lanceolados puntiagudos (reflexos hacia abajo y afuera)
  const numSepalos = 5;
  const segsLen = 10;
  const segsWidth = 4;
  const sepalLength = 0.35;
  const sepalBaseWidth = 0.09;

  for (let s = 0; s < numSepalos; s++) {
    const angleSepal = s * ((Math.PI * 2.0) / numSepalos);
    const startSepalVert = vertOffset;

    for (let il = 0; il <= segsLen; il++) {
      const u = il / segsLen; // 0 en la base del receptáculo, 1 en la punta afilada
      // Ancho decreciente hasta punta afilada (u=1 -> ancho=0)
      const currentWidth = sepalBaseWidth * Math.sin((1.0 - u) * (Math.PI * 0.5));

      // Curvatura reflexa (hacia afuera y cayendo hacia abajo)
      const flareOut = Math.pow(u, 1.25) * 0.22;
      const dropDown = -Math.pow(u, 1.45) * 0.28;

      const rBase = 0.12;
      const r = rBase + flareOut;
      const y = -0.04 + dropDown;

      for (let iw = 0; iw <= segsWidth; iw++) {
        const v = (iw / segsWidth) * 2.0 - 1.0;
        const angularOffset = (v * (currentWidth / rBase)) * 0.5;
        const totalAng = angleSepal + angularOffset;

        const x = r * Math.cos(totalAng);
        const z = r * Math.sin(totalAng);

        positions.push(x, y, z);
        uvs.push((v + 1.0) * 0.5, u);
      }
    }

    const colsSepal = segsWidth + 1;
    for (let il = 0; il < segsLen; il++) {
      for (let iw = 0; iw < segsWidth; iw++) {
        const a = startSepalVert + il * colsSepal + iw;
        const b = startSepalVert + (il + 1) * colsSepal + iw;
        const c = startSepalVert + (il + 1) * colsSepal + (iw + 1);
        const d = startSepalVert + il * colsSepal + (iw + 1);

        indices.push(a, b, d);
        indices.push(b, c, d);
      }
    }
    vertOffset += (segsLen + 1) * (segsWidth + 1);
  }

  const caliz = new THREE.BufferGeometry();
  caliz.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  caliz.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
  caliz.setIndex(indices);
  caliz.computeVertexNormals();

  return caliz;
}

// ─────────────────────────────────────────────────────────────
// CONSTRUCCIÓN DEL TALLO CON ESPINAS Y HOJAS CON FOLÍOLOS ASERRADOS
// ─────────────────────────────────────────────────────────────
export function construirTalloYFollaje(materiales) {
  const grupo = new THREE.Group();

  // Curva de tallo orgánico
  const curve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(0, -0.25, 0),
    new THREE.Vector3(0.02, -0.90, 0.03),
    new THREE.Vector3(-0.03, -1.80, -0.02),
    new THREE.Vector3(0.01, -2.80, 0.02)
  ]);

  const talloGeom = new THREE.TubeGeometry(curve, 32, 0.045, 12, false);
  const talloMesh = new THREE.Mesh(talloGeom, materiales.matTallo);
  grupo.add(talloMesh);

  // Espinas afiladas con curvatura hacia abajo
  const espinaGeom = new THREE.ConeGeometry(0.025, 0.10, 6);
  espinaGeom.rotateX(Math.PI * 0.45); // Curvada hacia abajo
  const espinaCoords = [
    { y: -0.65, angle: 0.8 },
    { y: -1.15, angle: 2.7 },
    { y: -1.75, angle: 4.5 },
    { y: -2.20, angle: 1.2 }
  ];

  espinaCoords.forEach(e => {
    const espina = new THREE.Mesh(espinaGeom, materiales.matEspina);
    const pt = curve.getPointAt((-e.y - 0.25) / 2.55);
    espina.position.set(pt.x, e.y, pt.z);
    espina.rotation.y = e.angle;
    grupo.add(espina);
  });

  // Rama de hojas de 3 folíolos
  const ramaAlturas = [-0.85, -1.55];
  ramaAlturas.forEach((yPos, idx) => {
    const hojaGrupo = new THREE.Group();
    const ang = idx * 2.3 + 0.5;
    const pt = curve.getPointAt((-yPos - 0.25) / 2.55);
    hojaGrupo.position.set(pt.x, yPos, pt.z);
    hojaGrupo.rotation.y = ang;

    // Pecíolo
    const pecioloGeom = new THREE.CylinderGeometry(0.015, 0.018, 0.35, 6);
    pecioloGeom.rotateZ(Math.PI * 0.35);
    const peciolo = new THREE.Mesh(pecioloGeom, materiales.matTallo);
    peciolo.position.set(0.14, 0.05, 0);
    hojaGrupo.add(peciolo);

    // Folíolo central
    const geomHoja = crearGeometriaFoliolo();
    const fCentro = new THREE.Mesh(geomHoja, materiales.matCaliz);
    fCentro.position.set(0.42, 0.12, 0);
    fCentro.rotation.set(0.2, 0, -0.4);

    // Folíolo izquierdo
    const fIzq = new THREE.Mesh(geomHoja, materiales.matCaliz);
    fIzq.scale.setScalar(0.78);
    fIzq.position.set(0.25, 0.08, 0.15);
    fIzq.rotation.set(0.4, 0.5, -0.5);

    // Folíolo derecho
    const fDer = new THREE.Mesh(geomHoja, materiales.matCaliz);
    fDer.scale.setScalar(0.78);
    fDer.position.set(0.25, 0.08, -0.15);
    fDer.rotation.set(-0.4, -0.5, -0.5);

    hojaGrupo.add(fCentro, fIzq, fDer);
    grupo.add(hojaGrupo);
  });

  return grupo;
}

function crearGeometriaFoliolo() {
  const geom = new THREE.PlaneGeometry(0.26, 0.44, 10, 10);
  const pos = geom.attributes.position;
  for (let i = 0; i < pos.count; i++) {
    const rawX = pos.getX(i);
    const y = pos.getY(i);
    // Silueta almendrada/lanceolada (ensanchada a 1/3 de la base, afilada en el ápice)
    const ny = (y + 0.22) / 0.44; // 0 en base, 1 en punta
    const wFactor = (ny < 0.40)
      ? Math.sin((ny / 0.40) * Math.PI * 0.5)
      : Math.cos(((ny - 0.40) / 0.60) * Math.PI * 0.48);
    const x = rawX * (0.20 + 0.80 * wFactor);
    pos.setX(i, x);

    // Convexidad anatómica del folíolo y nervadura central
    const z = -0.035 * (1.0 - Math.min(1.0, Math.abs(x) / 0.12)) + Math.sin(y * 4.5) * 0.012;
    pos.setZ(i, z);
  }
  geom.computeVertexNormals();
  return geom;
}

// ─────────────────────────────────────────────────────────────
// CLASE COMPLETA DE UNA ROSA BOTÁNICA
// ─────────────────────────────────────────────────────────────
export class RosaIndividual {
  constructor(materiales, opciones = {}) {
    this.grupo = new THREE.Group();
    this.materiales = materiales;

    const { petalosGeom, calizGeom } = construirRosaGeometria(opciones);

    // Mesh de pétalos con morph targets
    this.meshPetalos = new THREE.Mesh(petalosGeom, materiales.matPetalos);
    this.meshPetalos.castShadow = false;
    this.meshPetalos.receiveShadow = false;

    // Mesh de cáliz y sépalos
    this.meshCaliz = new THREE.Mesh(calizGeom, materiales.matCaliz);

    this.florGrupo = new THREE.Group();
    this.florGrupo.add(this.meshPetalos, this.meshCaliz);
    this.grupo.add(this.florGrupo);

    if (opciones.incluirTallo !== false) {
      this.talloGrupo = construirTalloYFollaje(materiales);
      this.grupo.add(this.talloGrupo);
    }

    // Inicializar estado de apertura (0 = capullo, 0.5 = semiabierta, 1 = abierta)
    this.setApertura(opciones.aperturaInicial !== undefined ? opciones.aperturaInicial : 1.0);
  }

  /**
   * Control continuo de apertura (0 = capullo cerrado, 0.5 = semiabierta, 1 = abierta)
   */
  setApertura(progreso) {
    const p = Math.max(0.0, Math.min(1.0, progreso));
    if (!this.meshPetalos.morphTargetInfluences) return;

    if (p <= 0.5) {
      // De capullo (morph 0) a semiabierta (morph 1)
      const t = p / 0.5;
      this.meshPetalos.morphTargetInfluences[0] = 1.0 - t; // Base (cerrada)
      this.meshPetalos.morphTargetInfluences[1] = t;       // Semiabierta
    } else {
      // De semiabierta (morph 1) a abierta (malla base sin morphs)
      const t = (p - 0.5) / 0.5;
      this.meshPetalos.morphTargetInfluences[0] = 0.0;
      this.meshPetalos.morphTargetInfluences[1] = 1.0 - t;
    }
  }

  setHighlight(valor) {
    if (this.materiales.matPetalos.userData && this.materiales.matPetalos.userData.shader) {
      this.materiales.matPetalos.userData.shader.uniforms.uHighlight.value = valor;
    }
  }
}
