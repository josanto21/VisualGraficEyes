# Fase 2 · corrección del adelanto de B

Corrección posterior a la auditoría, 22 de octubre de 2026. No se inicia la Fase 3.

## Cambio visible

B (naranja) empuja primero y A (azul) después. La etiqueta de la cajita dice «La que adelanta a B». Analogía, leyenda, funciones y glosario usan la misma explicación; la capa común permanece visible. La capa avanzada conserva sus fórmulas y límites, con los signos corregidos.

## Correspondencia del dibujo

- `i_A = sin(θ)`.
- `i_B = a · sin(θ + δ)`: con δ positivo, la corriente de B está adelantada respecto de A.
- `B* = (0, i_A, −i_B)`: el eje positivo de B se elige en −Z; campo y piezas giran hacia +X.

Con δ = 90°, B empieza en su máximo positivo y A llega al suyo un cuarto de ciclo después. Cursor, curvas, brillo, flecha y estela leen el mismo estado. La etiqueta ILUSTRACIÓN y los límites físicos permanecen: no se deduce δ de la capacitancia ni se calcula el par o la velocidad real. La analogía no significa que las bobinas se enciendan por turnos exclusivos.

[Oriental Motor, sección Capacitor](https://www.orientalmotor.com/ac-motors-gear-motors/technology/ac-motor-overview.html), fuente primaria consultada: capacitor en serie con la rama auxiliar y adelanto de su corriente.

## Verificación ejecutada

`npm ci`, `npm test`, `npm run validate` y `npm run build` terminaron con exit 0. Pasaron 50/50 pruebas Node: 27 del núcleo, 14 de gráficos y 9 de la lección. Tres modelos válidos. La instalación imprimió la advertencia del entorno `Unknown env config "http-proxy"`. No se cambiaron versiones ni dependencias.

`npm run check:390` terminó con exit 0: 17 comprobaciones en Chromium 131.0.6778.204 headless con WebGL por software y Playwright 1.62.1. Principal: 390 × 844, DPR 1; adicional: 320 px. Consola: 0 errores; peticiones HTTP externas: 0. Sin desbordamiento en los estados comprobados y zonas táctiles de al menos 44 × 44 px. Se inspeccionaron las capturas actuales de la analogía, selección del capacitor y capa técnica.

La sonda adicional de navegador verificó las etiquetas exactas de A/B/cajita, glosario y conservación de las capas común/avanzada. En las curvas SVG, el máximo positivo de B aparece en x = 22 y el siguiente de A en x = 101, coordenadas del viewBox. Se probó también el modelo previo `psc.json`: slider y parámetro coinciden en 60°, y campo/pieza central giran en el mismo sentido.

Cambios angulares medidos en la demo inicial al avanzar 0,02 s desde la fracción de ciclo 0,1, con δ = 90°:

| Elemento | Cambio angular (rad) |
| --- | ---: |
| Flecha del campo | +0,037699111843 |
| Pieza central | +0,029321531434 |
| Aspas | +0,029321531434 |

Todos son positivos en las referencias elegidas. Se comprobaron máximos adelantados de B a 30°, 60° y 90°. El campo conserva su módulo circular en cuadratura; el caso 0° sigue siendo pulsante con giro ilustrativo detenido.

El registro actual está en `qa/comprobacion-390.json`. Los PNG de `qa/` y `docs/REVISION.html` conservan la revisión histórica anterior de las capas, no la apariencia corregida. Si se incluye `AUDITORIA.md`, también describe la versión anterior: no se reescribe la auditoría ni se declaran resueltos todos sus hallazgos.

Rendimiento en un teléfono físico, lector de pantalla y comprensión con participantes externos: NO VERIFICADO. Esta prueba de navegador no acredita FPS ni consumo móvil.

## Qué revisar en el teléfono

1. En el paso 2, B dice «Empuja primero» y A «Empuja después».
2. Al elegir la cajita en el paso 4, aparece «La que adelanta a B» junto a ella.
3. En nombres técnicos, el cursor empieza con B más intensa; al avanzar un cuarto del ciclo domina A. «Saber más» conserva fórmulas, convención espacial y límites.
