#!/usr/bin/env python3
"""
generate_timestamps.py — Script independiente para generar JSON de tiempos de palabras

DESCRIPCIÓN:
    Transcribe un archivo MP3 usando faster-whisper (WhisperX) y genera un JSON
    con el tiempo de inicio y fin de cada palabra, listo para pegar en carta.js.

REQUISITOS (instalar una vez):
    pip install faster-whisper

    En macOS/Linux también necesitas ffmpeg:
        brew install ffmpeg          # macOS
        sudo apt install ffmpeg     # Ubuntu/Debian

    En Windows: descarga ffmpeg desde https://ffmpeg.org/ y añádelo al PATH.

USO:
    python generate_timestamps.py ruta/al/archivo.mp3

    O con opciones:
    python generate_timestamps.py ruta/al/archivo.mp3 --modelo large-v3 --idioma es

RESULTADO:
    - Crea "carta_tiempos.json" en la carpeta actual
    - Imprime el JSON formateado en consola
    - Muestra estadísticas de la transcripción

DESPUÉS:
    Copia el contenido del JSON y pégalo en src/carta.js
    en la variable TIEMPOS_PALABRAS = [ ... ];
"""

import argparse
import json
import os
import sys
from pathlib import Path


def transcribir(ruta_audio: str, modelo: str = "medium", idioma: str = "es") -> list[dict]:
    """
    Transcribe el audio con faster-whisper y devuelve lista de tiempos por palabra.

    Args:
        ruta_audio: Ruta al archivo MP3/WAV
        modelo: Tamaño del modelo Whisper ('tiny','base','small','medium','large-v2','large-v3')
                Para un iPhone 11 (2-3 min), 'medium' es suficiente y rápido.
        idioma: Código de idioma ISO ('es', 'en', etc.) o None para autodetectar

    Returns:
        Lista de dicts: [{"palabra": str, "inicio": float, "fin": float}, ...]
    """
    print(f"[1/3] Cargando modelo faster-whisper '{modelo}'...")

    try:
        from faster_whisper import WhisperModel
    except ImportError:
        print("\nError: faster-whisper no está instalado.")
        print("Instálalo con:  pip install faster-whisper")
        sys.exit(1)

    # Usar CPU por defecto (compatible con cualquier máquina)
    # Si tienes GPU NVIDIA, cambia device="cuda" para mayor velocidad
    model = WhisperModel(
        modelo,
        device="cpu",
        compute_type="int8",    # int8 en CPU: buena velocidad con menor RAM
    )

    print(f"[2/3] Transcribiendo '{ruta_audio}'...")
    print(f"      Idioma: {idioma or 'autodetección'}")

    segments, info = model.transcribe(
        ruta_audio,
        language=idioma,
        word_timestamps=True,    # ← CLAVE: tiempos por palabra
        beam_size=5,
        vad_filter=True,         # filtrar silencios
        vad_parameters={
            "threshold": 0.5,
            "min_silence_duration_ms": 300,
        },
    )

    print(f"[3/3] Extrayendo tiempos de palabras...")

    tiempos = []
    total_palabras = 0

    for segment in segments:
        if not hasattr(segment, 'words') or segment.words is None:
            # Si el segmento no tiene palabras individuales, añadir el segmento completo
            palabras = segment.text.strip().split()
            if palabras:
                dur_por_palabra = (segment.end - segment.start) / len(palabras)
                for i, palabra in enumerate(palabras):
                    inicio = segment.start + i * dur_por_palabra
                    fin    = inicio + dur_por_palabra
                    tiempos.append({
                        "palabra": _limpiar(palabra),
                        "inicio":  round(inicio, 3),
                        "fin":     round(fin, 3),
                    })
                    total_palabras += 1
            continue

        for word in segment.words:
            palabra_limpia = _limpiar(word.word)
            if palabra_limpia:
                tiempos.append({
                    "palabra": palabra_limpia,
                    "inicio":  round(word.start, 3),
                    "fin":     round(word.end, 3),
                })
                total_palabras += 1

    duracion_total = info.duration if hasattr(info, 'duration') else (tiempos[-1]["fin"] if tiempos else 0)

    print(f"\n✓ Transcripción completada:")
    print(f"  → Palabras detectadas: {total_palabras}")
    print(f"  → Duración total:      {duracion_total:.1f}s ({duracion_total/60:.1f} min)")
    print(f"  → Idioma detectado:    {getattr(info, 'language', 'N/D')}")

    return tiempos


def _limpiar(texto: str) -> str:
    """Elimina espacios extras y normaliza la palabra."""
    return texto.strip()


def guardar_json(tiempos: list[dict], ruta_salida: str) -> None:
    """Guarda el JSON de tiempos en un archivo."""
    with open(ruta_salida, "w", encoding="utf-8") as f:
        json.dump(tiempos, f, ensure_ascii=False, indent=2)
    print(f"\n✓ JSON guardado en: {ruta_salida}")


def generar_fragmento_js(tiempos: list[dict]) -> str:
    """
    Genera el fragmento de código JavaScript listo para pegar en carta.js.
    """
    lineas = ["// Pega esto en src/carta.js → TIEMPOS_PALABRAS = ["]
    for item in tiempos:
        lineas.append(
            f'  {{ "palabra": {json.dumps(item["palabra"], ensure_ascii=False)}, '
            f'"inicio": {item["inicio"]}, "fin": {item["fin"]} }},'
        )
    lineas.append("];")
    return "\n".join(lineas)


def main():
    parser = argparse.ArgumentParser(
        description="Genera JSON de tiempos de palabras desde un MP3 con faster-whisper."
    )
    parser.add_argument(
        "audio",
        help="Ruta al archivo de audio (.mp3, .wav, .m4a, etc.)"
    )
    parser.add_argument(
        "--modelo", "-m",
        default="medium",
        choices=["tiny", "base", "small", "medium", "large-v2", "large-v3"],
        help="Tamaño del modelo Whisper (default: medium)"
    )
    parser.add_argument(
        "--idioma", "-l",
        default="es",
        help="Código de idioma ISO (default: es). Usa 'auto' para autodetección."
    )
    parser.add_argument(
        "--salida", "-o",
        default="carta_tiempos.json",
        help="Ruta del archivo JSON de salida (default: carta_tiempos.json)"
    )
    parser.add_argument(
        "--solo-json",
        action="store_true",
        help="Imprime solo el JSON, sin mensajes extra (útil para scripts)"
    )

    args = parser.parse_args()

    # Verificar que el archivo de audio existe
    if not os.path.isfile(args.audio):
        print(f"Error: No se encuentra el archivo '{args.audio}'")
        sys.exit(1)

    idioma = None if args.idioma == "auto" else args.idioma

    # Transcribir
    tiempos = transcribir(args.audio, modelo=args.modelo, idioma=idioma)

    if not tiempos:
        print("Error: No se obtuvieron tiempos. Verifica el archivo de audio.")
        sys.exit(1)

    # Guardar JSON
    guardar_json(tiempos, args.salida)

    # Mostrar preview y fragmento JS
    if not args.solo_json:
        print("\n── Primeras 5 palabras (preview) ──────────────────")
        for item in tiempos[:5]:
            print(f'  "{item["palabra"]}"  {item["inicio"]}s → {item["fin"]}s')

        print("\n── Cómo usar ──────────────────────────────────────")
        print("1. Abre src/carta.js")
        print("2. Localiza la variable TIEMPOS_PALABRAS")
        print("3. Reemplaza el array [] con el contenido de carta_tiempos.json")
        print("   (puedes copiar-pegar el contenido del archivo)")
        print("\nFormato del JSON:")
        print('  [{ "palabra": "Sé", "inicio": 0.0, "fin": 0.35 }, ...]')

    else:
        # Modo script: solo imprime el JSON
        print(json.dumps(tiempos, ensure_ascii=False, indent=2))


if __name__ == "__main__":
    main()
