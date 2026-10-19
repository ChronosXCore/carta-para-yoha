# Créditos y Atribuciones

Este proyecto utiliza tecnologías, tipografías y recursos de código abierto bajo sus respectivas licencias:

## Librerías y Motores
- **Three.js** (v0.186.1)
  - Licencia: MIT
  - Autor: Ricardo Cabello (mrdoob) y colaboradores de Three.js
  - Repositorio: https://github.com/mrdoob/three.js

- **GSAP (GreenSock Animation Platform)** (v3.15.2)
  - Licencia: Standard GreenSock License
  - Autor: GreenSock Inc.
  - Sitio oficial: https://greensock.com/gsap/

## Arquitectura 3D y Gráficos Procedurales
- **Rosa Botánica Paramétrica (Ruta B - Procedural de Precisión)**
  - Diseño: Anatomía botánica de rosa de té con filotaxia 2/5 ($144^\circ$).
  - Elementos: Silueta ovoide en copa, 5 verticilos concéntricos (35 pétalos obovados anchos con curvatura de cuchara y borde reflexo), receptáculo ovoide verde, 5 sépalos lanceolados reflexos, tallos curvos con hojas y espinas, morph targets para capullo cerrado, flor semiabierta y flor plena.
  - Laboratorio de calibración: `/rose-lab.html` con inspección de distancias y wireframe.

- **Motor de Partículas GPU ("Una libélula de luz")**
  - Motor: `THREE.Points` con shader GLSL propio, mezcla aditiva (`AdditiveBlending`), sprite gaussiano suave y deformación no lineal por curl noise.
  - Coreografía: Luciérnaga dorada (0-4s) → Libélula con alas en contrafase a 25 Hz y brillo abdominal (4-10s) → Vuelo en spline S y retrato de pareja revelado por tinta (10-22s) → Galaxia espiral de 3 brazos (22-34s) → Constelación "Yohandry" en Cormorant Garamond con acorde WebAudio Dmaj9 (34-42s) → Condensación en 12 capullos de rosas (42-48s).

## Recursos 3D e Iluminación (IBL / HDRI)
- **Poly Haven: `studio_small_08_1k.hdr`**
  - Licencia: CC0 1.0 Universal (Public Domain Dedication)
  - Autor: Sergej Majboroda & Poly Haven
  - Enlace: https://polyhaven.com/a/studio_small_08

## Tipografías
- **Cormorant Garamond**
  - Licencia: SIL Open Font License 1.1 (OFL)
  - Diseñador: Christian Thalmann (Catharsis Fonts)
  - Distribución: Fontsource (`@fontsource/cormorant-garamond`)

- **Inter**
  - Licencia: SIL Open Font License 1.1 (OFL)
  - Diseñador: Rasmus Andersson
  - Distribución: Fontsource (`@fontsource/inter`)

## Iconografía
- **Lucide Icons** (trazados SVG para controles de audio, reproducción y bottom sheet)
  - Licencia: ISC License
  - Enlace: https://lucide.dev/
