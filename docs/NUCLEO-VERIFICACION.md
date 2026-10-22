# Verificación del núcleo de herramientas

Entrega del 22 de octubre de 2026. Este documento registra la ampliación del
núcleo y no sustituye ni actualiza retrospectivamente la auditoría anterior.

## Estado comprobado

| Motor | Implementación | Evidencia y límite |
| --- | --- | --- |
| Anatomy | Tarea nativa y kit vendorizado con licencia | Build ejecutado mediante `core:run maquina build`; HTML abierto e inspeccionado a 390 px |
| Three.js VGE | Sesión sobre el motor existente | Apertura real del JSON PSC, parámetro, selección, despiece y liberación en tests sin WebGL; demo compilada idéntica a la anterior |
| CircuitJS/Falstad | Puente a su API y circuito preparado | Pruebas con doble; solver, importación y medida real: **NO VERIFICADO** |
| Manim | Comando nativo, datos de escena y fuente Python | Sintaxis comprobada; intento de render termina con `No module named manim`, código 1; video: **NO VERIFICADO** |
| Remotion | CLI nativa, composición React y props desde el manifiesto | Exportación real por `core:run video render`; H.264, 720 × 960, 24 fps, 120 fotogramas, 5 s; inspección de fotograma extraído del MP4 |
| Spline | Adaptador y runtime 2.0.105 instalados localmente | Firmas API leídas en el paquete; pruebas con doble; exportación propia, carga e interacción real: **NO VERIFICADO** |

Las dependencias nativas instaladas durante la comprobación no se incluyen
como `node_modules` en el ZIP. Se incluyen los manifiestos y locks para
reinstalarlas. Las salidas generadas quedan en `out/` al ejecutar los comandos;
son resultados reproducibles, separados de las fuentes.

## Comandos y resultados

| Comando | Resultado real |
| --- | --- |
| `npm ci` | Código 0; 8 paquetes añadidos |
| `npm test` | Código 0; **59 pruebas, 59 pasan, 0 fallan, 0 omitidas** |
| `npm run validate` | Código 0; PSC, PSC común y bubble-sort válidos |
| `npm run core:validate` | Código 0; manifiesto de 6 escenas y 6 motores válido |
| `npm run example` | Código 0; 75 entidades, 26 geometrías, 8 materiales, 5 vínculos; fallo reversible y recursos liberados |
| `npm run build` | Código 0; demo de 989560 bytes, idéntica byte por byte a la versión anterior |
| `npm run core:doctor` | Distingue paquetes disponibles de CircuitJS/Spline sin configurar y Manim ausente |
| `npm run core:run -- maquina build` | Código 0; HTML producido con el kit Anatomy |
| `npm run core:run -- pasos render` | Código 1; falta el módulo Python Manim; error explícito |
| `npm run core:run -- video render` | Código 0; MP4 H.264 producido y comprobado con ffprobe |
| `python3 -m py_compile integrations/manim/scene.py` | Código 0; solo verifica sintaxis, no ejecución Manim |

Las 9 pruebas nuevas verifican contrato, errores, conexión real al motor PSC,
ciclo de visibilidad, interfaces con dobles, datos comunes para tareas
nativas y rechazo de una salida inexistente pese a un proceso con código 0.
Las 50 pruebas anteriores del motor y la lección siguen pasando.
El último conjunto completo duró 1223.837909 ms en este entorno; no representa
rendimiento gráfico en un teléfono.

## Navegador y acabado

Anatomy se abrió en Chromium headless a 390 × 844 px. Se cambió la orientación
a 120 grados, se reprodujo y pausó la animación. Se comprobó:

- Sin desbordamiento horizontal.
- Botón, slider y encabezados tocables con altura de al menos 44 px.
- Cero errores JavaScript de página observados.
- Figura SVG y etiqueta ILUSTRACIÓN presentes.

La captura final de Anatomy y un fotograma del MP4 Remotion se inspeccionaron
visualmente. El MP4 tiene 155657 bytes y duración 5.000000 s.
No se midieron FPS, batería, GPU ni latencia en un teléfono físico.
No se hizo una nueva matriz completa del visor PSC a 320/390/736 px,
ni pruebas con lector de pantalla. Todo ello es **NO VERIFICADO en esta entrega**.
El lifecycle del núcleo se probó con un documento de visibilidad controlado,
no mediante una campaña en múltiples navegadores físicos.

## Dependencias, licencias y persistencia

El núcleo conserva Three.js 0.180.0, AJV 8.17.1 y esbuild 0.25.12 del proyecto.
Remotion y @remotion/cli se fijan en 4.0.537 con React/ReactDOM 19.1.0;
Spline runtime en 2.0.105; la fuente Manim prepara 0.22.0, **sin instalarla**.
Los dos paquetes nativos tienen `package-lock.json` separados.

`npm audit --json`: raíz, código 1, una vulnerabilidad moderada de AJV;
Remotion y Spline, código 0, cero vulnerabilidades informadas en sus árboles
instalados en esta consulta. No se aplicó un cambio de AJV ajeno al alcance.
La advertencia `Unknown env config "http-proxy"` apareció en npm y pertenece
a la configuración del entorno; no es un fallo del proyecto.

La copia del kit Anatomy conserva su licencia MIT. Remotion y Spline mantienen
sus propios términos; no se les atribuye una licencia nueva. No se añadieron
claves, credenciales ni cuentas de servicio.

La skill VGE se validó y guardó en su repositorio de skills mediante commit y
push satisfactorios (`db86229`). Se comprobó su uso con una consulta nueva de
planificación: distingue motores reales, fuentes, configuración pendiente y
evidencia de ejecución. Esa revisión de instrucciones no cuenta como ejecutar
los cinco motores.

## Lo que aún falta

CircuitJS necesita una distribución servida en el mismo origen; Manim necesita
su entorno; Spline necesita una exportación propia. Aún falta comprobar los
tres recorridos nativos respectivos de extremo a extremo.
También falta una lección temática que conecte varios motores con sus mapeos
de datos y pruebas cruzadas. La UI de la demo conserva su alcance de Fase 2:
no se desarrollaron breadcrumbs, voz, nuevos flujos de teclado ni la Fase 3.
