# Capas y contrato de lección

Usar al crear contenido de público general o conectar un JSON de lección a VGE.
Conservar el modelo y la narración como datos separados: una lección no genera
por sí sola geometría, no ejecuta un algoritmo ni prueba una simulación física.

## Lenguaje y presentación

- Mantener pregunta y analogía antes de la escena. Explicar en la capa común el
  cambio observado y la función de la parte seleccionada; situar nombre y función
  juntos dentro del área visible, con línea hacia su ancla cuando corresponda.
- Reservar terminología y valores a la capa técnica. Usar «Tarjeta (elemento)»
  o «Barra central (eje)», con ambas expresiones juntas al introducirlas.
- Abrir supuestos, fórmulas y límites en la avanzada. Conservar la etiqueta
  ILUSTRACIÓN/SIMULACIÓN del modelo en todas las escenas, con un alcance común
  que explique si se repiten estados preparados o se calcula algo nuevo.
- Presentar Nivel con tres opciones y capa común permanente. Reiniciar solo la
  apertura por defecto de los detalles al cambiar de escena, según ese nivel;
  conservar la capacidad de abrir cada detalle por separado.

## JSON de lección

Validar con `assets/vge.lesson.schema.json` de esta skill. En el proyecto VGE,
usar `schema/vge.lesson.schema.json` y `validateLesson(lesson, model)`.

| Campo | Contrato |
| --- | --- |
| schemaVersion | `2.0.0`; versión del contrato, distinta de la versión del paquete |
| layout | `story` para un recorrido independiente, como los cuatro pasos PSC; `steps` para una entrada por cada paso del modelo |
| title / scope | Pregunta y alcance en lenguaje común |
| intro | Analogía; obligatoria para layout steps |
| story | Lista de title, text común, technical, advanced, focus y next; ninguna capa vacía; máximo dos frases principales por paso |
| parts | id del modelo, name común, function y technical con equivalente; term y anchor local de tres coordenadas son opcionales |
| signals | binding y entity del modelo, color hexadecimal y name; lista vacía si no hay señales |
| glossary | id, name común, meaning con ejemplo y technical emparejado; lista vacía si no se necesita |
| legend | Hasta cuatro colores semánticos, cada uno con color y text explicativo; los neutros no requieren otra categoría |
| readout | Opcional: entity, dataKey y label para mostrar una lista de valores simples tomada del mismo estado del modelo |
| stageNote / takeaway | Anotación común y cierre breve opcionales |

En `story`, focus identifica el rol que usa el recorrido; por eso PSC admite
`b` y `field`. En `steps`, focus referencia una entidad real y el número de
entradas debe coincidir con el de pasos. Describir en parts cada entidad
seleccionable del visor de pasos. Mantener IDs únicos y comprobar los enlaces
al glosario, las señales y los valores de readout. No afirmar validación de esas
referencias si solo se tiene la lección y falta el modelo.

`text` es la capa común; no agregar propiedades alternativas common/layer1 que
la interfaz no lea. La presencia del JSON no prueba que sus capas se hayan
presentado: comprobar los cambios de Nivel, los botones, el paso por API y el
rótulo renderizado. JSON inválido debe mostrar un motivo legible.

## Dos lecturas

Con una captura real a 390 px, registrar qué entiende una persona sin
conocimiento previo y qué objeta una persona con conocimiento. Corregir cada
«no sé» o confusión en la explicación, colores o relaciones; repetir esa lectura.
Etiquetar una lectura realizada por IA como simulada. No usarla como evidencia
de comprensión con personas ni como medición de rendimiento móvil.
