# Fase 2 · corrección para público general por capas

## Presentación y contrato

El contrato de dominio de Fase 1 sigue intacto. El caso original y el de ordenamiento siguen validando. Se añade una variante PSC para la explicación inicial, con entidades y geometrías equivalentes y una convención temporal explícita; los textos de cada capa están en `psc.lesson.json`.

Cada uno de los cuatro pasos contiene `text`, `technical` y `advanced`. La capa común explica la idea con una analogía. La segunda añade equivalentes técnicos y, en la prueba 3D, las ondas y valores; la tercera muestra las fórmulas y límites. `Nivel` establece la apertura por defecto al cambiar de paso; los dos botones permiten cambiarla manualmente. Nunca se ocultan la pregunta, la analogía, las etiquetas comunes ni la leyenda.

Las etiquetas unen nombre y función breve dentro de la escena, con línea hacia el ancla de la pieza. En móvil se muestran dos: selección y referencia del paso. Seleccionar pausa el movimiento para poder leer. Todas las piezas clave están disponibles por toque y selector. El glosario explica las palabras sin depender de conocimiento eléctrico previo.

## Plano y selección

Se mantiene `THREE.Plane` en espacio mundial, transformado desde el ancla del motor. Solo afecta a estator y tapas; los objetos seleccionables ignoran los impactos que caen detrás del corte. No se recortan vértices ni se vuelven a teselar; no hay tapas volumétricas ni CSG.

El contorno comparte la geometría original y solo aparece en la pieza o subárbol seleccionado. El material recortado y el de selección se cachean sin mutar recursos compartidos. `auto` elige el respaldo ligero según indicios del dispositivo, tamaño del grupo o intervalos sostenidos de dibujo. No es una medición de GPU. La interfaz lo expresa como Normal/Ligero; los nombres de implementación permanecen en el código.

## Reloj, corrientes, brillo y campo

El núcleo integra el reloj una sola vez. `getBindingState` expone su estado sin dar acceso mutable; `seekCycle` asigna a todas las animaciones el instante correspondiente. Las curvas se reconstruyen solo al cambiar sus parámetros. Cursor, marcadores de las ondas, texto de dominancia, luz de bobinas y vector toman el estado del mismo fotograma; las líneas de etiquetas actualizan su posición con menor frecuencia para evitar trabajo de disposición innecesario.

En la variante inicial:

- `i_A = sin(theta)`.
- `i_B = a sin(theta + delta)`.
- `B* = i_A (0,1,0) + i_B (0,0,-1)`.
- `a = 1`, `delta = 90 grados`, `f = 60 Hz` y presentación 200 veces más lenta.

Son señales y componentes relativas de una ilustración, sin amperios ni teslas calculados. Las amplitudes iguales y cuadratura producen una trayectoria circular; 0° produce una línea pulsante. El brillo usa `abs(i)`. El metal del conjunto es gris y el verde solo se usa para el campo. Cada color tiene una frase de función y los nombres A/B evitan depender únicamente del color.

El capacitor adelanta la corriente de B respecto de A: B empuja primero y A después en la analogía. La señal de B lleva +delta; su eje espacial positivo se fija en −Z para que la flecha, la estela, la pieza central y las aspas conserven el giro hacia +X. Con delta = 90 grados el ciclo empieza en el máximo positivo de B, y A llega al suyo un cuarto de ciclo después. La documentación del fabricante confirma el adelanto; aquí no se resuelve la red de impedancias ni se deduce delta desde la capacitancia.

El campo usa las dos primitivas compartidas de flecha, un círculo y una línea de estela de 28 vértices preasignados. La estela muestrea las mismas señales en fases anteriores; no tiene reloj independiente ni acumula partículas. Solo se actualizan transformaciones y el atributo de posiciones. El giro de rotor/aspas es una guía de presentación, no un resultado de par ni deslizamiento.

## Recursos y ciclo de vida

No se crea WebGL hasta el cuarto paso, después de la pregunta y analogía. Se mantiene un único RAF, máximo de presentación de 30 FPS y DPR acotado a 1.5. El movimiento reducido empieza pausado; ocultar la pestaña/superficie o volver a la analogía suspende trabajo. Pausa congela los canales y el campo. Materiales y geometrías propios se liberan y los prestados se conservan hasta liberar el modelo.

## Verificación ejecutada

50 pruebas Node: 27 del núcleo, 14 de los gráficos previos y 9 de la lección, incluida la regresión del adelanto de B. Cubren búsqueda del reloj, señales en cuatro puntos conocidos, relación brillo/campo, convención de giro y muestras de estela, color exclusivo y recursos constantes después de 1.000 actualizaciones, además de los casos del núcleo.

Comprobación real con Playwright/Chromium a 390 px: capas y selector Nivel, cuatro pasos, cursor/luces/campo, siete piezas, contorno exclusivo y respaldo ligero, corte que cambia píxeles, separación y rearmado, glosario, reproducción/pausa, suspensión de la escena y error visible de JSON inválido. Consola sin errores y cero peticiones externas. Las zonas táctiles medidas son al menos 44 × 44 px; en la casilla se mide su etiqueta asociada completa. Sin desbordamiento horizontal. Se hizo una comprobación adicional a 320 px.

La nueva verificación del adelanto está en `CORRECCION-ADELANTO.md`. El informe `REVISION.html` y sus PNG son evidencia histórica anterior a esta corrección y muestran la convención anterior; no describen la demo corregida. Es una autoevaluación de comprensión, no una prueba con participantes humanos. No acredita FPS en hardware móvil ni completa la matriz 320/390/736 de Fase 5.

## Alcance y fuentes

No se inicia la Fase 3. Breadcrumbs, tween de cámara, navegación jerárquica de teclado, aria-live de selección y voz siguen fuera de esta entrega. La capa de términos y glosario responde a la corrección expresamente solicitada. El laboratorio de Hz y los fallos pedagógicos siguen en Fase 4; los fallos declarativos existentes conservan su API.

Referencias técnicas primarias consultadas:

- [Oriental Motor, AC Motor Overview](https://www.orientalmotor.com/ac-motors-gear-motors/technology/ac-motor-overview.html), estructura y capacitor permanente en serie con la rama auxiliar, con cambio/adelanto de su fase.
- [Three.js, Material](https://threejs.org/docs/pages/Material.html), clipping por material.
- [Three.js, ShaderMaterial](https://threejs.org/docs/pages/ShaderMaterial.html), contorno de selección.

Los documentos `FASE-1-CONTRATO.md` y `FASE-1-VERIFICACION.md` son evidencia histórica de la fase anterior.
