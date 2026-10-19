# Carta para Yohandry — Experiencia 3D, Rosa Botánica e Intro Cinematográfica

Una experiencia web interactiva, sensible y emocional construida con Three.js, WebGL y GSAP, diseñada específicamente para funcionar con fluidez cinematográfica en Safari iOS (iPhone 11) y navegadores de escritorio.

---

## 🌹 Novedades: Anatomía Botánica Real y Nueva Intro

### 1. Sistema de Rosa Botánica de Precisión
- **Silueta de copa/ovoide natural**: Proporción $1.15\text{–}1.30 \times$ ancho al abrir y $\approx 1:1$ en floración plena.
- **Núcleo espiral cerrado**: Cono central de 3 pétalos envolventes que cubren $180^\circ$ de circunferencia.
- **35 Pétalos Obovados Anchos** ($W/H \approx 1.1$) en 5 verticilos concéntricos con filotaxia áurea de $144^\circ$.
- **Curvatura anatómica de cuchara**: Copa transversal positiva (`+ cup`) y borde exterior reflexo curvado hacia atrás.
- **Cáliz botánico completo**: Receptáculo verde ovoide y 5 sépalos lanceolados puntiagudos reflexos curvados hacia abajo.
- **Tallos y envoltura**: Tallos con curvatura natural, espinas, hojas trifoliadas, papel cónico y listón de satén morado.
- **Laboratorio de Rosa aislado**: Disponible en `/rose-lab.html` para inspección con presets de cámara (Cerca, Media, Lejos), selector de apertura y modo wireframe.

### 2. Intro Cinematográfica "Una libélula de luz" (~45s, saltable)
- **Motor GPU de 24.000 partículas** (`THREE.Points`) con shader GLSL propio, mezcla aditiva y deformación no lineal por curl noise.
- **Arco Emotivo**:
  1. **0–4s**: Luciérnaga dorada palpitante en la oscuridad.
  2. **4–10s**: Polvo estelar que converge formando una libélula con alas translúcidas que aletean en contrafase a 25 Hz y abdomen resplandeciente.
  3. **10–22s**: Vuelo en spline ascendente en S con seguimiento de cámara dinámico y revelado por tinta del retrato de la pareja (`/fotos/pareja-intro.jpg`).
  4. **22–34s**: Ascenso y travesía a través de una galaxia espiral dorada y violeta de 3 brazos.
  5. **34–42s**: Constelación que traza el nombre **"Yohandry"** en cursiva clásica Cormorant Garamond, acompañada de un acorde sintetizado celestial Dmaj9 en WebAudio nativo.
  6. **42–48s**: Condensación de las estrellas en 12 capullos que descienden para florecer en el ramo de rosas.
- **Controles**: Botón "Saltar" discreto tras 2s, persistencia en `sessionStorage` para no repetir innecesariamente, soporte para `prefers-reduced-motion` y query param `?t=` para saltar a cualquier segundo.

---

### 3. Portada Cinemática "Rollo de Película 35mm" & Responsive Total
- **Rollos de película en bucle infinito**: Fondos cinemáticos animados tipo cinta de 35mm con perforaciones (*sprockets*) y fotografías reales de recuerdos en rotación continua con opacidad sutil.
- **Detalles editoriales de lujo**: Carrete vintage animado, partituras doradas, matasellos postal "Vía Aérea", sello lacrado interactivo y tipografía clásica Cormorant Garamond.
- **Diseño 100% responsivo**: Adaptado milimétricamente para móviles pequeños (iPhone SE), medianos (iPhone 11/14/15, Samsung Galaxy) y pantallas de escritorio/tablets.
- **Lluvia de pétalos interactiva**: Efecto físico de pétalos cayendo sobre la pantalla accesible tanto desde el botón de la barra de controles como desde el modal de ramo despejado.

---

## 🧪 Pruebas y Laboratorios

- **Experiencia Principal**: `http://localhost:5173/`
- **Laboratorio de Rosa**: `http://localhost:5173/rose-lab.html`
- **Intro directa**: `http://localhost:5173/?intro=1`
- **Intro saltada al ramo**: `http://localhost:5173/?intro=0`
- **Saltar a segundo específico de intro**: `http://localhost:5173/?t=8` (o `t=18`, `t=28`, `t=38`)

---

## 🚀 Despliegue en Vercel

Este proyecto está completamente configurado y optimizado para **Vercel**:

1. En tu panel de Vercel ([vercel.com](https://vercel.com)), selecciona **"Add New Project"** e importa el repositorio de GitHub `ChronosXCore/carta-para-yoha`.
2. Vercel detectará automáticamente la configuración:
   - **Framework Preset**: `Vite`
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
   - **Install Command**: `npm install`
3. Haz clic en **Deploy**. ¡Listo en ~30 segundos!
4. Las reglas de [vercel.json](file:///c:/Users/david/Desktop/Carta%20para%20yoha/vercel.json) aseguran compresión, caché inmutable de tipografías/assets y streaming de audio continuo por rangos de bytes para Safari iOS.
