# Video mínimo de prueba

`one-frame.mp4` contiene un fotograma negro propio, creado para probar la
validación del contenedor y la sustitución de exportaciones del Bloque A.
No es una salida de Manim ni de Remotion.

Comando usado para generarlo, desde la raíz del repositorio:

```sh
ffmpeg -hide_banner -loglevel error -f lavfi -i color=c=black:s=16x16:r=1:d=1 -frames:v 1 -an -c:v libx264 -pix_fmt yuv420p -movflags +faststart -map_metadata -1 tests/fixtures/one-frame.mp4
```

La inspección con `ffprobe` devolvió H.264, 16 × 16 px, un fotograma y un segundo.
Las pruebas de Node leen el archivo incluido: no necesitan ejecutar FFmpeg.
