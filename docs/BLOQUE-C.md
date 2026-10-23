# Bloque C · skill y capas

23 de octubre de 2026, UTC. Versión **2.0.0-alpha.2.2**. Base:
`c23447cac202ce8c04b34dc01258ce25a73145bd` (Bloque B). Rama `bloque-c`.
El PR apunta temporalmente a `bloque-b`, cuyo PR #2 continúa abierto; su diff
contiene solo C. Después de fusionar B, cambiar su base a `main` antes de
fusionar C. Las fusiones corresponden al usuario.

## Cambios y archivos

| Requisito | Implementación |
| --- | --- |
| VGE-005 | `src/ui/mountVGE.mjs` lee la lección del dominio: pregunta, analogía, explicación común permanente, nivel y dos detalles independientes. `examples/bubble-sort.lesson.json` describe los siete estados, funciones y glosario. |
| VGE-006 | `demo/index.html` sitúa el rótulo y la línea dentro de la escena. Nombre y función permanecen juntos; el rótulo de la tarjeta seleccionada ya no queda fuera del área recortada. |
| Lenguaje | Resaltado normal/ligero en la interfaz; `emissive` permanece como identificador interno compatible. La capa avanzada conserva términos y límites. |
| Contrato de lección | `schema/vge.lesson.schema.json` y `src/ui/validateLesson.mjs`: capas no vacías, referencias de partes/señales/glosario, funciones comunes, número de pasos y valores del mismo estado. PSC y bubble-sort validan antes de abrir la vista. |
| Skill | `skill/SKILL.md`, `skill/references/capas-y-lecciones.md`, esquema distribuido y `agents/openai.yaml`. Tres capas obligatorias, público general por defecto y dos lecturas de la captura a 390 px. |
| Entrada y pruebas | `demo/main.mjs`, `tools/validate-examples.mjs`, `tools/check-block-c.cjs`, `tests/block-c.test.mjs`, package y lock; `dist/index.html` y `docs/index.html` regenerados juntos. |

El contrato de modelo de Fase 1 y la geometría del motor no cambian. La lección
es un archivo complementario. `layout: "story"` admite un recorrido independiente,
como los cuatro pasos PSC; `layout: "steps"` requiere una entrada por cada paso
del modelo. El validador de referencias de `focus` solo exige una entidad real
en `steps`; en `story` es un rol que interpreta el recorrido PSC (`b`, `field`).

El visor genérico requiere ahora `mountVGE(host, modelo, {lesson})`. Un modelo
sin lección muestra un error legible; no se inventan funciones comunes a partir
de etiquetas técnicas. La demo resuelve los dos ejemplos conocidos; un modelo
nuevo necesita aportar la lección por API. Sin WebGL, el ejemplo numérico
conserva textos, niveles y orden actual, con aviso; no se afirma una imagen 3D
de respaldo. El ventilador conserva su imagen estática y pasó su regresión.

## Ejecución y resultados

```sh
npm ci
npm run browser:install
npm test
npm run validate
npm run build
npm run check:390
npm run check:block-a
npm audit
```

Node 24.19.0, npm 11.9.0, Linux x64. Playwright 1.64.1 y Chrome Headless Shell
156.0.8078.4 reales, con WebGL por software (SwiftShader). No se suministraron
NODE_PATH, módulo Playwright del host ni ruta manual de Chrome a los comandos.

| Comando final | Código | Resultado real |
| --- | --- | --- |
| npm ci | 0 | 27 paquetes |
| npm test | 0 | 81/81; cero fallos, cancelaciones u omisiones |
| npm run validate | 0 | Tres modelos y dos lecciones; PSC 4 escenas y bubble-sort 7, con tres capas |
| npm run build | 0 | 1014372 bytes; dist y docs idénticos |
| npm run browser:install | 0 | Versión y arranque comprobados; también se ejecutó con caché vacía |
| npm run check:390 | 0 | 19 comprobaciones PSC y cuatro genéricas; 63 estados y nueve posiciones de etiquetas |
| npm run check:block-a | 0 | VGE-007/008/014: 3/3 |
| npm audit --json | 0 | Cero vulnerabilidades informadas en el árbol raíz |

npm emite `Unknown env config "http-proxy"`, un aviso del entorno. Los checkers
registran errores JS y de consola: cero en los escenarios recorridos. La apertura
directa del ejemplo registró además advertencias: cero; las advertencias de toda
la matriz son **NO VERIFICADO**. No se actualizaron ni auditaron los árboles
separados de las integraciones nativas en este bloque.

Hubo intentos interrumpidos por una caché de Chrome incompleta o sin permiso de
ejecución. La causa de su alteración es **NO VERIFICADO**. Se repitió la preparación
documentada y el comando conjunto completo terminó con código 0. Los intentos
fallidos y la ejecución final están en la evidencia; no se cambió el código
del instalador ni del lanzador para obtener ese resultado.

## Regresiones antes y después

Los mismos bytes de los dos archivos de pruebas se ejecutaron sobre B y C;
sus hashes, salidas completas y preparación figuran en
[verification.json](../qa/block-c/verification.json).

| Caso en navegador | Antes, HTML exacto de B | Después |
| --- | --- | --- |
| VGE-005 | No existe Nivel en el visor numérico | Común permanente y detalles por nivel o por toque; cambios de paso por API sincronizados |
| VGE-006 | Rótulo por debajo del área de dibujo y recortado | Dentro del dibujo con línea; tres tarjetas a 320/390/736 px |
| Lenguaje del resaltado | Opción «Emisivo · ahorro» visible | Normal/ligero; el modo ligero no deja contornos visibles |
| Sin WebGL | Visor genérico sin explicación utilizable | Común, capas y orden final accesibles |

Las cuatro pruebas de contrato también fallan antes y pasan después: tres
fallaban porque aún no existía el validador de lecciones y una por la regla
obligatoria ausente en la skill. Son pruebas de la nueva funcionalidad; los
defectos visuales se reprodujeron por separado en el navegador.

La matriz genérica recorre 3 anchuras × 3 niveles × 7 pasos = 63 estados:
sin desbordamiento horizontal y objetivos visibles habilitados de al menos
44 px en los estados comprobados. Las nueve posiciones del rótulo se midieron
respecto del área de la escena. La prueba PSC conserva el conteo real de frases
y etiquetas; estas comprobaciones no completan la Fase 5.

## Dos lecturas a 390 px

Autolecturas **simuladas con IA** de las capturas reales inspeccionadas;
no se realizaron entrevistas ni una prueba de comprensión con personas.

| Lectura | Antes | Después |
| --- | --- | --- |
| Persona sin conocimiento previo | «Veo barras, pero no sé qué significa Burbuja ni qué dice cada color. Traza, permutar y geometría paramétrica son confusos; no veo la función de la tarjeta seleccionada». | «Son tarjetas para ordenar números. Azul: falta revisar; naranja: miramos o cambiamos; verde: lugar final comprobado. Se cambia una pareja para dejar el mayor a la derecha; la tarjeta conserva su número». |
| Persona con conocimiento | El alcance menciona reproducción preparada, pero se expone directamente y no hay progresión común/técnica/avanzada. | La traza conserva identidades y llega a [1,2,3]. El detalle declara estados predefinidos, parada temprana para el mejor caso O(n), peor caso O(n²) y ausencia de medición de complejidad o ejecución general. No afirma demostrar empates. |

Se reemplazó además el rótulo de implementación «FASE 02» por «Explora paso a
paso» en el visor genérico. La segunda inspección de las capturas mantiene
pregunta → analogía → escena, nombre y función juntos, leyenda explicada y
capa común aun con ambos detalles abiertos.

Capturas: [antes](../qa/block-c/antes-390.png),
[común](../qa/block-c/comun-390.png),
[avanzada](../qa/block-c/avanzado-390.png) y
[entrada](../qa/block-c/entrada-390.png).

## Skill instalada y copia del proyecto

La skill instalada está en
`/root/.codex/skills/remote-skills/skill-6ad8ccde00048191b2ec865528e6866f/`.
Sus 11 archivos coinciden en bytes con `skill/`; la validación oficial del
creador devolvió `Skill is valid!` en ambas copias. Se guardó con el commit
`98e7fe805132c5504770b90d6ea1024da88b1f64` en el repositorio de skills.
Ese guardado es independiente de las ramas del proyecto VGE.

Una prueba con un agente nuevo, siguiendo solo la skill candidata y su esquema,
produjo una lección de tarjetas [4,2,3]. Se comprobó con AJV su estructura y
las dos frases comunes por paso; su salida queda en
[skill-forward.lesson.json](../qa/block-c/skill-forward.lesson.json).
No se pidió ni generó un modelo para esa lección: sus vínculos, ejecución y
render son **NO VERIFICADO**.

## Revisión en el teléfono

Para ejecutar el ejemplo, usa `dist/index.html?example=bubble-sort` servido por
un servidor web; abrir el archivo en la vista de GitHub muestra su código.
En el equipo, `npm run dev` ofrece la ruta
`http://127.0.0.1:5173/?example=bubble-sort`.
Si tienes Python y quieres acceder desde un teléfono en la misma red, ejecuta
en la raíz `python3 -m http.server 8080 --bind 0.0.0.0 --directory dist` y abre
`http://IP-DEL-EQUIPO:8080/?example=bubble-sort` en el navegador del teléfono.

1. Cambia Nivel y abre/cierra los dos detalles: la explicación común debe
   permanecer y cada paso debe recuperar la apertura elegida por Nivel.
2. Toca las tres barras y cambia la selección: nombre, función y línea deben
   seguir dentro del dibujo. Comprueba lectura y facilidad de toque.
3. Recorre los siete pasos hasta 1,2,3 y vuelve atrás; revisa los colores,
   el orden actual y que no aparezca desplazamiento horizontal.

Rendimiento en teléfono físico, comprensión con personas, lector de pantalla,
Windows/macOS nativos e integración nativa completa de los motores en este
bloque: **NO VERIFICADO**. La licencia sigue pendiente de decisión.
Bloque D / Fase 3 y los bloques siguientes permanecen pendientes de aprobación.
