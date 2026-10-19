ROL
Eres un artista técnico y desarrollador creativo senior (Three.js, shaders, rendimiento móvil, dirección de arte). Vas a CORREGIR Y ELEVAR un proyecto existente en esta carpeta: una web estática, emotiva, con un ramo de rosas 3D, que será una carta de disculpa para una persona muy importante para mí. El resultado actual se ve mal: rosas facetadas, con puntas y sin volumen, y una tarjeta de texto que tapa el ramo. Quiero calidad profesional.

PASO 0 — AUDITORÍA (antes de tocar nada)
1. Lee el código actual. Conserva lo que funcione (corazones cayendo, audio con subtítulos sincronizados, galería, estructura Vite). Reemplaza por completo el pipeline de las rosas, el layout y los textos.
2. Haz búsqueda en el código de "EJEMPLO", "reemplaza", "lorem", "TODO": no debe quedar ninguno en el build final.

PASO 1 — SKILLS Y HERRAMIENTAS (instala y LEE antes de programar)
Skills de agente (si el comando falla, clona el repo y lee los SKILL.md):
- emalorenzo/three-agent-skills (three-best-practices y buenas prácticas R3F)
- CloudAI-X/threejs-skills (escenas, materiales, post-procesado)
- Opcional: gamedev-skills/awesome-gamedev-agent-skills (router; usa threejs-scene-setup)
Paquetes (usa siempre la última versión estable; confirma con npm view):
- three y @types/three, vite, gsap (animación/timeline), @fontsource/cormorant-garamond y @fontsource/inter (fuentes locales, cero peticiones externas)
- Dev: @gltf-transform/cli, meshoptimizer/gltfpack, sharp (fotos a WebP/AVIF), playwright (capturas), lil-gui y stats-gl (solo desarrollo, fuera del build)
Recursos CC0: HDRI de Poly Haven (1k, estudio o atardecer suave) para iluminación por imagen. Nada con licencia que exija atribución sin que lo anotes en un archivo CREDITS.md.
Usa WebGLRenderer (no WebGPU) por compatibilidad con iPhone 11.

PASO 2 — ROSAS REALISTAS (núcleo del trabajo)
Genera cada rosa por código, en un único BufferGeometry por flor (un solo draw call por rosa), con estas reglas:
- Pétalos como superficies paramétricas P(u,v): u a lo largo de la altura, v a lo ancho. Perfil de ancho w(u) que se ensancha hacia el borde superior, curvatura de copa (cup) alrededor del eje, borde superior ligeramente enrollado hacia afuera (más en los pétalos exteriores), asimetría y ruido suave por pétalo para que ninguno sea idéntico. Bordes redondeados, sin puntas.
- Disposición en espiral áurea (137.5°), 5 capas aprox. (3 centrales apretados formando el capullo, luego 5, 7, 9 y 11 pétalos), con inclinación y radio crecientes hacia afuera.
- Subdivisión suficiente para que NO se vean facetas: 12x8 como mínimo en pétalos exteriores, 8x6 en interiores. Normales suaves (computeVertexNormals tras deformar) y, si hace falta, normales calculadas analíticamente.
- Color por vértice: degradado de base más oscura a borde más claro, y variación sutil por pétalo; oclusión ambiental horneada en vértice (más oscuro hacia el centro y la base de cada pétalo). Esto aporta gran parte del realismo.
- Animación de apertura: dos morph targets (semiabierta y abierta) con sus normales; controla morphTargetInfluences con GSAP y easing suave. Rosas en capullo al inicio.
- Presupuesto: 3k–7k triángulos por rosa (más detalle en las 3 rosas más cercanas a la cámara, menos en el resto), ramo completo ≤ 90k triángulos.
- Pétalos sueltos que caen: un InstancedMesh (≈40 instancias) con física simple y rotación, derivada de la misma geometría de pétalo.
- Tallos: TubeGeometry sobre CatmullRomCurve3, 10-12 segmentos radiales, adelgazados, con pocas espinas (conos pequeños). Hojas: geometría recortada (no texturas con alpha), con nervio central doblado y borde dentado suave, 3 foliolos.
- Envoltura: papel cónico con pliegues suaves (desplazamiento) y listón de satén morado con lazo sencillo.

PASO 3 — MATERIAL Y LUZ
- MeshPhysicalMaterial para pétalos: vertexColors, roughness ~0.55, sheen 1 con sheenColor rosado claro y sheenRoughness ~0.4 (efecto terciopelo), side DoubleSide, envMapIntensity ajustable, un normal map de venas muy fino generado en código (CanvasTexture 512).
- Translucidez falsa SIN transmission (muy cara en móvil): usa onBeforeCompile para añadir un término de contraluz (pow(saturate(dot(viewDir,-lightDir)),3) * color de pétalo * grosor) más un rim fresnel suave. Verifica con contraluz que los pétalos "brillan".
- Iluminación: HDRI de Poly Haven con PMREMGenerator, luz clave direccional suave, luz de contorno morada, relleno tenue. Sin sombras en tiempo real: usa un blob shadow o ContactShadows baked bajo el ramo.
- Tone mapping ACESFilmic o AgX, salida sRGB. Sin bloom por defecto (el brillo se hace con un degradado CSS radial detrás del canvas). Solo activa un bloom a media resolución si en pruebas con CPU throttling 4x se mantiene ≥ 50 fps.
- Paleta: rosas rosa profundo/magenta con borde que vira a violeta; fondo morado casi negro con viñeta; acentos fosforescentes suaves.
- OPCIONAL: si existe /public/models/rose.glb (modelo externo), úsalo en lugar de la generación procedural, optimizado con gltf-transform (meshopt + KTX2/WebP). Si lo usas, anota la licencia/atribución en CREDITS.md.

PASO 4 — COMPOSICIÓN Y EXPERIENCIA
- 12 rosas, una por cada mes de los 12 meses que fuimos novios. Se agrupan en un ramo redondo y natural (no simétrico perfecto), cámara con dolly muy lento, ligera inclinación táctil con inercia. Límites de zoom: el ramo se ve bien tanto cerca como lejos; prueba ambos.
- Pantalla de entrada: fondo oscuro, botón "Abrir" (obligatorio por el audio en iOS). Al tocar: el ramo aparece despacio, capullos que se abren.
- LAYOUT: el ramo ocupa la parte superior (aprox. 60% de la altura). Los subtítulos de la narración aparecen abajo, 1-2 frases a la vez, palabra por palabra sincronizados. NO muestres la carta completa tapando el ramo. Botón discreto "Leer carta completa" que abre una hoja inferior (bottom sheet) con scroll.
- Sección "Doce meses": al terminar la narración, 12 fotos (foto-01 a foto-12 en /public/fotos, convertidas a WebP/AVIF, lazy loading), una por mes. Al ver cada foto, la rosa correspondiente se ilumina suavemente. Si falta alguna foto, esa tarjeta se omite en producción (nunca mostrar texto de relleno).
- Momento de dolor (párrafo del perdón): caen 3-5 pétalos, lento y sin dramatismo. Momento del cambio: el ramo termina de abrirse y sube la luz. Cierre: ramo quieto, respiración sutil de luz, mensaje final.
- Corazones morados y rosados cayendo al fondo (ya existen): todos distintos, lentos, capa 2D ligera que no compita con el ramo.
- Modo demo si el mp3 aún no existe o el texto cambió: los subtítulos avanzan por tiempo de lectura estimado. Cuando yo grabe el nuevo mp3, genero el JSON de tiempos con el script local de faster-whisper (mantenlo separado del paquete final; el build final NO incluye ese sistema).

CARTA (texto FINAL, no lo alteres ni lo resumas; déjalo en un archivo de configuración editable)
Yohandry,

Sé que este mensaje puede llegarte sin que lo esperaras. No tienes ninguna obligación de leerlo, ni de responderlo.

Durante doce meses fuimos novios. Doce meses en los que me quisiste, y en los que yo, aunque te amaba inmensamente, no supe cuidar lo que tenía.

Fui inmaduro. No supe llevar la relación con la cabeza, como se debe. Fui corto de mente, y mis errores terminaron lastimándote y provocaron que lo nuestro se acabara. Eso no fue culpa de las circunstancias ni tuya. Fue mía.

Te pido perdón de corazón. No para que me perdones hoy, ni para que me des una respuesta. Te lo pido porque te lo debía, y porque mereces oírlo con claridad y sin excusas.

Perder tu amor me hizo mirarme de frente. Hoy soy distinto a aquel que fui contigo, y no quiero volver a serlo. Sé que las palabras no prueban nada: el cambio se demuestra con el tiempo.

Lo que siento es esto: si algún día la vida lo permite, quiero amarte como se debe, cuidarte como se debe y, si Dios quiere, caminar a tu lado hasta el último de mis días. Pero eso es solo lo que siento, no una petición. Lo que tú decidas, lo voy a respetar.

Lo que más deseo es que seas feliz, sea o no a mi lado.

Gracias por esos doce meses.
No necesito respuesta. Solo quería que lo supieras.

RENDIMIENTO (iPhone 11: A13, 4 GB, viewport 414x896 a DPR 2)
- Objetivo 60 fps, mínimo 30. Pixel ratio máximo 2. Assets totales < 10 MB. Sin postprocesado pesado. PerformanceMonitor propio: si los fps bajan, reduce pixel ratio, pétalos sueltos y detalle de las rosas lejanas, de forma progresiva.
- Pausa el render si la pestaña no está visible. Respeta prefers-reduced-motion (versión casi estática). Safe-area y barra de Safari bien resueltas. Si WebGL falla, muestra una imagen estática con animación CSS.
- Despliegue: build estático de Vite listo para Vercel (y compatible con GitHub Pages). Explica el despliegue en pocos pasos.

VERIFICACIÓN OBLIGATORIA (no entregues sin esto)
1. Con Playwright (Chromium, viewport 414x896, DPR 2, WebGL por software si hace falta) captura el ramo en tres distancias de cámara: cerca, media y lejos, y también con la carta cerrada y abierta. REVISA tú mismo las capturas.
2. Itera hasta que NO haya facetas visibles, puntas, pétalos atravesándose ni zonas planas negras. Si se ve low-poly o plano, mejora subdivisión, normales, AO y luz; no entregues.
3. Mide fps con CPU throttling 4x (CDP) y reporta los números.
4. Haz grep final: ningún "EJEMPLO", "reemplaza" ni "lorem" en dist/.
5. Entrega: código completo, CREDITS.md, README breve (cómo cambiar fotos, audio y texto; cómo probar en iPhone por red local; cómo desplegar en Vercel) y un resumen de 10 líneas con decisiones y métricas.