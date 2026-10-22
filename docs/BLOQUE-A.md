# Bloque A · defectos de VGE

Fecha: 22 de octubre de 2026. Base: `2abb25de89bc8c93819ac291e2ee4bb6abf48825`.
Rama de entrega: `bloque-a`; versión del paquete conservada: `2.0.0-alpha.2.1`.

Los renders fallidos conservan la exportación anterior. Los estados de escala y
reloj inválidos se rechazan, y la interfaz del ventilador refleja los cambios
por API y sigue explicando la idea cuando falta WebGL. Solo se desarrolla el
Bloque A; los siguientes bloques quedan pendientes de revisión del usuario.

## Cambios y regresiones

| Defecto | Cambio | Evidencia antes → después |
| --- | --- | --- |
| VGE-001 | Temporal junto a la salida, verificación estructural y sustitución por rename; espera al cierre al abortar | Fallaban conservación, ejecutable ausente, aborto, HTML inválido, MP4 truncado y construcción temporal → pasan. Se comparan bytes y SHA-256 de la salida previa. |
| VGE-002 | Considera las poses y cada escala de paso al acotar bindings LINEAR/SINE; rechaza resultados no positivos o no finitos | Tres casos de escala negativa/cero aceptados antes → rechazados. La composición válida con parámetros y fallo sigue pasando. |
| VGE-003 | Calcula y valida todas las fases candidatas antes de asignarlas | El caso subnormal no lanzaba error y contaminaba fases → rechaza sin cambiar vínculos, estado ni giro. |
| VGE-004 | Contención respecto de resolve(root, 'out'), usando relative, sep e isAbsolute | El plan rechazaba el separador Windows → pasa la reproducción del separador; se mantienen los rechazos de escapes y prefijos parecidos. |
| VGE-007 | Escucha paso, parámetro, selección, despiece y fallo; añade selector de vista y sincroniza historia/controles | Slider de despiece 0 frente a estado 1 → 100. También pasan cambios de vista por API/UI, fase 120 y 30.5, separación 0.655 y coherencia del giro ilustrativo a fase 0. |
| VGE-008 | Comprueba el contexto antes de crear el renderer y conserva la historia con SVG fijo | Se perdía la pregunta y la explicación → ambas permanecen, con analogía, dibujo y las tres capas; sin errores de consola en la prueba forzada. |
| VGE-014 | Explica que los grises incluyen metal y plástico, según el modelo | Faltaba la nota correcta en la escena → texto comprobado en navegador y cajita con material plastic. |

La escala de los fallos visuales ya exige valores positivos en el esquema. Los
efectos de fallo sobre parámetros siguen pasando por la comprobación de rango
antes de mutar el motor. La nueva validación acota el intervalo completo de cada
binding en la pose y en los overrides de paso; no solo el valor inicial.

`runNativeJob` comprueba archivo regular no vacío, documento HTML/SVG y estructura
del contenedor MP4, incluyendo tamaños de cajas. No certifica que cada fotograma
del video sea decodificable ni su calidad visual: **NO VERIFICADO**. La prueba MP4
usa un clip negro propio, inspeccionado con ffprobe (H.264, 16 × 16, un fotograma,
un segundo). No demuestra un render de Manim o Remotion.

## Pruebas antes y después

Se ejecutó la misma batería sobre una copia aislada del commit base y sobre
la rama corregida. Los hashes de los archivos de regresión coinciden entre
ambas copias y están en `qa/block-a/verification.json`. La copia de base usó las
mismas versiones de dependencias; no se alteró main para probar los fallos.

| Batería | Base | Corregido |
| --- | --- | --- |
| Regresiones Node del bloque | 14 pruebas: 11 fallan, 3 pasan; salida 1 | Las 14 pasan, incluidas en npm test |
| Regresiones de interfaz a 390 px | VGE-007, VGE-008 y VGE-014 fallan; salida 1 | 3/3 pasan; salida 0 |
| Suite completa | La suite anterior tenía 59 pruebas aprobadas | 73/73, sin fallos, omisiones ni cancelaciones |

## Comandos finales ejecutados

| Comando | Salida | Resultado real |
| --- | --- | --- |
| `npm ci` | 0 | 8 paquetes instalados |
| `npm test` | 0 | 73/73 pruebas; 0 fallos |
| `npm run validate` | 0 | psc y psc.beginner: 75 entidades/10 pasos; bubble-sort: 4 entidades/7 pasos |
| `npm run build` | 0 | HTML autónomo: 994793 bytes |
| `npm run check:390` | 0 | 17 comprobaciones existentes; 390 px y revisión adicional a 320 px |
| `node tools/check-block-a.cjs` | 0 | 3 regresiones de interfaz; 390 px y fallback adicional a 320 px |

Los comandos npm mostraron el aviso del entorno `Unknown env config "http-proxy"`.
Las escenas normales y la prueba sin WebGL no registraron errores JS ni de consola.

Para los dos checks de navegador se suministraron `VGE_PLAYWRIGHT_MODULE` y
`VGE_CHROME_PATH`: Playwright 1.62.1 externo al package.json y Chromium
157.0.8080.0. La descarga estándar de Playwright devolvió ZIP truncados; se
preparó ese Chromium mediante `@remotion/cli browser ensure`. La dependencia
reproducible de navegador, VGE-009, sigue reservada al Bloque B. No se afirma
que check:390 funcione aquí solo con npm ci sin esa preparación.

El checker histórico imprime una afirmación sobre contar frases, pero no cuenta
explícitamente las frases por paso. Ese conteo es **NO VERIFICADO** por dicho
checker y se corregirá en el Bloque B. No se convierte su mensaje en una
certificación de comprensión o de rigor pedagógico.

## Archivos cambiados

- `demo/index.html`
- `dist/index.html`
- `docs/index.html`
- `engine/VGEEngine.mjs`
- `engine/ui/mountBeginnerVGE.mjs`
- `engine/validate.mjs`
- `src/VGEEngine.mjs`
- `src/core/native-jobs.mjs`
- `src/ui/mountBeginnerVGE.mjs`
- `src/validate.mjs`
- `tests/core.test.mjs`
- `tests/block-a.test.mjs`
- `tests/fixtures/one-frame.mp4`
- `tests/fixtures/README.md`
- `tools/check-block-a.cjs`
- `docs/BLOQUE-A.md`
- `qa/block-a/verification.json`

Las tres copias de compatibilidad en engine/ se sincronizan byte a byte con src/
para no dejar el defecto en la copia existente. La consolidación en un único
árbol sigue en el Bloque B. dist/index.html y docs/index.html contienen el mismo
bundle actualizado. AUDITORIA.md, skill/, package.json y los lockfiles no cambian.

## Qué revisar en el teléfono

Descarga `dist/index.html` desde la rama `bloque-a` y abre el archivo. GitHub Pages
de main no es una vista previa de este PR.

1. Recorre las cuatro pantallas y abre «Explorar las piezas». En «Qué quieres
   mirar», alterna entre «Separar para mirar», «Parte que gira» y el conjunto:
   explicación, selección y barra de separación deben coincidir.
2. En «Turnos», mueve la separación y comprueba el campo y el giro ilustrativo.
   En «Ver dentro», separa y vuelve a juntar sin que las etiquetas salgan de la
   pantalla. Abre los tres niveles: la explicación común permanece visible.
3. En detalle avanzado, comprueba la distinción metal/plástico. Si tu navegador
   no dispone de WebGL, deben permanecer pregunta, analogía e imagen fija;
   «Repetir la explicación» y los detalles siguen disponibles.

## Límites de lo comprobado

- Chromium headless real con SwiftShader, no teléfono físico. Rendimiento, batería
  y comprensión de personas: **NO VERIFICADO**.
- Se reprodujo el separador Windows sobre filesystem POSIX; ejecución nativa
  en Windows: **NO VERIFICADO**.
- No se ejecutaron los cinco motores nativos ni una lección combinada en este
  bloque: esa integración es **NO VERIFICADO** aquí.
- Las capas del visor genérico, la reproducibilidad, la licencia, la Fase 3 y
  la Fase 4 permanecen en sus bloques acordados. No se eligió una licencia.

Los registros reales completos de los comandos y de las regresiones están en
`qa/block-a/verification.json`.
