# Siete modos VGE · ejemplo práctico

Siete temas de ingeniería, cada uno explicado con el modo de VisualGraficEyes que
mejor lo hace entender. Es una página única con pestañas, generada con la skill y
verificada en navegador.

**Verla:** [josanto21.github.io/VisualGraficEyes/ejemplos/siete-modos/](https://josanto21.github.io/VisualGraficEyes/ejemplos/siete-modos/)
(GitHub Pages desde `docs/` en `main`). Sin Pages, descarga
`docs/ejemplos/siete-modos/` y abre `index.html` en un navegador con conexión:
carga Three.js y las fuentes desde CDN.

## Qué contiene

| Modo | Tema | Qué se puede hacer | Motor real | Tipo |
| --- | --- | --- | --- | --- |
| Anatomía | Ventilador de escritorio | Recorrido funciona → entramos → aislamos → despiece → volvemos; tocar una pieza muestra su función | Three.js 0.180 | Ilustración |
| Laboratorio | Filtro RC pasa-bajos | Mover R, C y frecuencia cambia a la vez la curva, la onda y las medidas | Modelo JS con fórmula de primer orden | Modelo calculado |
| Escena 3D | Engranajes de 18 y 27 dientes | Girar, cortar con rayado, ver círculos primitivos y línea de acción | Three.js 0.180 con perfil de evolvente | Modelo geométrico |
| Pasos | Ordenamiento burbuja | Anterior, siguiente, reproducir; la línea de código activa se resalta | Ejecuta el algoritmo real y guarda la traza | Simulación |
| Video | Cómo funciona un transistor | Video de 20 s con apertura, desarrollo y cierre | Remotion 4.0.541, renderizado | Video |
| Mapa | Corrosión del hierro | Activar una protección muestra qué eslabón de la pila corta | SVG | Mapa causal |
| Datos | Corriente de un LED según su resistencia | Cambiar fuente y color del LED; marca el límite de 20 mA y recomienda un valor E12 | Ley de Ohm con caída fija del LED | Cálculo |

Todas las pestañas tienen selector de nivel (Para todos / Técnico / Avanzado),
ficha de procedencia y un cierre «Qué debes llevarte».

## Archivos

| Ruta | Contenido |
| --- | --- |
| `docs/ejemplos/siete-modos/index.html` | Página publicada (generada; no editar a mano) |
| `docs/ejemplos/siete-modos/transistor.mp4`, `transistor-poster.jpg` | Video renderizado y su póster |
| `examples/siete-modos/pagina/` | Fuente de la página: `head.html` (estilos), `body.html`, `common.js` (laboratorio, pasos, video, mapa, datos), `three.js` (ventilador y engranajes) y `build.mjs` |
| `examples/siete-modos/video/` | Proyecto Remotion del video |

## Reconstruir

Página (Node 22 o posterior):

```sh
node examples/siete-modos/pagina/build.mjs
```

Escribe `docs/ejemplos/siete-modos/index.html` y, para publicar como artefacto de
claude.ai, el fragmento `out/siete-modos/artefacto.html`.

Video:

```sh
cd examples/siete-modos/video
npm ci              # también copia las fuentes a public/
npm run studio      # vista previa
npm run render      # escribe docs/ejemplos/siete-modos/transistor.mp4
npm run poster      # requiere ffmpeg
```

Si Remotion no puede descargar su navegador, añade
`-- --browser-executable=<ruta de Chrome>` a `render`. Así se renderizó aquí.

## Verificación

`npm run verify:page -- docs/ejemplos/siete-modos/index.html` (herramienta del
Bloque D) a 390 y 1280 px, en tema claro y oscuro, recorriendo las siete pestañas
y sus etapas: **PASA**, sin fallas, sin errores de consola y sin desbordamiento
horizontal. Queda un aviso: en Datos, a 390 px, cada barra del gráfico mide
34 px de ancho; sigue por encima del mínimo de 24 px, pero no llega a los 44 px
cómodos para el dedo. La verificación usó el Chrome del sistema (153.0.8010.12)
en lugar del navegador fijado del proyecto, así que no es reproducible al pie de
la letra.

Antes de publicar, el verificador encontró cuatro problemas, que se corrigieron:

| Problema | Corrección |
| --- | --- |
| Cada clic tardaba unos 3 s más que el anterior tras abrir el ventilador 3D (4 → 7 → 10 → 14 s). OrbitControls emite `change` dentro del ciclo de dibujo y eso agendaba un segundo `requestAnimationFrame`: los ciclos se duplicaban en cada cuadro | Agendar el siguiente cuadro solo si no hay uno pendiente; ahora cada clic tarda unos 0,4 s |
| Botones y selector de nivel de 34–40 px | 44 px |
| Enlace del pie y deslizadores de 20–30 px de alto | 44 px |
| La versión «0.180» junto a cantidades con coma decimal | Versiones dentro de `<code data-version>` |

Además se comprobó:

- Burbuja con la entrada de ejemplo [5, 3, 8, 1, 6, 2]: 15 comparaciones y 9
  intercambios hasta [1, 2, 3, 5, 6, 8].
- LED rojo (2,0 V) a 5 V con 220 Ω: 13,6 mA. A 12 V: mínimo 500 Ω, valor E12
  560 Ω, 17,9 mA y 179 mW en la resistencia.
- Filtro con R = 1 kΩ y C = 100 nF: corte en 1,59 kHz.
- Video: 600 cuadros, 30 fps, 1080 × 1080, 20 s (ffprobe). Un cuadro renderizado
  de nuevo desde `video/src/index.jsx` coincide con el MP4 publicado (diferencia
  media 0,16 sobre 255).

**NO VERIFICADO:** fluidez del 3D en un teléfono físico, comprensión con
personas reales, la importación del texto de CircuitJS que ofrece el laboratorio
y la página publicada en GitHub Pages.

## Límites declarados en la página

- Ventilador: velocidad y medidas ilustrativas; el despiece es didáctico.
- Filtro: fuente ideal, salida sin carga, régimen permanente.
- Engranajes: sin juego entre dientes ni socavado de tallado.
- Transistor: β = 100 y carga de 240 Ω son supuestos; la velocidad de los puntos es ilustrativa.
- LED: caída fija; la real depende del fabricante, la corriente y la temperatura.

Fuentes tipográficas: Big Shoulders Display, IBM Plex Sans e IBM Plex Mono
(SIL Open Font License 1.1), desde Google Fonts en la página y desde
`@fontsource` en el video.
