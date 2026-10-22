# AUDITORÍA DEL PROYECTO VGE

Fecha de referencia: **22 de octubre de 2026 (UTC)**. Auditoría de solo lectura sobre la última entrega `VGE-v2-Fase-2.zip`, versión 1, y la skill instalada. Se contrastó el paquete Fase 1, versión 0, para la procedencia de archivos.

**Resultado de integridad:** los SHA-256 de los **51 archivos del proyecto y 7 de la skill permanecen idénticos** antes y después. `npm ci`, pruebas, build y sondas se ejecutaron en una copia aislada, no sobre la fuente ni la skill. Se modificó estado de modelos únicamente en memoria. No se aplicó `npm audit fix`, no se cambiaron dependencias, no se creó ni publicó un repositorio remoto.

Fuente del motor conservada para inspección: `/workspace/scratch/c949886d48cd/vge-auditoria/fuente/vge-v2-phase2`. Copia de ejecución: `/workspace/scratch/c949886d48cd/vge-auditoria/ejecucion`. SHA-256 del ZIP fuente: `75a90c3c7cfe6d1c7722756f5f5a3ea752de005a537324c50c5d1104ebf5a535`.

**Criterio de evidencia:** “Ejecución” significa una comprobación realizada en esta auditoría; “Lectura” significa inspección de archivos o metadata. Las conclusiones de diseño son propuestas apoyadas en esa evidencia, no cambios aplicados. Lo no comprobado se marca **NO VERIFICADO**. “Sin hallazgos” en una comprobación limitada no equivale a demostrar la ausencia universal de problemas.

## 1. INVENTARIO

El inventario completo corresponde al contenido entregado, no a todo el workspace ni a dependencias descargadas durante la auditoría. No se omiten archivos de ese paquete: **51 + 7 = 58**. `node_modules/` no existía en el ZIP; se generó únicamente en copias para las ejecuciones y queda fuera del ZIP de entrega de auditoría.

Las fechas del proyecto son las **fechas de modificación almacenadas en las entradas ZIP, sin zona horaria**; no son fechas de creación acreditadas. La hora original real y su zona: **NO VERIFICADO**. Las fechas de la skill son `mtime` del sistema en UTC. La fase de origen se deduce de presencia y SHA-256 en los paquetes F1/F2, no de una historia Git del motor; autoría y fecha real de primera creación del motor: **NO VERIFICADO**.

### 1.1 Árbol completo del motor, esquema, ejemplos y evidencias

Raíz lógica: `vge-v2-phase2/`; cada hoja muestra tamaño exacto en bytes y fecha ZIP.


```text
|-- README.md  [5210 B; 2026-10-22 07:49:06]
|-- demo/
|   |-- index.html  [9907 B; 2026-10-22 07:38:30]
|   `-- main.mjs  [1156 B; 2026-10-22 07:35:44]
|-- dist/
|   |-- THIRD-PARTY-LICENSES.txt  [6196 B; 2026-10-22 07:47:44]
|   `-- index.html  [989637 B; 2026-10-22 07:47:44]
|-- docs/
|   |-- FASE-1-CONTRATO.md  [10083 B; 2026-10-22 07:22:56]
|   |-- FASE-1-VERIFICACION.md  [2756 B; 2026-10-22 07:22:56]
|   |-- FASE-2.md  [6381 B; 2026-10-22 07:49:06]
|   `-- REVISION.html  [2150256 B; 2026-10-22 07:52:48]
|-- examples/
|   |-- bubble-sort.json  [12539 B; 2026-10-22 07:22:56]
|   |-- headless.mjs  [672 B; 2026-10-22 07:22:56]
|   |-- psc-factories.mjs  [2755 B; 2026-10-22 07:22:56]
|   |-- psc.beginner.graphics.json  [1516 B; 2026-10-22 07:38:30]
|   |-- psc.beginner.json  [69143 B; 2026-10-22 07:29:26]
|   |-- psc.graphics.json  [1037 B; 2026-10-22 07:22:56]
|   |-- psc.json  [69764 B; 2026-10-22 07:45:38]
|   `-- psc.lesson.json  [7491 B; 2026-10-22 07:47:44]
|-- package-lock.json  [17073 B; 2026-10-22 07:22:56]
|-- package.json  [664 B; 2026-10-22 07:45:38]
|-- qa/
|   |-- antes-390.png  [142381 B; 2026-10-22 07:28:10]
|   |-- comprobacion-390.json  [1547 B; 2026-10-22 07:49:10]
|   |-- despues-avanzado-390.png  [293161 B; 2026-10-22 07:49:08]
|   |-- despues-comun-390.png  [149950 B; 2026-10-22 07:49:08]
|   |-- despues-inicio-390.png  [81430 B; 2026-10-22 07:49:06]
|   |-- despues-relevo-390.png  [82402 B; 2026-10-22 07:49:06]
|   |-- despues-tecnico-390.png  [203877 B; 2026-10-22 07:49:08]
|   |-- intermedio-390.png  [138219 B; 2026-10-22 07:36:12]
|   |-- pieza-aux_winding-390.png  [169647 B; 2026-10-22 07:49:08]
|   |-- pieza-capacitor-390.png  [171797 B; 2026-10-22 07:49:10]
|   `-- pieza-main_winding-390.png  [169282 B; 2026-10-22 07:49:08]
|-- schema/
|   |-- vge.graphics.schema.json  [5438 B; 2026-10-22 07:47:44]
|   `-- vge.schema.json  [23565 B; 2026-10-22 07:22:56]
|-- src/
|   |-- AssetLoader.mjs  [545 B; 2026-10-22 07:22:56]
|   |-- VGEEngine.mjs  [22916 B; 2026-10-22 07:29:26]
|   |-- factories.mjs  [3853 B; 2026-10-22 07:22:56]
|   |-- graphics/
|   |   |-- CoilPulse.mjs  [1379 B; 2026-10-22 07:31:16]
|   |   |-- FieldVectors.mjs  [6687 B; 2026-10-22 07:30:18]
|   |   |-- VGEGraphics.mjs  [8545 B; 2026-10-22 07:38:30]
|   |   `-- validateGraphics.mjs  [4515 B; 2026-10-22 07:30:18]
|   |-- ui/
|   |   |-- SignalDiagram.mjs  [1840 B; 2026-10-22 07:31:16]
|   |   |-- mountBeginnerVGE.mjs  [22638 B; 2026-10-22 07:45:38]
|   |   |-- mountVGE.mjs  [15357 B; 2026-10-22 07:22:56]
|   |   `-- status.mjs  [1203 B; 2026-10-22 07:22:56]
|   `-- validate.mjs  [9667 B; 2026-10-22 07:22:56]
|-- tests/
|   |-- engine.test.mjs  [15788 B; 2026-10-22 07:22:56]
|   |-- graphics.test.mjs  [8231 B; 2026-10-22 07:45:38]
|   `-- lesson.test.mjs  [4854 B; 2026-10-22 07:39:44]
`-- tools/
    |-- build.mjs  [1829 B; 2026-10-22 07:22:56]
    |-- check-390.cjs  [11296 B; 2026-10-22 07:47:44]
    |-- serve.mjs  [758 B; 2026-10-22 07:22:56]
    `-- validate-examples.mjs  [589 B; 2026-10-22 07:42:04]
```

| Archivo | Qué es | Fase acreditada por paquetes | Uso / estado |
| --- | --- | --- | --- |
| README.md | Guía de uso, desarrollo, límites y archivos. | F1; modificado/renombrado en F2 | Documentación usada por personas; comandos contrastados. |
| demo/index.html | Plantilla de HTML/CSS con marcador VGE_BUNDLE. | F2 (no está en el paquete F1) | Entrada de tools/build.mjs; no abrir como demo final. |
| demo/main.mjs | Bootstrap; carga modelo, gráficos y lección; selector por ID. | F2 (no está en el paquete F1) | Runtime, empaquetado en dist; contiene el despacho que causa H01. |
| dist/THIRD-PARTY-LICENSES.txt | Avisos de los cinco paquetes efectivamente incluidos. | F2 (no está en el paquete F1) | Artefacto legal/documental generado; el HTML lleva los mismos avisos. |
| dist/index.html | Demo autónoma de 989.637 bytes con dependencias y datos. | F2 (no está en el paquete F1) | Entrada web real, usada en navegador; reconstrucción idéntica. |
| docs/FASE-1-CONTRATO.md | Contrato histórico de datos y semántica del núcleo. | F1; modificado/renombrado en F2 | Documentación; procede de docs/CONTRATO.md de F1, renombrada y anotada. |
| docs/FASE-1-VERIFICACION.md | Evidencia histórica de 27 pruebas y límites. | F1; modificado/renombrado en F2 | Archivo histórico, no resultado de la auditoría actual. |
| docs/FASE-2.md | Diseño, convenciones, límites y verificación declarada de F2. | F2 (no está en el paquete F1) | Documentación enlazada desde README; contrastada con código y ejecución. |
| docs/REVISION.html | Informe previo de comprensión; diez PNG embebidos. | F2 (no está en el paquete F1) | Documento usado desde README; no es una prueba con participantes externos. |
| examples/bubble-sort.json | Traza precomputada de burbuja para [3,1,2], siete pasos. | F1, mismo SHA-256 | Usado en tests/validación y cargador genérico; no calcula entradas nuevas. |
| examples/headless.mjs | Ejemplo de API sin WebGL. | F1, mismo SHA-256 | Ejecutado por npm run example; usa psc.json, no la variante inicial por capas. |
| examples/psc-factories.mjs | Fábrica paramétrica psc.blade y validación de sus medidas. | F1, mismo SHA-256 | Usada por demo, ejemplo y pruebas; extensión de dominio fuera del núcleo. |
| examples/psc.beginner.graphics.json | Plano, colores, fuentes, selección y estela de la demo por capas. | F2 (no está en el paquete F1) | Usado por demo/main y pruebas de lección. |
| examples/psc.beginner.json | Modelo PSC para la entrada por capas, 75 entidades y diez pasos. | F2 (no está en el paquete F1) | Modelo inicial de la web y pruebas; duplica las 26 definiciones geométricas del PSC anterior. |
| examples/psc.graphics.json | Configuración de campo/plano/selección del PSC anterior. | F2 (no está en el paquete F1) | Usada por tests/graphics.test; no se elige al cargar psc.json en el bootstrap actual. |
| examples/psc.json | Modelo PSC anterior, 75 entidades y diez pasos. | F1; modificado/renombrado en F2 | Usado por CLI, pruebas y cargador; carga interactiva incompatible con la lección actual, H01. |
| examples/psc.lesson.json | Historia de cuatro pasos, tres textos por paso, piezas, anclas y glosario. | F2 (no está en el paquete F1) | Usado por demo y test de lección; carece de esquema propio. |
| package-lock.json | Lockfile de npm, versiones e integridades. | F1; modificado/renombrado en F2 | Usado por npm ci; incluye binarios opcionales de otras plataformas. |
| package.json | Manifest, engines, export y seis scripts. | F1; modificado/renombrado en F2 | Usado por npm; no declara Playwright ni una licencia del proyecto. |
| qa/antes-390.png | Captura de la versión anterior; PNG de ancho 390. | F2 (no está en el paquete F1) | Archivo de evidencia histórica, no runtime. Su contenido binario está duplicado en REVISION.html; no es huérfano funcional. |
| qa/comprobacion-390.json | Registro histórico de la comprobación anterior. | F2 (no está en el paquete F1) | Evidencia archivada; no confundirlo con los resultados nuevos de esta auditoría. |
| qa/despues-avanzado-390.png | Captura de la capa avanzada; PNG de ancho 390. | F2 (no está en el paquete F1) | Archivo de evidencia histórica, no runtime. Su contenido binario está duplicado en REVISION.html; no es huérfano funcional. |
| qa/despues-comun-390.png | Captura de la capa común; PNG de ancho 390. | F2 (no está en el paquete F1) | Archivo de evidencia histórica, no runtime. Su contenido binario está duplicado en REVISION.html; no es huérfano funcional. |
| qa/despues-inicio-390.png | Captura de apertura/analogía; PNG de ancho 390. | F2 (no está en el paquete F1) | Archivo de evidencia histórica, no runtime. Su contenido binario está duplicado en REVISION.html; no es huérfano funcional. |
| qa/despues-relevo-390.png | Captura del segundo paso; PNG de ancho 390. | F2 (no está en el paquete F1) | Archivo de evidencia histórica, no runtime. Su contenido binario está duplicado en REVISION.html; no es huérfano funcional. |
| qa/despues-tecnico-390.png | Captura de términos y ondas; PNG de ancho 390. | F2 (no está en el paquete F1) | Archivo de evidencia histórica, no runtime. Su contenido binario está duplicado en REVISION.html; no es huérfano funcional. |
| qa/intermedio-390.png | Captura de la iteración intermedia; PNG de ancho 390. | F2 (no está en el paquete F1) | Archivo de evidencia histórica, no runtime. Su contenido binario está duplicado en REVISION.html; no es huérfano funcional. |
| qa/pieza-aux_winding-390.png | Captura de selección de B; PNG de ancho 390. | F2 (no está en el paquete F1) | Archivo de evidencia histórica, no runtime. Su contenido binario está duplicado en REVISION.html; no es huérfano funcional. |
| qa/pieza-capacitor-390.png | Captura de selección del arranque; PNG de ancho 390. | F2 (no está en el paquete F1) | Archivo de evidencia histórica, no runtime. Su contenido binario está duplicado en REVISION.html; no es huérfano funcional. |
| qa/pieza-main_winding-390.png | Captura de selección de A; PNG de ancho 390. | F2 (no está en el paquete F1) | Archivo de evidencia histórica, no runtime. Su contenido binario está duplicado en REVISION.html; no es huérfano funcional. |
| schema/vge.graphics.schema.json | Exportación JSON del esquema gráfico definido en JavaScript. | F2 (no está en el paquete F1) | Generado por build; útil a consumidores externos; la app usa la constante JS. |
| schema/vge.schema.json | JSON Schema 2020-12 de documentos de dominio. | F1, mismo SHA-256 | Importado por src/validate.mjs; igual al entregado en F1. |
| src/AssetLoader.mjs | Interfaz reservada de .glb; load rechaza la operación. | F1, mismo SHA-256 | Reservado y probado; sin consumidor de producción. No es un cargador implementado ni un huérfano accidental. |
| src/VGEEngine.mjs | Estado, jerarquía, recursos, parámetros, reloj, API y ciclo de vida. | F1; modificado/renombrado en F2 | Usado por ambas UI, CLI y pruebas; núcleo funcional. |
| src/factories.mjs | Primitivas paramétricas, sus validadores y claves de caché. | F1, mismo SHA-256 | Usado por validador y motor; construcción al montar. |
| src/graphics/CoilPulse.mjs | Brillo de bobinas a partir del canal iNorm. | F2 (no está en el paquete F1) | Usado por la UI PSC y pruebas; canal y curva de brillo fijados en código. |
| src/graphics/FieldVectors.mjs | Flechas, suma vectorial y estela preasignada. | F2 (no está en el paquete F1) | Usado por VGEGraphics; lee canales y fases del motor. |
| src/graphics/VGEGraphics.mjs | Adaptador de clipping, contorno, respaldo ligero y campo. | F2 (no está en el paquete F1) | Usado por ambas UI y pruebas; conserva geometrías del modelo. |
| src/graphics/validateGraphics.mjs | Esquema gráfico en JS y validación de referencias. | F2 (no está en el paquete F1) | Usado al montar, en pruebas y para exportar el JSON Schema. |
| src/ui/SignalDiagram.mjs | Curvas SVG y cursor ligados al reloj del motor. | F2 (no está en el paquete F1) | Usado por UI PSC; valores del gráfico y canal iNorm están fijados en código. |
| src/ui/mountBeginnerVGE.mjs | Controlador de historia, niveles, controles, rótulos y escena PSC. | F2 (no está en el paquete F1) | Runtime principal; específico del ventilador y no totalmente gobernado por JSON. |
| src/ui/mountVGE.mjs | Visor genérico anterior para documentos distintos de fan-psc. | F2 (no está en el paquete F1) | Usado como fallback; sin capas y con regresión de estilos, H05. |
| src/ui/status.mjs | Badge de rigor y panel de error con textContent. | F2 (no está en el paquete F1) | Usado en los dos montajes y cargador; el error reemplaza el visual. |
| src/validate.mjs | Validador estructural/semántico y de fábricas. | F1, mismo SHA-256 | Usado antes de construir; tiene el límite de escala documentado en H03. |
| tests/engine.test.mjs | 27 pruebas del núcleo, algoritmo y ciclo de vida. | F1, mismo SHA-256 | Ejecutado por npm test, todas correctas. |
| tests/graphics.test.mjs | 14 pruebas de gráficos, fallo, selección y campo anterior. | F2 (no está en el paquete F1) | Ejecutado por npm test, todas correctas. |
| tests/lesson.test.mjs | 8 pruebas de la variante por capas y sincronización. | F2 (no está en el paquete F1) | Ejecutado por npm test, todas correctas; no cubre todas las cargas del visor. |
| tools/build.mjs | Build con esbuild, licencias y exportación de esquema gráfico. | F2 (no está en el paquete F1) | Ejecutado por build/dev; genera un archivo sin CDN. |
| tools/check-390.cjs | Comprobación Playwright puntual de la demo PSC y 320 px adicional. | F2 (no está en el paquete F1) | Ejecutado en esta auditoría con entorno preparado; necesita Playwright y navegador externos. |
| tools/serve.mjs | Servidor local de una sola página, ligado a 127.0.0.1. | F2 (no está en el paquete F1) | Script de npm run dev; invoca build, no publica un sitio. |
| tools/validate-examples.mjs | Valida los tres JSON de dominio con fábricas. | F1; modificado/renombrado en F2 | Ejecutado por npm run validate; no valida lesson ni los dos gráficos. |

### 1.2 Skill instalada: ubicación y árbol completo

Ruta leída: `/root/.codex/skills/remote-skills/skill-6ad8ccde00048191b2ec865528e6866f`. Repositorio Git contenedor: `/root/.codex/skills/remote-skills`. Recurso del registro leído: `skill://flora-user-skills/root/.codex/skills/remote-skills/skill-6ad8ccde00048191b2ec865528e6866f/SKILL.md`.

`git log` contiene la primera materialización `d414526` del 2026-10-21, la incorporación del recorrido `6400c39` y la referencia de calidad gráfica `85d99d7` del 2026-10-22. El estado Git de esta carpeta estaba limpio al leerlo. Atribuir estos commits a una fase numerada del motor: **NO VERIFICADO**. No se actualizó la skill.


```text
|-- SKILL.md  [14005 B; 2026-10-22T00:29:24.838838+00:00]
|-- agents/
|   `-- openai.yaml  [415 B; 2026-10-21T14:35:25.094462+00:00]
|-- assets/
|   `-- icon.svg  [420 B; 2026-10-22T00:50:12.644053+00:00]
`-- references/
    |-- calidad-grafica-y-eficiencia.md  [3779 B; 2026-10-22T00:29:25.114843+00:00]
    |-- formatos-y-motores.md  [5540 B; 2026-10-21T14:35:25.094462+00:00]
    |-- funcionamiento-y-recorridos.md  [3789 B; 2026-10-21T21:35:59.474345+00:00]
    `-- rigor-por-materia.md  [4299 B; 2026-10-21T14:35:25.095344+00:00]
```

| Archivo de skill | Qué es | Fase / origen | Uso |
| --- | --- | --- | --- |
| SKILL.md | Método VGE y disparadores de uso. | Skill independiente; fase numérica NO VERIFICADO. Primer commit: d414526 2026-10-21 Materialized from stored content | Leído como instrucción de asistente; no es un módulo del motor. |
| agents/openai.yaml | Nombre, prompt de activación, productos y referencias del icono. | Skill independiente; fase numérica NO VERIFICADO. Primer commit: d414526 2026-10-21 Materialized from stored content | Metadata de registro; activación efectiva en otros clientes: NO VERIFICADO. |
| assets/icon.svg | Icono vectorial de la skill. | Skill independiente; fase numérica NO VERIFICADO. Primer commit: d414526 2026-10-21 Materialized from stored content | Referenciado dos veces por agents/openai.yaml. |
| references/calidad-grafica-y-eficiencia.md | Matemática gráfica, recursos y verificación de rendimiento. | Skill independiente; fase numérica NO VERIFICADO. Primer commit: 85d99d7 2026-10-22 Add mathematical graphics quality and efficiency guidance to VGE | Referencia enlazada por SKILL.md; leída. |
| references/formatos-y-motores.md | Salidas HTML, Three.js, Manim, Remotion y simuladores. | Skill independiente; fase numérica NO VERIFICADO. Primer commit: d414526 2026-10-21 Materialized from stored content | Referencia enlazada por SKILL.md; leída; describe flujos, no implementaciones incluidas. |
| references/funcionamiento-y-recorridos.md | Funcionamiento, interior, aislamiento, rearmado y navegación. | Skill independiente; fase numérica NO VERIFICADO. Primer commit: 6400c39 2026-10-21 Add functioning, exploration and reconstruction workflow to VGE | Referencia enlazada por SKILL.md; leída. |
| references/rigor-por-materia.md | Criterios de exactitud por disciplina. | Skill independiente; fase numérica NO VERIFICADO. Primer commit: d414526 2026-10-21 Materialized from stored content | Referencia enlazada por SKILL.md; leída. |

### 1.3 Huérfanos y volumen

No se encontró un módulo de producción totalmente abandonado por falta de referencias: el visor genérico es un fallback activo; el cargador .glb es una reserva probada, sin carga real. Los PNG, el registro JSON y los documentos F1 son **archivo histórico**, no runtime. No se han borrado.

El proyecto ocupa **5,139,422 bytes** sin comprimir. `qa/` ocupa **1,603,693 bytes** y sus diez PNG están además embebidos, con hashes coincidentes, en `docs/REVISION.html` (**2.150.256 bytes**). Esa duplicación está verificada decodificando los diez `data:image/png`; no demuestra un uso en runtime. `psc.json` y `psc.beginner.json` tienen **las mismas 26 definiciones de geometría**, duplicadas en dos modelos completos. Son datos vivos distintos en el resto; no son archivos idénticos ni se deben eliminar sin resolver perfiles y referencias.

## 2. ARQUITECTURA

Diagrama ASCII solicitado. La primera flecha representa trabajo del asistente, no una importación de JavaScript:


```text
[skill/SKILL.md + referencias]
              |
              | orientan al asistente (NO se importan en el motor)
              v
       [Autor de contenido]
              |
       +------+---------------------------------------------+
       |                                                    |
       v                                                    v
[schema/vge.schema.json]                       [psc.lesson.json]
       | validacion AJV + referencias                     |
       v                                                    |
[JSON de dominio: PSC / beginner / bubble-sort]             |
       |                                                    |
       +--> [VGEEngine] <--- [factories + psc.blade]          |
               |                 |                          |
               |                 +--> BufferGeometry una vez
               | jerarquia + poses + reloj + parametros      |
               v                                            v
        [objetos Three.js] ---> [montaje UI / leccion por capas]
               ^                       |       |
               |                       |       +--> SignalDiagram (SVG)
[JSON grafico]--+-->[VGEGraphics]        +--> DOM / OrbitControls / toque
                     |    |
                     |    +--> FieldVectors (campo + estela)
                     +-------> plano / contorno / respaldo ligero
                                |
                  [CoilPulse: brillo del mismo canal]
                                |
                       [WebGLRenderer + camara]
                                |
          tools/build.mjs ---> dist/index.html autonomo
```

| Responsabilidad | Implementación leída / ejecutada |
| --- | --- |
| Construcción de geometría | src/factories.mjs y examples/psc-factories.mjs; VGEEngine.#build reutiliza por clave canónica. FieldVectors construye cuatro geometrías propias en la variante con estela. |
| Animación y estado | src/VGEEngine.mjs: #integrate, #apply, advance, play/pause, seekCycle, parámetros, pasos y fallos. Los adaptadores actualizan efectos después de la base. |
| Interfaz | mountBeginnerVGE para fan-psc y mountVGE para el resto; SignalDiagram dibuja curvas; status crea badge/error. La historia tiene cuatro estados propios, distintos de los diez steps del modelo. |
| Render | UI monta escena, luces, renderer y OrbitControls; el núcleo posee el RAF y la suspensión; build incluye el resultado en HTML. |
| Validación | src/validate.mjs combina el JSON Schema y reglas semánticas; validateGraphics tiene un esquema JS separado. No hay esquema formal de lesson. |
| Skill frente a motor | No existe un intérprete que ejecute SKILL.md, ni generación automática de modelos desde la skill. Es una guía para el asistente; la conexión de autoría es manual. |

### 2.1 Datos de dominio fijados en código que deberían parametrizarse


| Ubicación | Dato fijado y evidencia | Cambio propuesto, NO aplicado |
| --- | --- | --- |
| demo/main.mjs:10 | Selecciona la lección y gráficos solo por metadata.id === fan-psc; ambos modelos PSC comparten ese ID. Reproduce H01. | Un perfil/presentación explícito que enlace modelo + gráficos + lección compatibles. |
| src/ui/mountBeginnerVGE.mjs:12 | SVG de las personas/rueda, textos A/B y colores fijos. | Referenciar un recurso/analogía de presentación con roles y paleta, sin ejecutar código arbitrario del JSON. |
| src/ui/mountBeginnerVGE.mjs:43 | Fórmulas cos(theta), cos(theta-delta), eje +Z y significado físico fijados en HTML. | Texto/fórmula del perfil con correspondencia a bindings reales y supuestos del modelo. |
| src/ui/mountBeginnerVGE.mjs:49 | Slider de fase inicial 90, rango 0..90; el modelo permite 0..180 y el PSC previo comienza en 60. | Valor desde getParameter, rango desde definición y política de presentación explícita. |
| src/ui/mountBeginnerVGE.mjs:68 | Terminal de historia 3 y condiciones story === 3, aunque lesson.story es un array. | Cantidad y tipo de paso desde lesson; referencias de prueba 3D explícitas. |
| src/ui/mountBeginnerVGE.mjs:84 | Fallback rotor_core y referencia secundaria blades. | Roles de selección y referencias del paso en la lección. |
| src/ui/mountBeginnerVGE.mjs:108 | Dos fuentes A/B, nombres, unidades, umbral 0,04, parámetros phaseDeg/auxAmplitude/frequencyHz/slowMotion. | Canales, unidades, nombres y reglas didácticas del perfil. |
| src/graphics/CoilPulse.mjs:18 y src/ui/SignalDiagram.mjs:29 | Canal iNorm fijo; luz 0,04 + 0,85*abs(i), con límite 1,5. | Canal y escala visual explícitos, separados del valor físico. |
| demo/index.html:9 | Paleta repetida respecto a modelos, lesson y graphics. | Un origen semántico de colores; generar variables CSS desde ese perfil. |

Las fórmulas de teselación, shaders y algoritmos de caché sí pertenecen al código. Sus constantes de calidad no deben convertirse en expresiones JavaScript arbitrarias dentro de un JSON. La propuesta es mover **datos de dominio/presentación**, no el código del renderer.


## 3. ESTADO POR FASE


| Fase | Estado | Evidencia actual y alcance |
| --- | --- | --- |
| 1. Arquitectura data-driven | Hecho en alcance funcional; con deuda | Contrato, API, jerarquía, reuso, fallos y dos dominios ejecutados; 27 tests del núcleo. No está libre de defectos: H03/H04 delimitan validación y búsqueda numérica. |
| 2. Gráficos | Parcial | Plano, contorno/respaldo y campo funcionan en la demo inicial; 14+8 tests y revisión real de navegador. La mezcla de perfiles H01, fallback H05 y estados H07 impiden declararla cerrada de forma general. |
| 3. UX y A11y del plan | Pendiente | No se hallan breadcrumbs, tween de cámara al seleccionar, navegación jerárquica, aria-live de selección ni voz. Los controles nativos, Nivel y glosario fueron correcciones de F2, no ejecución completa de F3. |
| 4. Pedagogía del plan | Parcial: datos/API previstos | Hay prediction opcional y fallos declarativos ejecutables. No hay flujo de predicción/respuesta en UI ni slider de Hz ni interfaz de inyección pedagógica de fallos. |
| 5. Autoverificación completa | Parcial | 49 pruebas Node y comprobación de navegador a 390/320. Matriz completa a 736, auditoría formal de contraste/lectores y medición física móvil: NO VERIFICADO. |

### 3.1 Entorno y comandos realmente ejecutados

Node **v24.19.0**, npm **11.9.0**, Linux x64 de esta sesión. Ejecutar los mismos comandos con Node 22, Windows o macOS: **NO VERIFICADO**. Todos los siguientes comandos se ejecutaron en la copia aislada.


| Comando | Salida / exit | Advertencias y errores |
| --- | --- | --- |
| npm ci | 0; 8 paquetes instalados | Una advertencia de entorno: Unknown env config "http-proxy". No se leyó ni publicó el valor de ese proxy. |
| npm test | 0; 49 pruebas, 49 pass, 0 fail | Misma advertencia de entorno; sin pruebas omitidas ni canceladas. |
| npm run example | 0; 75 entidades, 26 geometrías, 8 materiales, 5 bindings; dispose true | Misma advertencia de entorno. Ejemplo CPU del PSC previo; no acredita WebGL. |
| npm run validate | 0; tres modelos de dominio válidos | Misma advertencia de entorno; los gráficos se validaron además con sus validadores en una sonda aparte. |
| npm run build | 0; 989.637 bytes | HTML, avisos y esquema gráfico regenerados idénticos byte a byte a la fuente. |
| npm audit --json | 1; una vulnerabilidad moderada | AJV, GHSA-2g4f-4pwh-qvx6; ninguna corrección aplicada. |
| npm run check:390 sin preparación | 1 | El entorno resuelve Playwright global pero falta su navegador predeterminado. |
| env -u NODE_PATH -u VGE_PLAYWRIGHT_MODULE -u VGE_CHROME_PATH npm run check:390 | 1 | Cannot find module playwright; dependencia no declarada en el proyecto. |
| npm run check:390 con rutas explícitas y QA fuera del proyecto | 0; 16 marcas de comprobación | Chromium 131.0.6778.204 + Playwright 1.62.1 del entorno; sin errores de consola ni peticiones externas en ese recorrido. |

#### npm ci — resultado real

```text
npm warn Unknown env config "http-proxy". This will stop working in the next major version of npm.

added 8 packages in 1s
```

#### npm test — resultado completo real

```text
npm warn Unknown env config "http-proxy". This will stop working in the next major version of npm.

> vge-v2-phase2@2.0.0-alpha.2 test
> node --test tests/*.test.mjs

✔ ambos dominios cumplen el mismo contrato (24.106452ms)
✔ rechaza errores de estructura y versiones antes de construir (8.514925ms)
✔ rechaza IDs repetidos, padres inexistentes y ciclos (7.041049ms)
✔ valida parámetros de las fábricas, referencias y canales duplicados (27.004247ms)
✔ no acepta funciones, NaN, claves peligrosas ni documentos circulares (2.789491ms)
✔ construye la jerarquía aunque los padres aparezcan después (26.937165ms)
✔ reutiliza recursos idénticos incluso con IDs distintos (12.657127ms)
✔ ninguna geometría/material se recrea durante 1.000 actualizaciones (45.381165ms)
✔ el despiece usa coordenadas locales absolutas y no acumula desplazamientos (15.368425ms)
✔ seleccionar emite evento sin mutar materiales compartidos (13.795341ms)
✔ cambiar velocidad conserva la fase y cambia su derivada (12.24116ms)
✔ corrientes normalizadas comparten reloj y respetan el desfase indicado (9.867371ms)
✔ parámetros inválidos no alteran el estado (14.937881ms)
✔ fallos reversibles conservan solicitudes y no contaminan materiales de otras piezas (10.490226ms)
✔ un fallo fuera del rango falla de forma atómica (10.207049ms)
✔ visible incluye subárbol y ancestros, sin activar hermanos (9.063753ms)
✔ los pasos restablecen transformaciones, datos, fase y visibilidad (8.532927ms)
✔ el mismo núcleo reproduce el ordenamiento y permite retroceder (2.745695ms)
✔ el resultado y el multiconjunto de la traza concuerdan con el orden ascendente (0.272031ms)
✔ la reserva .glb valida, pero se rechaza construir sin implementar el cargador (1.412081ms)
✔ pausado dibuja cambios una vez y queda sin RAF pendiente (8.56483ms)
✔ advance manual solicita un dibujo y admite intervalos finitos grandes sin NaN (7.460673ms)
✔ ocultar pestaña cancela RAF y reanuda sin salto temporal (12.316452ms)
✔ fuera de pantalla no dibuja, incluso con cambios pendientes (6.685634ms)
✔ una escena estática no mantiene RAF aunque se invoque play (1.020701ms)
✔ dispose libera cada recurso una sola vez y respeta la propiedad del renderer (16.514245ms)
✔ la resolución mobile tiene menos triángulos; datos y API se conservan (16.811028ms)
✔ las cuatro condiciones del contrato están presentes y son ejecutables (88.607666ms)
✔ el slider mueve un plano real en el espacio del ancla y nunca modifica vértices (23.893856ms)
✔ el clipping clona materiales sin recortar otras piezas que compartían material (26.014212ms)
✔ el contorno solo aparece en la entidad seleccionada y conserva la geometría (14.855836ms)
✔ la selección de un grupo cubre únicamente su subárbol (16.30217ms)
✔ respaldo emisivo aislado, reversible y compatible con fallos (12.496545ms)
✔ auto usa emisivo por equipo limitado, coste de grupo o intervalos lentos (29.594332ms)
✔ el campo es la suma de los datos de corrientes, sin oscilador independiente (17.727772ms)
✔ con corrientes en cuadratura de igual amplitud el módulo es constante (8.465865ms)
✔ con desfase 0 el campo pulsa sobre una línea y puede anularse (7.282735ms)
✔ la amplitud auxiliar nula elimina su contribución al campo (6.819545ms)
✔ 1.000 frames no reemplazan geometrías ni expanden cachés tras calentar estados (40.342933ms)
✔ el adaptador libera sus recursos y nunca dispone la geometría prestada (7.253651ms)
✔ referencias gráficas erróneas se rechazan con un mensaje identificable (0.534116ms)
✔ el modelo por capas conserva el contrato y sus referencias gráficas (18.354669ms)
✔ buscar un instante sincroniza las dos señales con el campo, sin reconstruir el modelo (48.460893ms)
✔ el cursor rechaza valores inválidos sin modificar el instante (15.887089ms)
✔ el brillo cambia de A a B al mover el mismo cursor y mantiene los colores de identidad (15.121978ms)
✔ el campo gira en el sentido del giro ilustrativo y la estela usa muestras anteriores de esas señales (15.32511ms)
✔ el verde queda reservado al campo, con metal gris y cajita neutra (0.277008ms)
✔ 1.000 actualizaciones con brillo y estela conservan geometrías y cachés (76.840396ms)
✔ el adaptador libera la estela y los materiales de brillo una sola vez (16.519148ms)
ℹ tests 49
ℹ suites 0
ℹ pass 49
ℹ fail 0
ℹ cancelled 0
ℹ skipped 0
ℹ todo 0
ℹ duration_ms 699.038097
```

#### npm run example — resultado completo real

```text
npm warn Unknown env config "http-proxy". This will stop working in the next major version of npm.

> vge-v2-phase2@2.0.0-alpha.2 example
> node examples/headless.mjs

Recursos: { entities: 75, geometries: 26, materials: 8, bindings: 5 }
Estado: {
  step: 0,
  selected: 'rotor',
  exploded: 0.5,
  fault: null,
  playing: false,
  parameters: {
    frequencyHz: 60,
    slowMotion: 0.025,
    phaseDeg: 60,
    auxAmplitude: 0.8,
    visualSpeedRpm: 24,
    rotorFreedom: 1,
    capacitanceUF: 2
  },
  requestedParameters: { visualSpeedRpm: 24 },
  disposed: false
}
Con bloqueo: {
  frequencyHz: 60,
  slowMotion: 0.025,
  phaseDeg: 60,
  auxAmplitude: 0.8,
  visualSpeedRpm: 24,
  rotorFreedom: 0,
  capacitanceUF: 2
}
Liberado: true
```

#### npm run validate

```text
npm warn Unknown env config "http-proxy". This will stop working in the next major version of npm.

> vge-v2-phase2@2.0.0-alpha.2 validate
> node tools/validate-examples.mjs

psc: válido · 75 entidades · 10 pasos
psc.beginner: válido · 75 entidades · 10 pasos
bubble-sort: válido · 4 entidades · 7 pasos
```

#### npm run build

```text
npm warn Unknown env config "http-proxy". This will stop working in the next major version of npm.

> vge-v2-phase2@2.0.0-alpha.2 build
> node tools/build.mjs

Demo autónoma: 989637 bytes · Three.js y datos incluidos
```

### 3.2 Resultado de la comprobación preparada en navegador

```text
npm warn Unknown env config "http-proxy". This will stop working in the next major version of npm.

> vge-v2-phase2@2.0.0-alpha.2 check:390
> node tools/check-390.cjs

✓ Inicio en capa 1, pregunta y analogía antes de crear WebGL
✓ Cuatro pasos, máximo dos frases por paso y lenguaje común sin jerga visible
✓ Nivel técnico conserva la explicación común y añade nombres, ondas y escala explicada
✓ El mismo cursor actualiza ondas, texto, brillo de A/B y vector del campo en cuatro instantes conocidos
✓ Nivel avanzado añade fórmulas, convención de signos y límites, sin ocultar la capa común
✓ Nivel controla la capa por defecto de cada escena y las capas se pueden abrir con un toque
✓ Siete piezas tienen nombre común, función y conexión gráfica; dos etiquetas como máximo
✓ Resaltado normal exclusivo y respaldo ligero sin aclarar otras piezas
✓ Corte real y separación/rearmado sin perder piezas ni explicación
✓ Los turnos juntos muestran un campo pulsante y detienen el giro ilustrativo
✓ Glosario tocable con analogías y controles de al menos 44 px
✓ Movimiento observado; pausa congela dibujo, campo y reloj sin seguir dibujando
✓ Al ocultar la escena no se sigue dibujando
✓ Comprobación adicional a 320 px sin desbordamiento ni objetivos táctiles pequeños
✓ JSON inválido muestra un mensaje visible
✓ Consola limpia y HTML sin peticiones externas
```

La frase “máximo dos frases” forma parte del texto de salida del checker, pero su código no cuenta oraciones: comprueba cuatro pasos, presencia de texto y ausencia de una lista de jerga. La lectura de las cuatro cadenas actuales sí muestra dos frases por paso; la automatización de ese límite no está implementada. Del mismo modo, comprobar dos nodos de etiqueta no acredita por sí solo ausencia de oclusión en toda orientación.


## 4. COHERENCIA

### 4.1 Skill y código: coincidencias y diferencias


| Criterio | Evidencia y conclusión |
| --- | --- |
| Tres capas obligatorias para todos | La skill solo ofrece nivel ajustable como opción y mantiene nivel universitario por defecto. No prescribe la regla común/técnico/avanzado ni los botones actuales. Diferencia verificada leyendo SKILL.md; H02. |
| Regla de capas en el esquema | vge.schema.json exige steps.text, pero no technical/advanced ni lesson. El proyecto solo las implementa en un JSON externo sin esquema y una UI específica; no es garantía del contrato. |
| Entrada narrativa | La skill recomienda ver funcionar primero en ANATOMÍA; la demo abre con pregunta y analogía y crea WebGL en el paso 4. Es una adaptación explícitamente solicitada por el usuario, no un fallo a corregir automáticamente. |
| Pausa, despiece y correspondencias | Funcionan en el PSC inicial: etiquetas dentro de escena, planos, separación, reloj común, stop fuera de la escena y reduced motion. Hay ruptura al mezclar el PSC previo con el perfil actual, H01. |
| Modos y motores | La skill describe DATOS, MAPA, Manim, Remotion, Spline y CircuitJS; no son motores implementados en este repositorio. El esquema admite sus etiquetas, pero el renderer incluido sigue siendo Three.js paramétrico. |
| Pausa al explorar | La selección y el cursor de la UI PSC pausan; cortar o separar no llama a pause. La pauta de explorar manualmente en la referencia de recorridos no se aplica uniformemente; decisión pendiente, no cambio hecho. |
| Fallback accesible sin WebGL | La skill pide alternativa estática o explicación accesible. En la sonda con getContext WebGL bloqueado aparece el error y desaparece la historia común. H08. |
| Niveles, alcance y comprobación | La demo inicial mantiene la capa común y etiquetas de rigor, y declara límites. La comprensión por participantes reales, la seguridad eléctrica del modelo y el rendimiento en un móvil: NO VERIFICADO. |

### 4.2 ¿Todos los JSON validan?

**No se puede afirmar que todos validen contra un mismo esquema.** Los 11 archivos `.json` del paquete se pudieron parsear. Tres son documentos VGE, dos son configuraciones gráficas y los demás tienen otro propósito.


| JSON | Comprobación ejecutada | Resultado |
| --- | --- | --- |
| examples/psc.json | Schema VGE + semántica + fábricas | Válido; 75 entidades, 10 pasos, ILUSTRACIÓN. |
| examples/psc.beginner.json | Schema VGE + semántica + fábricas | Válido; 75 entidades, 10 pasos, ILUSTRACIÓN. |
| examples/bubble-sort.json | Schema VGE + semántica + fábricas | Válido; 4 entidades, 7 pasos, SIMULACIÓN. |
| examples/psc.graphics.json | validateGraphics con psc.json | Válido. |
| examples/psc.beginner.graphics.json | validateGraphics con psc.beginner.json | Válido. |
| examples/psc.lesson.json | Parse JSON y lectura de cuatro pasos, con tres textos cada uno | Sintaxis válida. No existe esquema de lesson; no valida como documento VGE, lo cual no lo convierte en modelo inválido de ese tipo: es un contrato aparte sin formalizar. |
| schema/vge.schema.json | AJV validateSchema 2020-12 | Metaesquema válido; comprobaciones de referencias y ciclos necesitan además validateDocument. |
| schema/vge.graphics.schema.json | AJV validateSchema y comparación con exportación de build | Metaesquema válido e idéntico a lo regenerado. |
| package.json y package-lock.json | Parse y npm ci / npm ls | Aceptados por npm. No les corresponde el esquema VGE. |
| qa/comprobacion-390.json | Parse y lectura de metadata | Registro histórico sin esquema formal propio; no es un modelo VGE. |

`npm run validate` recorre únicamente los tres modelos de dominio. `graphicsSchema` vive en JavaScript y se exporta; el validador gráfico de runtime no lee el JSON exportado. Esa duplicación es intencional y ahora coincide, pero debe controlarse en CI.


### 4.3 CONTRATO.md frente al esquema y comportamiento

No hay un archivo llamado literalmente `CONTRATO.md` en la entrega actual; el texto está en `docs/FASE-1-CONTRATO.md`, marcado como histórico. Sus bloques, poses locales absolutas, relaciones LINEAR/PHASE/SINE, predicción, un solo fallo reversible y label de rigor coinciden con el contrato base leído y sus pruebas. Es anterior a los efectos gráficos y las capas, por lo que no sirve como contrato completo de VGE actual.

El esquema estructural no prueba unicidad de IDs, ciclos ni referencias entre colecciones: esas garantías están en `src/validate.mjs`, como aclara el `$comment` del esquema. Validar solo con un JSON Schema externo deja sin esas garantías.

La regla de escalas positivas declarada en el contrato tiene un contraejemplo ejecutado: una pose base de escala 1 con binding aditivo de −0,5 pasa la comprobación, pero un override de paso de 0,1 produce **−0,4**. También se reprodujo un cociente no finito en la extensión `seekCycle`. Son defectos reales, no hipótesis de rendimiento.


### 4.4 Capas y etiquetas por escena


| Visual / escena | Capas | Etiqueta ILUSTRACIÓN/SIMULACIÓN |
| --- | --- | --- |
| Cuatro pasos de la lección PSC inicial | Común/técnico/avanzado presentes; Nivel y botones probados. La fórmula y algunas explicaciones se añaden desde HTML fijo. | ILUSTRACIÓN visible en los cuatro pasos comprobados. Badge por modelo, no campo individual en cada step. |
| Siete selecciones de pieza del PSC | Nombre común; nombre técnico al abrir capa; detalle avanzado global de la historia. No hay un texto avanzado individual para cada pieza. | Se conserva el badge del modelo; puede quedar fuera del viewport al desplazarse, no es un rótulo fijo sobre el canvas. |
| Diez steps JSON del motor | Son instantáneas del núcleo; la historia de cuatro pasos no los recorre. Cambiar por API no sincroniza completamente controles, H07. | model.kind existe para el documento; no se verificaron visualmente los diez steps con todas sus capas: NO VERIFICADO. |
| Siete pasos de bubble-sort cargados en la web | No hay selector Nivel ni paneles de tres capas; reaparece texto Emisivo. La etiqueta de pieza queda fuera del área visible. | SIMULACIÓN comprobada al activar los siete pasos. |
| PSC previo cargado desde el botón/dispatcher | Se le impone el perfil de la variante inicial, aunque sus señales tienen otra convención. H01. | ILUSTRACIÓN heredada del documento, lo cual no corrige la incompatibilidad. |

### 4.5 Sondas reproducidas fuera de las pruebas existentes


| ID | Entrada / acción | Resultado real | Evidencia de archivo |
| --- | --- | --- | --- |
| H01 | Cargar examples/psc.json mediante VGEDemo.mount; entrar al paso 4; fase 90, amplitud B 1; advance(0.02). | Ángulo del campo −0,1884955592 rad y giro de la pieza +0,0376991118 rad. La UI sigue mostrando fórmulas cos de la otra variante. Al cargar sus valores iniciales, slider 90 frente a parámetro 60. | demo/main.mjs:10; mountBeginnerVGE.mjs:43 y :49; dos JSON con metadata.id fan-psc. |
| H03 | En memoria: pose base 1; override de paso scale.x=0,1; binding LINEAR aditivo de −0,5, fuente en rango [0,1]. | validateDocument acepta el documento; getObject(rotor_core).scale.x termina en −0,4. | src/validate.mjs, validación de scale; src/VGEEngine.mjs:265, composición de overrides y bindings. |
| H04 | En memoria: escala de velocidad de mainCurrent=1e-320; seekCycle(mainCurrent,0.5). | Documento aceptado; velocidad 3e-321. La fase auxiliar y la rotación dejan de ser finitas. | src/VGEEngine.mjs:253 y :261. |
| H05 | Cargar bubble-sort, elegir e3 por el selector nativo. | annotation.hidden=false, position=static, top=642,59 frente al final del stage=489,59; overflow=hidden la recorta. | src/ui/mountVGE.mjs, clase annotation; demo/index.html carece del estilo anterior de esa clase. |
| H07 | En la variante inicial, ejecutar engine.setStep(6). | Estado: step=6 y exploded=1; slider de separación sigue en 0 y story sigue en 3. | src/ui/mountBeginnerVGE.mjs:106 y :169; no hay sincronización de todos los controles con stepchange. |
| H08 | Bloquear getContext de WebGL en una página nueva y abrir la prueba 3D. | Panel de error visible; historia común no preservada. | src/ui/mountBeginnerVGE.mjs:172; src/ui/status.mjs reemplaza el contenido del host. |

En H03/H04 se alteraron solo clones en memoria. No se guardaron esos modelos en el proyecto. El alcance del daño de los valores no finitos en todos los drivers de GPU: **NO VERIFICADO**; el valor numérico inválido sí está reproducido.

Otra incoherencia de texto: el HTML avanzado afirma «Las piezas grises son metal», pero el modelo asigna el recurso `plastic`, también gris, a aspas y cajita. El color gris se está usando como neutro y no acredita composición física. Se recomienda corregir la frase, no inferir material real de este dibujo.


## 5. DEPENDENCIAS Y RIESGOS

### 5.1 Versiones, procedencia y licencias


| Paquete instalado | Versión comprobada | Licencia leída | Carga / distribución |
| --- | --- | --- | --- |
| three | 0.180.0 | MIT | Incluido en bundle y avisos |
| ajv | 8.17.1 | MIT | Incluido en bundle y avisos |
| fast-uri | 3.1.9 | BSD-3-Clause | Incluido en bundle y avisos |
| fast-deep-equal | 3.1.3 | MIT | Incluido en bundle y avisos |
| json-schema-traverse | 1.0.0 | MIT | Incluido en bundle y avisos |
| require-from-string | 2.0.2 | MIT | Instalado para herramientas/funciones auxiliares; no incluido en el bundle de la demo |
| esbuild | 0.25.12 | MIT | Instalado para herramientas/funciones auxiliares; no incluido en el bundle de la demo |
| @esbuild/linux-x64 | 0.25.12 | MIT | Instalado para herramientas/funciones auxiliares; no incluido en el bundle de la demo |


El lock incluye **26 binarios opcionales de esbuild**, todos 0.25.12 y marcados MIT; aquí solo se instaló linux-x64. Los otros 25 no se ejecutaron: **NO VERIFICADO** en esas plataformas. Nombres leídos: `aix-ppc64`, `android-arm`, `android-arm64`, `android-x64`, `darwin-arm64`, `darwin-x64`, `freebsd-arm64`, `freebsd-x64`, `linux-arm`, `linux-arm64`, `linux-ia32`, `linux-loong64`, `linux-mips64el`, `linux-ppc64`, `linux-riscv64`, `linux-s390x`, `linux-x64`, `netbsd-arm64`, `netbsd-x64`, `openbsd-arm64`, `openbsd-x64`, `openharmony-arm64`, `sunos-x64`, `win32-arm64`, `win32-ia32`, `win32-x64`.


Playwright **1.62.1** y Chromium **131.0.6778.204** se usaron como herramientas del entorno, no como dependencias de este lock. El proyecto documenta instalación manual sin guardarla. `NODE_PATH` apunta a `/opt/codex/runtimes/codex-primary-runtime/dependencies/node/node_modules`; el navegador usado está fuera del proyecto. Sin NODE_PATH, el checker falla con MODULE_NOT_FOUND; con Playwright global pero sin navegador preparado falla en launch. Se verificaron ambos fallos.

No hay CDN, fuentes remotas ni assets descargados por la demo compilada en el recorrido probado. npm sí descarga dependencias al instalar; el navegador final no necesita npm para abrir dist/index.html. Los cinco paquetes detectados por el metafile de esbuild están cubiertos por avisos en el HTML y THIRD-PARTY-LICENSES.txt. require-from-string tiene un archivo `license` en minúsculas que el bucle de build no recoge, pero el metafile confirma que no entra en este bundle; no se afirma por ello una omisión de aviso del código efectivamente distribuido.

No existe LICENSE raíz ni campo license en package.json; tampoco se encontró licencia separada en los siete archivos de la skill. Que los paquetes sean MIT/BSD no licencia automáticamente los archivos propios del proyecto. Titularidad y autorización para conceder una licencia de esos archivos: **NO VERIFICADO**.


### 5.2 npm audit — resultado real

```text
npm warn Unknown env config "http-proxy". This will stop working in the next major version of npm.
{
  "auditReportVersion": 2,
  "vulnerabilities": {
    "ajv": {
      "name": "ajv",
      "severity": "moderate",
      "isDirect": true,
      "via": [
        {
          "source": 1113715,
          "name": "ajv",
          "dependency": "ajv",
          "title": "ajv has ReDoS when using `$data` option",
          "url": "https://github.com/advisories/GHSA-2g4f-4pwh-qvx6",
          "severity": "moderate",
          "cwe": [
            "CWE-400",
            "CWE-1333"
          ],
          "cvss": {
            "score": 0,
            "vectorString": null
          },
          "range": ">=7.0.0-alpha.0 <8.18.0"
        }
      ],
      "effects": [],
      "range": "7.0.0-alpha.0 - 8.17.1",
      "nodes": [
        "node_modules/ajv"
      ],
      "fixAvailable": {
        "name": "ajv",
        "version": "8.20.0",
        "isSemVerMajor": false
      }
    }
  },
  "metadata": {
    "vulnerabilities": {
      "info": 0,
      "low": 0,
      "moderate": 1,
      "high": 0,
      "critical": 0,
      "total": 1
    },
    "dependencies": {
      "prod": 7,
      "dev": 27,
      "optional": 26,
      "peer": 0,
      "peerOptional": 0,
      "total": 33
    }
  }
}
```

El registro y el [aviso primario GHSA-2g4f-4pwh-qvx6](https://github.com/advisories/GHSA-2g4f-4pwh-qvx6) identifican **CVE-2025-69873**, ReDoS con `$data` activado. El aviso marca parche desde 8.18.0; npm ofrece 8.20.0 en esta ejecución. Los constructores AJV leídos no activan `$data`. **Explotabilidad en esta aplicación: NO VERIFICADO**; no se hizo un ataque ni se declara inmune. Recomendación: actualizar a una versión parcheada, regenerar lock/bundle y repetir pruebas en una tarea de corrección separada. Nada de eso se aplicó aquí.


### 5.3 Portabilidad, datos privados y publicación


| Comprobación | Resultado / límite |
| --- | --- |
| Rutas absolutas en el contenido fuente y skill | El escaneo de texto no encontró rutas /workspace, /root/.codex u /opt/codex codificadas en los archivos entregados. Las rutas de esta auditoría son diagnósticos, no requisitos de la aplicación. |
| Imports y archivos | Imports relativos y new URL respecto al módulo; npm run build reconstruye exactamente. La copia del núcleo en engine/ se importó y construyó 75 entidades sin cambiar una línea. |
| Entorno del checker | Playwright/navegador no vienen con npm ci; variables VGE_PLAYWRIGHT_MODULE y VGE_CHROME_PATH permiten configurarlos. H06, comprobado. |
| Servidor local | serve.mjs usa 127.0.0.1 y solo / o /index.html; no es un servidor LAN ni un host de subrutas. La página compilada sí funciona bajo /vge/ en la sonda HTTP local. |
| Credenciales en texto | Cero coincidencias en patrones de claves GitHub/OpenAI/AWS y bloques de claves privadas en los 58 archivos de texto/metadata escaneables. No había .env ni .npmrc dentro del paquete. |
| Límites del escaneo | Claves en formatos no cubiertos, texto secreto oculto en píxeles/metadatos binarios, historial Git del motor y archivos fuera de estos 58: NO VERIFICADO. No se publican valores de proxy ni helpers autenticados. |
| Licencias de código propio | Faltan licencia explícita y datos de titularidad acreditados; propuesta en sección 8, sin aplicarla. |
| GitHub / Pages | No se accedió para crear un repo ni publicar. Cuenta, permisos, plan, despliegue y URL real: NO VERIFICADO. |

## 6. RENDIMIENTO Y ACCESIBILIDAD

### 6.1 Qué se midió y observó


| Comprobación | Evidencia | Qué NO demuestra |
| --- | --- | --- |
| Reuso de recursos | Pruebas Node de 1.000 actualizaciones conservan identidad de geometrías y cachés calentadas. Campo/estela actualizan buffers existentes. | No son 1.000 frames presentados por una GPU móvil ni una prueba prolongada de fugas. |
| Snapshot WebGL | Chromium 131, SwiftShader, 390×844, DPR 1, variante inicial pausada en fracción 0,1: 26 geometrías/8 materiales del núcleo, 30 geometrías en renderer.info, 66 draw calls y 16.292 triángulos enviados en ese dibujo. | No es número de triángulos visibles tras clipping ni benchmark de FPS/consumo en un teléfono. |
| Presupuesto configurado | maxFps=30 y DPR máximo 1,5 leídos en montaje/núcleo; auto ligero es heurístico. | 30 FPS sostenidos y calidad óptima en hardware móvil: NO VERIFICADO. |
| Navegador real, automatizado | Checker ejecutado con Chromium headless y WebGL real por software, no solo mock DOM. 390 px principal y 320 px adicional. | No equivale a Chrome Android, Safari iOS, GPU física o matriz completa 320/390/736. |
| Tamaño táctil y desbordamiento | Rectángulos CSS de controles habilitados visibles ≥44×44; para checkbox se mide label completa. Sin desbordamiento en los estados del checker. | No acredita precisión motora con dedos reales ni accesibilidad integral. |
| Pausa y ocultación de escena | El checker comprueba campo/contador de render estables al pausar y volver a la analogía. Tests de núcleo simulan visibilidad de pestaña e intersección. | Cambio real entre apps, ahorro de batería y todos los estados de background en móvil: NO VERIFICADO. |
| Movimiento reducido | Página nueva con prefers-reduced-motion:reduce: al abrir 3D isPlaying=false. | La experiencia de todos los dispositivos con esa preferencia: NO VERIFICADO. |
| Errores y red | Recorrido por defecto: 0 errores de consola y 0 peticiones HTTP externas. Sondas de variantes válidas también sin errores JS. | La ausencia de consola roja no garantiza coherencia: H01/H05/H07 no generan excepciones. |
| Rigor visible | Badges de los cuatro pasos PSC y siete pasos de ordenamiento observados. Valores relativos y límites están escritos. | Validación física del motor, cálculo de impedancias, par, temperatura o velocidad: NO VERIFICADO. |

### 6.2 Accesibilidad pendiente o limitada

Controles nativos con labels, foco visible, botones de glosario y aria-expanded están presentes por lectura y fueron operados por Playwright. El canvas tiene `tabIndex=-1`, no se registra listenToKeyEvents y no se encontró navegación jerárquica de piezas con teclado ni aria-live de selección. El selector nativo permite escoger piezas, pero no sustituye la navegación y rotación accesibles completas planificadas.

Contraste medido conforme WCAG, zoom de texto 200/400%, lector NVDA/TalkBack/VoiceOver, uso solo con teclado de todos los flujos, orden de foco tras cada cambio y auditoría axe: **NO VERIFICADO**. Hay textos de 9–12 px en CSS, por lo que medir legibilidad real es una tarea pendiente; no se declara fallo de contraste sin medirlo. El visor genérico sí tiene una oclusión de etiqueta reproducida. Sin WebGL, el fallback de error elimina la explicación, H08.

La prueba de comprensión del informe previo es una autoevaluación narrativa; un ensayo con principiantes/expertos externos y su tasa de comprensión: **NO VERIFICADO**.


## 7. DEUDA TÉCNICA

Prioridad de trabajo, distinta de la severidad del advisory de seguridad. Ninguna corrección está aplicada.


| Prioridad | ID | Problema verificado | Acción propuesta y prueba de cierre |
| --- | --- | --- | --- |
| Alta | H01 | Dispatcher mezcla modelos con igual ID y perfiles incompatibles; sentido del campo/fórmula/slider incoherentes al cargar PSC previo. | Enlazar perfil explícito, validar compatibilidad y probar ambos PSC cargados por la interfaz, no solo cada motor aislado. |
| Alta | SEC01 | AJV 8.17.1 aparece en npm audit con vulnerabilidad moderada. | Actualizar versión parcheada y lock/bundle; repetir 49 pruebas y audit. Explotación actual NO VERIFICADO. |
| Alta | H02 | La regla obligatoria de tres capas no vive en la skill ni en un contrato formal; fallback sin capas. | Versionar la regla en skill/contratos y añadir schema de lesson y comprobación por modo. No modificar skill durante esta auditoría. |
| Media | H03 | Binding aditivo con override positivo produce escala negativa pese a validar. | Evaluar mínimos respecto a overrides efectivos o validar resultado antes de aplicarlo; añadir contraejemplo −0,4 a regresiones. |
| Media | H04 | seekCycle genera NaN con referencia finita subnormal aceptada. | Resolver fases finitas antes de mutar, acotar referencias o usar una búsqueda estable; añadir caso 1e-320. |
| Media | H05 | CSS y rótulos del visor genérico no sobreviven a la plantilla actual; ordenamiento sin capas. | Separar estilos por visor o unificar componentes; prueba visual y por DOM del algoritmo con selección e3. |
| Media | H06 | Playwright y binario de navegador dependen de instalación manual/NODE_PATH; check no es reproducible tras solo npm ci. | Fijar herramienta en devDependencies/lock y preparar navegador en CI; ejecutar sin rutas del host. |
| Media | H07 | Historia de cuatro pasos y diez steps del modelo tienen estados separados; algunos controles quedan obsoletos al usar la API. | Un único estado/director o adaptador explícito; probar setStep, setParam y controles en ambas direcciones. |
| Media | H08 | Fallo de WebGL reemplaza y elimina la capa común. | Conservar analogía/explicación y ofrecer vista estática; repetir sonda con contexto bloqueado. |
| Media | DOC01 | Texto gris=metal contradice uso del recurso plastic; analogía/colores/fórmulas duplicados en código y JSON. | Corregir semántica del texto en una tarea de código; centralizar perfil y validar sus correspondencias. |
| Media | LEGAL01 | No hay licencia propia ni .gitignore; publicación/licenciamiento del conjunto no resueltos. | Elegir titular/licencia y aprobar metadata; aplicar borradores de la sección 8 antes de promover uso público. |
| Baja | DUP01 | 26 definiciones geométricas duplicadas y 10 PNG duplicados en HTML histórico. | Generar variantes desde base y archivar evidencias sin duplicarlas; comprobar igualdad reproducible de entradas. |
| Baja | DOC02 | Contrato F1 histórico con aprobación antigua; esquema gráfico JS más exportación; seis scripts frente a validación parcial de tipos JSON. | Un contrato vigente que distinga modelo/gráficos/lección y una comprobación global de exportaciones. |
| Baja | RES01 | AssetLoader es solo interfaz y parte de los pasos/duración son datos reservados. | Mantener explícito el alcance; no presentarlo como carga .glb o recorrido automático implementado. |

La ausencia de WebXR, DOF, partículas y carga .glb real es alcance deliberado, no un defecto que esta auditoría deba implementar. La Fase 3 sigue requiriendo la aprobación indicada por el usuario.


## 8. PREPARACIÓN PARA GITHUB

### 8.1 Estructura del ZIP y restricción de copiar sin editar

Mover src/ a engine/ y borrar src/ rompería imports existentes de demo, tests, factories y package.exports. Para cumplir “solo copiando archivos, sin cambios de código”, el ZIP conserva la raíz ejecutable actual y añade una copia idéntica del núcleo en engine/. **src/ sigue siendo la ruta de runtime actual; engine/ es una copia transitoria de organización, no una segunda implementación distinta.** La unificación posterior requiere cambiar referencias y no se hizo. No se usan symlinks.

El ZIP contiene los 51 originales sin cambios, los 7 archivos de skill, 12 copias del núcleo bajo engine/, una copia de dist/index.html en docs/index.html y este informe: **72 archivos**, sin node_modules, helpers, logs privados ni nuevas capturas de navegador de la auditoría. Los PNG y REVISION que sí están incluidos son los que ya pertenecían al proyecto solicitado.



```text
VGE-GitHub/
|-- AUDITORIA.md           # nuevo informe solicitado
|-- skill/                # SKILL.md, agents/, assets/, references/ (copias)
|-- engine/               # copia exacta de src/, propuesta transitoria
|-- src/                  # compatibilidad: rutas de runtime existentes
|-- schema/               # esquemas originales
|-- examples/             # seis JSON y dos módulos originales
|-- docs/                 # documentos originales + index.html copiado de dist
|-- tests/                # tres suites originales
|-- demo/                 # plantilla y bootstrap originales
|-- tools/                # scripts originales
|-- dist/                 # HTML autónomo y avisos originales
|-- qa/                   # evidencia histórica original
|-- package.json          # original, no se aplican scripts nuevos
|-- package-lock.json     # original, no se actualizan versiones
`-- README.md             # original; borrador nuevo solo en este informe
```

**No se crearon .gitignore, LICENSE ni ROADMAP como archivos del proyecto:** sus borradores están aquí, para no alterar la entrega mediante cambios de metadata o concesiones de licencia. El ZIP está preparado para importar los archivos y abrir la demo, no se certifica como una versión corregida ni como una publicación segura sin revisar la deuda.

La copia importó `engine/VGEEngine.mjs`, construyó 75 entidades y liberó recursos. La fuente original y cada copia se compararon por SHA-256. Este es un empaquetado conservador; el objetivo limpio posterior eliminaría src/ después de migrar imports/exports hacia engine/.

### 8.2 Mapa exhaustivo de archivos actuales a copia propuesta


| Archivo actual | Ruta(s) en VGE-GitHub/ | Operación |
| --- | --- | --- |
| README.md | README.md | Copia byte a byte |
| demo/index.html | demo/index.html | Copia byte a byte |
| demo/main.mjs | demo/main.mjs | Copia byte a byte |
| dist/THIRD-PARTY-LICENSES.txt | dist/THIRD-PARTY-LICENSES.txt | Copia byte a byte |
| dist/index.html | dist/index.html; docs/index.html | Copia byte a byte |
| docs/FASE-1-CONTRATO.md | docs/FASE-1-CONTRATO.md | Copia byte a byte |
| docs/FASE-1-VERIFICACION.md | docs/FASE-1-VERIFICACION.md | Copia byte a byte |
| docs/FASE-2.md | docs/FASE-2.md | Copia byte a byte |
| docs/REVISION.html | docs/REVISION.html | Copia byte a byte |
| examples/bubble-sort.json | examples/bubble-sort.json | Copia byte a byte |
| examples/headless.mjs | examples/headless.mjs | Copia byte a byte |
| examples/psc-factories.mjs | examples/psc-factories.mjs | Copia byte a byte |
| examples/psc.beginner.graphics.json | examples/psc.beginner.graphics.json | Copia byte a byte |
| examples/psc.beginner.json | examples/psc.beginner.json | Copia byte a byte |
| examples/psc.graphics.json | examples/psc.graphics.json | Copia byte a byte |
| examples/psc.json | examples/psc.json | Copia byte a byte |
| examples/psc.lesson.json | examples/psc.lesson.json | Copia byte a byte |
| package-lock.json | package-lock.json | Copia byte a byte |
| package.json | package.json | Copia byte a byte |
| qa/antes-390.png | qa/antes-390.png | Copia byte a byte |
| qa/comprobacion-390.json | qa/comprobacion-390.json | Copia byte a byte |
| qa/despues-avanzado-390.png | qa/despues-avanzado-390.png | Copia byte a byte |
| qa/despues-comun-390.png | qa/despues-comun-390.png | Copia byte a byte |
| qa/despues-inicio-390.png | qa/despues-inicio-390.png | Copia byte a byte |
| qa/despues-relevo-390.png | qa/despues-relevo-390.png | Copia byte a byte |
| qa/despues-tecnico-390.png | qa/despues-tecnico-390.png | Copia byte a byte |
| qa/intermedio-390.png | qa/intermedio-390.png | Copia byte a byte |
| qa/pieza-aux_winding-390.png | qa/pieza-aux_winding-390.png | Copia byte a byte |
| qa/pieza-capacitor-390.png | qa/pieza-capacitor-390.png | Copia byte a byte |
| qa/pieza-main_winding-390.png | qa/pieza-main_winding-390.png | Copia byte a byte |
| schema/vge.graphics.schema.json | schema/vge.graphics.schema.json | Copia byte a byte |
| schema/vge.schema.json | schema/vge.schema.json | Copia byte a byte |
| src/AssetLoader.mjs | src/AssetLoader.mjs; engine/AssetLoader.mjs | Copia byte a byte |
| src/VGEEngine.mjs | src/VGEEngine.mjs; engine/VGEEngine.mjs | Copia byte a byte |
| src/factories.mjs | src/factories.mjs; engine/factories.mjs | Copia byte a byte |
| src/graphics/CoilPulse.mjs | src/graphics/CoilPulse.mjs; engine/graphics/CoilPulse.mjs | Copia byte a byte |
| src/graphics/FieldVectors.mjs | src/graphics/FieldVectors.mjs; engine/graphics/FieldVectors.mjs | Copia byte a byte |
| src/graphics/VGEGraphics.mjs | src/graphics/VGEGraphics.mjs; engine/graphics/VGEGraphics.mjs | Copia byte a byte |
| src/graphics/validateGraphics.mjs | src/graphics/validateGraphics.mjs; engine/graphics/validateGraphics.mjs | Copia byte a byte |
| src/ui/SignalDiagram.mjs | src/ui/SignalDiagram.mjs; engine/ui/SignalDiagram.mjs | Copia byte a byte |
| src/ui/mountBeginnerVGE.mjs | src/ui/mountBeginnerVGE.mjs; engine/ui/mountBeginnerVGE.mjs | Copia byte a byte |
| src/ui/mountVGE.mjs | src/ui/mountVGE.mjs; engine/ui/mountVGE.mjs | Copia byte a byte |
| src/ui/status.mjs | src/ui/status.mjs; engine/ui/status.mjs | Copia byte a byte |
| src/validate.mjs | src/validate.mjs; engine/validate.mjs | Copia byte a byte |
| tests/engine.test.mjs | tests/engine.test.mjs | Copia byte a byte |
| tests/graphics.test.mjs | tests/graphics.test.mjs | Copia byte a byte |
| tests/lesson.test.mjs | tests/lesson.test.mjs | Copia byte a byte |
| tools/build.mjs | tools/build.mjs | Copia byte a byte |
| tools/check-390.cjs | tools/check-390.cjs | Copia byte a byte |
| tools/serve.mjs | tools/serve.mjs | Copia byte a byte |
| tools/validate-examples.mjs | tools/validate-examples.mjs | Copia byte a byte |
| skill instalada/SKILL.md | skill/SKILL.md | Copia byte a byte |
| skill instalada/agents/openai.yaml | skill/agents/openai.yaml | Copia byte a byte |
| skill instalada/assets/icon.svg | skill/assets/icon.svg | Copia byte a byte |
| skill instalada/references/calidad-grafica-y-eficiencia.md | skill/references/calidad-grafica-y-eficiencia.md | Copia byte a byte |
| skill instalada/references/formatos-y-motores.md | skill/references/formatos-y-motores.md | Copia byte a byte |
| skill instalada/references/funcionamiento-y-recorridos.md | skill/references/funcionamiento-y-recorridos.md | Copia byte a byte |
| skill instalada/references/rigor-por-materia.md | skill/references/rigor-por-materia.md | Copia byte a byte |
| Nuevo entregable solicitado | AUDITORIA.md | Único archivo nuevo de análisis |

### 8.3 .gitignore — borrador no aplicado

```gitignore
node_modules/
coverage/
playwright-report/
test-results/
qa-generated/
*.log
*.zip
.env
.env.*
!.env.example
.DS_Store
Thumbs.db
```

No se ignoran dist/ ni docs/index.html porque esta propuesta los conserva para abrir/publicar la demo ya generada. Las evidencias históricas se dejan explícitas; las nuevas ejecuciones deberían dirigir VGE_QA_DIR a una salida ignorada. El borrador no fue ensayado como política Git en un repositorio creado aquí: **NO VERIFICADO**.


### 8.4 package.json — scripts propuestos, no aplicados

```json
{
  "scripts": {
    "dev": "node tools/serve.mjs",
    "build": "node tools/build.mjs",
    "validate": "node tools/validate-examples.mjs",
    "example": "node examples/headless.mjs",
    "test": "node --test tests/*.test.mjs",
    "check": "npm run validate && npm test",
    "check:390": "node tools/check-390.cjs",
    "audit": "npm audit"
  }
}
```

Los scripts test, validate, example, build y check:390 se ejecutaron con el alcance de la sección 3. El script dev se inspeccionó por lectura; su arranque no se ejecutó: **NO VERIFICADO**. check y audit son borradores y **NO VERIFICADO** como scripts instalados. Antes de CI hay que declarar/pinear Playwright y su navegador, y ampliar validate a gráficos/lección. La actualización sugerida de AJV a 8.20.0 es **NO VERIFICADO** con el código: no se instaló ni se cambió el lock. Mantener engines >=22 no sustituye probar Node 22.

### 8.5 Licencia sugerida

Sugerencia: **MIT** para el código y la skill si su titular puede concederla, conservando los avisos MIT/BSD de dependencias. El nombre del titular y la autorización: **NO VERIFICADO**. No se añade un texto LICENSE con un titular inventado. Los PNG e informes deberían quedar bajo una política de documentación explícita al publicarlos; por ahora no se les asigna una licencia nueva.

### 8.6 README — borrador, no aplicado



````markdown
# VGE · VisualGraficEyes

Método visual y motor paramétrico Three.js. La demo del ventilador explica una idea
con lenguaje común y permite abrir nombres técnicos, ondas y límites del modelo.
El núcleo también reproduce una traza de ordenamiento desde JSON.

Estado: Fase 1 funcional; Fase 2 en revisión. Consulta AUDITORIA.md antes de reutilizar
la carga de perfiles o promover esta versión. La Fase 3 está pendiente.

## Abrir el ejemplo

Abre dist/index.html en un navegador con WebGL 2; no necesita conexión.
Recorre la pregunta y analogía, entra en el motor y cambia Nivel para profundizar.
La etiqueta ILUSTRACIÓN expresa que no se calculan fuerzas ni velocidad real.

## Instalar y ejecutar

Requiere Node.js >=22 y npm.

```sh
npm ci
npm run dev
```

El servidor local abre en http://127.0.0.1:5173.

## Probar y construir

```sh
npm run validate
npm test
npm run example
npm run build
npm audit
```

El audit actual informa un advisory moderado en AJV; no ejecutar audit fix sin revisar
la actualización, el lock y las pruebas. La prueba visual necesita Playwright y un
navegador preparados; no está cubierta solo por npm ci.

## Organización

skill/ contiene las instrucciones, engine/ la copia propuesta del núcleo y src/
conserva la compatibilidad de imports. schema/, examples/, tests/ y docs/ contienen
los contratos, casos, verificaciones e informes. No son dos implementaciones distintas.

## Límites

El circuito no se resuelve físicamente. La carga .glb es una interfaz reservada.
El algoritmo es una traza precomputada, no un ordenador universal ni un sorter de
entradas nuevas. El rendimiento móvil y la accesibilidad con lectores reales no
están acreditados.

## Licencia

Pendiente de confirmar titular y licencia propia. Los avisos de dependencias están
en dist/THIRD-PARTY-LICENSES.txt y dentro del HTML.
````


### 8.7 GitHub Pages — plan y comprobación local

El archivo correcto es **dist/index.html**, no demo/index.html: este último conserva el marcador del bundle. En la copia propuesta **docs/index.html es una copia idéntica** de dist/index.html, lista para seleccionar main + /docs como origen de Pages. El HTML contiene JS/CSS/datos; no importa módulos de src/ en runtime ni descarga un .glb.

Se ejecutó HTTP local bajo **/vge/** con esa copia: **200**, bootstrap cargado, paso 3D abierto y badge ILUSTRACIÓN; la única petición fue /vge/ y hubo **0 errores**. Esto prueba la copia y su subruta local; el despliegue en GitHub Pages y sus permisos reales: **NO VERIFICADO**.

La [documentación oficial de GitHub](https://docs.github.com/en/pages/getting-started-with-github-pages/configuring-a-publishing-source-for-your-github-pages-site) permite publicar desde una rama y /docs o usar Actions. Plan manual: crear remoto, subir rama main, Settings → Pages → Deploy from a branch → main → /docs. No se ejecutó esa configuración.

Los imports de código fuente deben seguir siendo relativos: demo/ → ../src y ../examples; tests/ → ../src y ../examples; validate → ../schema. Los $schema de modelos ya usan ../schema/vge.schema.json. Si se mueven archivos definitivamente a engine/, habrá que migrar sus referencias de forma coordinada. Cualquier futuro asset web deberá usar rutas relativas al sitio, no /src ni /workspace. En esta demo compilada no se observaron peticiones de assets.

Después de futuros builds deberá copiarse de nuevo dist/index.html a docs/index.html; aún no existe automatización para esa copia. Un workflow de Actions, su versión y su despliegue real: **NO VERIFICADO**.

### 8.8 ROADMAP.md — borrador no aplicado



```markdown
# ROADMAP · VGE

- Fase 1: núcleo, jerarquía, esquema, fallos y dos dominios funcionales.
  Corregir validación de escalas con overrides y finitud de seekCycle.
- Fase 2: plano, selección, respaldo ligero, campo y explicación por capas implementados
  en la demo inicial. Pendiente: perfiles compatibles, esquema lesson, coherencia de UI/API,
  fallback sin WebGL y regresión visual del ejemplo de ordenamiento.
- Antes de promover el repositorio: actualizar AJV con regresiones, elegir licencia/titular,
  aplicar gitignore y resolver la copia transitoria src/engine sin mantener dos fuentes.
- Fase 3, pendiente de aprobación: breadcrumbs, cámara al seleccionar, navegación jerárquica
  por teclado, aria-live de selección y voz opcional apagada por defecto.
- Fase 4, parcial en datos/API: predecir → observar → explicar, laboratorio de Hz y fallos
  pedagógicos definidos por JSON. No prometer simulación física sin un modelo adecuado.
- Fase 5, parcial: fijar Playwright/navegador, matriz 320/390/736, regresiones entre perfiles,
  rigor técnico, lectores reales y medición en teléfonos concretos.
- Fuera de alcance vigente: WebXR, DOF, partículas de flujo y carga .glb real.
```

### 8.9 Comandos Git para un repositorio y primer commit

**Propuestos, no ejecutados.** Abre la carpeta VGE-GitHub extraída. El remoto vacío debe existir antes del push; la auditoría no lo creó. Sustituye TU_USUARIO por tu usuario. El pathspec excluye node_modules aunque hayas probado la copia antes de aplicar el gitignore.

```sh
git init -b main
git add -- . ':!**/node_modules/**'
git commit -m "chore: importar VGE y auditoria sin cambios de codigo"
git remote add origin https://github.com/TU_USUARIO/vge.git
git push -u origin main
```

Si eliges el archivo .gitignore y la licencia de los borradores, añádelos en una revisión explícita posterior. Crear el remoto desde una CLI, autenticarlo y publicar Pages queda fuera de la ejecución de solo lectura de este informe.


## 9. RESUMEN EJECUTIVO


1. El núcleo y sus dos dominios funcionan; npm ci, las 49 pruebas y el ejemplo terminaron correctamente.
2. El build reproduce exactamente el HTML entregado; la demo inicial no necesita CDN ni assets externos.
3. La Fase 2 es parcial: cargar el PSC previo mezcla perfiles y hace que campo, giro y controles no concuerden.
4. La regla de tres capas vive en una UI específica; falta incorporarla formalmente a skill y contratos.
5. Se reprodujeron una escala negativa aceptada y NaN en seekCycle con una referencia extrema.
6. El visor del algoritmo pierde rótulos; API, historia y controles no comparten todo el estado.
7. npm audit informa una vulnerabilidad moderada de AJV; explotación en esta app: NO VERIFICADO.
8. Faltan licencia propia y un checker reproducible sin herramientas externas; resolverlos antes de promoción pública.
9. FPS móvil, lectores de pantalla y comprensión con participantes reales: NO VERIFICADO.
10. No se cambió ningún archivo fuente ni de skill; el ZIP solo copia el proyecto, añade organización compatible y este informe.
