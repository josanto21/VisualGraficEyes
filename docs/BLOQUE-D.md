# Bloque D · entorno, verificación y evaluación de la skill

5 de noviembre de 2026, America/Panama. Versión **2.0.0-alpha.2.3**. Base:
`5745c3524d43dc3970b3f32fbc92ae07cbf0d90a` (Bloque C). Rama `bloque-d`.
El PR apunta a `bloque-c`, que sigue sin fusionar; así su diff contiene solo D.
Después de fusionar A, B y C, cambiar su base a `main`. Las fusiones corresponden
al usuario.

## Por qué

Una prueba real de la skill (una página con los siete modos publicada como
artefacto de claude.ai) mostró tres problemas que la skill no resolvía:

| Problema observado | Consecuencia |
| --- | --- |
| Remotion no pudo descargar su navegador (`remotion.media` bloqueado) y `falstad.com` no respondía; se supo a mitad del trabajo | Tiempo perdido y planes que cambian tarde |
| La skill exige verificar, pero no da cómo; el guion de verificación se escribió desde cero | Verificaciones distintas en cada entrega y difíciles de repetir |
| No hay casos de prueba de la skill | No se puede medir si un cambio la mejora o la empeora, ni comparar modelos |

También aparecieron reglas que faltaban: decimales mezclados entre video y página,
una ficha de procedencia improvisada, el choque con la skill oficial de Remotion
(«no renderizar salvo pedido explícito») cuando el video va dentro de una página,
y los límites de los artefactos de claude.ai.

## Cambios

| Mejora | Archivos | Resultado |
| --- | --- | --- |
| Doctor del entorno | `src/core/doctor.mjs`, `tools/vge.mjs` | `npm run core:doctor` clasifica navegador y motores en LISTO, PREPARABLE (con el comando que falta) o BLOQUEADO (con la alternativa) y da un plan por modo. Red comprobada con curl a través del proxy del entorno; `--sin-red` la omite; `--json` da el detalle. La decisión es una función pura con pruebas. |
| Navegador de respaldo | `tools/browser.cjs` | El navegador fijado sigue teniendo prioridad. Si falta y no se puede descargar, `VGE_BROWSER=<ruta>` permite usar otro Chrome; `browser.vgeInfo` lo marca `reproducible:false`. |
| Verificador de páginas | `tools/verify-page.cjs` | `npm run verify:page -- página.html [--artefacto]`: 390 y 1280 px, temas claro y oscuro, recorrido por `role="tab"` y `data-step`, capturas e informe JSON. FALLA: errores de consola o de carga, recursos bloqueados por la CSP aproximada de artefactos, desbordamiento horizontal, controles < 24 px, fondo transparente en artefactos. AVISO: controles de 24–44 px (`--tactil-estricto` los vuelve FALLA), texto cortado, decimales mezclados, clics que no responden en 15 s. Sirve desde `node_modules` los scripts de jsDelivr/unpkg cuya versión coincide. |
| Evals | `skill/evals/` (10 casos, 45 criterios) | Formato de `claude plugin eval`: un caso por modo y cuatro de borde (solo texto, consulta simple, Manim ausente, video). Los criterios piden cosas comprobables: fórmulas y valores concretos, no afirmar un video sin render, ficha de procedencia, «Qué debes llevarte». |
| Reglas de la skill | `skill/SKILL.md`, `references/nucleo-y-herramientas.md` | Paso previo con el doctor; verificación con la herramienta; ficha de procedencia; una sola convención numérica; render de Remotion cuando el video va en una página y `--browser-executable` como respaldo; tabla de tiempo por motor. |
| Entrega en artefactos | `skill/references/entrega-en-artefactos.md` | Orígenes permitidos, Three.js con import map, video como archivo adjunto, lo que no se puede incrustar y cómo verificar antes de publicar. |
| Pruebas | `tests/block-d.test.mjs`, `tools/check-block-d.cjs`, `tests/fixtures/verify/` | Diez pruebas unitarias y tres comprobaciones en navegador: una página buena que debe pasar, una mala que debe fallar por seis motivos concretos y el plan del doctor. |

## Ejecución y resultados

Node 22.23.4, Linux x64. Chrome for Testing no se pudo descargar en este entorno
(`storage.googleapis.com` sin resolución DNS), así que las comprobaciones con
navegador usaron `VGE_BROWSER=/usr/bin/google-chrome` (Chrome for Testing
153.0.8010.12) con WebGL por SwiftShader. **No es la versión fijada (156.0.8078.4):
esos resultados no son reproducibles** hasta repetirlos tras `npm run browser:install`.

| Comando | Código | Resultado |
| --- | --- | --- |
| `npm test` | 0 | 91/91 |
| `npm run validate` | 0 | Dos lecciones válidas con tres capas |
| `npm run core:validate` | 0 | 6 escenas, 6 motores |
| `npm run core:doctor` | 0 | Ver tabla siguiente |
| `npm run check:390` | 0 | VGE-005, VGE-006, sin jerga, capas sin WebGL: PASS |
| `npm run check:block-a` | 0 | 3/3 |
| `npm run check:block-d` | 0 | 3/3 |

Salida del doctor en este entorno:

| Motor | Estado | Siguiente paso o alternativa |
| --- | --- | --- |
| Verificación visual | PREPARABLE | `VGE_BROWSER=/usr/bin/google-chrome` (no reproducible) |
| Three.js | LISTO | — |
| Anatomy | LISTO | Figura: hasta 1 h |
| Remotion | PREPARABLE | `npm ci --prefix integrations/remotion` |
| Manim | PREPARABLE | venv + `pip install -r integrations/manim/requirements.txt` |
| CircuitJS | BLOQUEADO | Modelo JS explícito y texto importable «NO VERIFICADO» |
| Spline | BLOQUEADO | Three.js |
| ffmpeg | LISTO | — |

## Caso real: la página de los siete modos

Se pasó el verificador sobre la página que motivó este bloque (fragmento de
artefacto, 101 KB, más un MP4 de Remotion). Resultado en
[verification.json](../qa/block-d/verification.json), sección `casoReal`.
Hallazgos que la revisión manual no había marcado:

| Hallazgo | Vistas | Nivel | Lectura |
| --- | --- | --- | --- |
| Controles de 36–40 px (selector de nivel y botones) | 18 de 18 | AVISO | Por debajo de los 44 px que exige `check:390` en este proyecto |
| Versión «0.180» junto a cantidades con coma («1,5») | 5 | AVISO | La versión iba fuera de `<code>`; motivó la regla de procedencia y `data-version` |
| Clics sin respuesta en 15 s tras abrir las escenas 3D | 11 | AVISO | Con WebGL por software el ciclo de dibujo continuo satura el hilo principal; en un teléfono real es «NO VERIFICADO» |
| Fuentes de Google sin cargar | — | aviso externo | Bloqueo de red del entorno, no de la página |

Estado: **PASA** con 0 fallas y 34 avisos en 18 vistas (4 iniciales y 14 del
recorrido). Three.js 0.180.0 se sirvió desde `node_modules` (3 archivos) y la
CSP aproximada no bloqueó nada.

El verificador también produjo un falso positivo que se corrigió en este
bloque: el navegador cancela la descarga de un `<video>` al obtener sus
metadatos (`net::ERR_ABORTED`) y eso se contaba como error de carga.

## Pendiente y «NO VERIFICADO»

- Repetir `check:390`, `check:block-a` y `check:block-d` con el navegador fijado.
- Las evals no se ejecutaron con un modelo: son ejecuciones reales y facturadas.
  Con Claude Code: `claude plugin eval skill --allow-tools Write,Edit,Bash`.
- La CSP del verificador es una aproximación de la lista documentada, no la
  cabecera real de claude.ai.
- Rendimiento en un teléfono físico y comprensión de personas reales.
- Las mejoras 4 (kit de componentes), 5 (CircuitJS servido en el mismo origen)
  y 6 (SKILL.md como enrutador por modo) no se tocaron en este bloque.
