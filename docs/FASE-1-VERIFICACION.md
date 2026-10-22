# Evidencia de Fase 1

Documento histórico de Fase 1. Para el estado actual de los gráficos, consulta `FASE-2.md`.

Entorno: Node.js 24.19.0, Three.js 0.180.0 y AJV 8.17.1. Pruebas de CPU y estado Three.js, sin WebGL ni medidas de GPU. No se ejecutó la matriz Playwright reservada para Fase 5.

## Resultados ejecutados

`npm test`: **27 pruebas, 27 correctas**. Verifica dos dominios con el mismo esquema, rechazo de versiones/IDs/referencias/ciclos/canales erróneos, reutilización de recursos, despiece, conservación de fase, relaciones sinusoidales, fallos reversibles, estado al retroceder, pausa por visibilidad, dibujo bajo demanda y disposición idempotente.

`npm run validate`: ambos JSON cumplen la validación estructural y semántica con las fábricas correspondientes.

`npm run example`: el PSC se construye, admite los métodos públicos y se libera.

## Recuentos numéricos

| Dato PSC | Mobile | Desktop |
| --- | ---: | ---: |
| Entidades lógicas | 75 | 75 |
| Meshes | 61 | 61 |
| Geometrías únicas | 26 | 26 |
| Materiales únicos precalculados | 8 | 8 |
| Triángulos del conjunto ensamblado, antes de culling | 16 112 | 34 312 |
| Radio máximo de los vértices de los tubos de bobina | 0.662553 | 0.663674 |
| Radio interior del yugo | 0.665 | 0.665 |

El recuento de triángulos suma las instancias mesh, aunque compartan geometría. No es una medición de draw calls ni FPS. El radio usa los vértices teselados con los parámetros actuales; comprueba holgura radial del bobinado respecto al yugo y no sustituye una revisión de todas las intersecciones.

Tras 1.000 actualizaciones se conserva la misma identidad de geometrías y los mismos recuentos de recursos. Un renderer instrumentado verifica ausencia de llamadas de dibujo y de RAF pendiente al ocultar la pestaña o la superficie, y ausencia de salto de fase al reanudar. Esto prueba la lógica de suspensión; no acredita rendimiento ni aspecto en un móvil físico.

## Rigor del ejemplo PSC

Topología declarada: principal en una rama y auxiliar con capacitor permanente en serie en la otra. No se incluye interruptor centrífugo. Las senoides son normalizadas y comparten reloj de fase.

El desfase y la velocidad visual son supuestos. Cambiar la capacitancia actualiza su dato de referencia, pero no recalcula el desfase porque falta un modelo de impedancias. La ilustración no obtiene par, aceleración, deslizamiento, temperatura o caudal. El motor no opera físicamente con sus piezas separadas.

## Pendiente de fases posteriores

Clipping real, bordes/emisivo y flechas de campo; UX y accesibilidad; flujo de predicción y laboratorio de Hz; Playwright a 320/390/736 px, consola y capturas. Ninguna de esas comprobaciones se declara realizada aquí.
