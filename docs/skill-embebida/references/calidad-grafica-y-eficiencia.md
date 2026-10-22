# Calidad gráfica mediante matemáticas y uso eficiente de recursos

Elegir operaciones por su efecto visible y educativo. Usar solo las necesarias y comparar el resultado antes de aumentar el coste. Mantener el método válido para cualquier materia y para salidas estáticas o dinámicas.

## Recursos según el problema

| Necesidad | Matemática útil | Aplicación |
| --- | --- | --- |
| Siluetas y superficies suaves | Curvas de Bézier, splines, superficies paramétricas, simetrías | Aspas, órganos, perfiles y piezas curvas |
| Forma, posición y cámara coherentes | Vectores, matrices, coordenadas locales, cuaterniones y proyecciones | Ensamblado, giro sobre el eje real y vistas manipulables |
| Volumen y acabado legibles | Normales, productos escalares, modelos de reflectancia y cálculo de luz | Materiales, sombreado y contraste entre componentes |
| Continuidad en las transiciones | Interpolación y funciones de suavizado | Despiece, cámara y cambios de estado sin saltos |
| Acumulación o cambios físicos relevantes | Integración, derivación y ecuaciones del modelo | Movimiento o flujos cuando se necesite simularlos |
| Representación clara de datos | Escalas, estadística y transformaciones justificadas | Gráficos y comparaciones sin distorsión |

No afirmar que las integrales generan por sí solas superficies más suaves ni que más polígonos garantizan mejor explicación. Diferenciar la forma del objeto, su iluminación y el movimiento. En renderizado, muchos motores aproximan las integrales de iluminación mediante modelos y precálculos; no presentar esas aproximaciones como trazado completo de trayectorias de luz.

## Construcción con coste acotado

- Definir una fuente de geometría y estado. Calcular perfiles, mallas y rutas una vez; actualizar transformaciones durante la reproducción.
- Elegir detalle según tamaño en pantalla. Usar normales suaves donde corresponda; conservar aristas y huecos con función. No redondear contactos, símbolos o límites que deban permanecer definidos.
- Compartir geometría y materiales. Agrupar o instanciar repeticiones si reduce el coste sin perder la selección o el movimiento independiente necesarios.
- Limitar resolución interna, sombras, luces y efectos para móvil. Aplicar calidad adaptativa con mediciones cuando sea posible; priorizar legibilidad sobre efectos secundarios.
- Renderizar al cambiar el estado; mantener un ciclo continuo solo durante la animación o interacción. Suspenderlo al pausar, ocultar la página o salir de pantalla y liberar recursos al retirar la escena.
- Precalcular lo estable, como iluminación del entorno, y evitar descargar texturas o motores pesados sin beneficio. Mantener versiones de dependencias verificadas y una alternativa accesible cuando falle la capacidad gráfica.
- Mantener las fórmulas fuera del flujo del producto salvo que el objetivo sea comprenderlas. Si la solicitud es estética, expresar los resultados en términos de forma, volumen, legibilidad y fluidez.

## Verificación y alcance de las afirmaciones

Inspeccionar un estado ensamblado, uno abierto y una pieza seleccionada. Revisar normales, huecos, intersecciones, orientación, orden visual y posición de anotaciones. Comprobar reproducción, pausa y reanudación, navegación, movimiento reducido y un tamaño móvil.

Cuando se disponga de navegador, observar errores y tiempos de dibujo en ese entorno y registrar al menos una vista representativa. Un límite de píxeles o de polígonos es una decisión de diseño, no una medición de fluidez. Una ejecución en escritorio, emulación o renderizador por software no acredita rendimiento real en el teléfono del usuario. Declarar solo lo verificado y evitar prometer una optimización universal.
