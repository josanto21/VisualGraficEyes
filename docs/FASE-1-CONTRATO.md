# Contrato VGE 2.0.0 · propuesta de Fase 1

Documento histórico de Fase 1. Para el estado actual de los gráficos, consulta `FASE-2.md`.

Una representación conserva la identidad de sus elementos mientras cambian las vistas, los pasos y los parámetros. El dominio aporta datos y fábricas; Three.js materializa la jerarquía.

## Estructura

| Bloque | Responsabilidad | Ejemplo PSC / ordenamiento |
| --- | --- | --- |
| `schemaVersion` | Versión exacta del documento | `2.0.0` |
| `metadata` | ID, título, descripción, idioma y autoría opcional | `fan-psc` / `bubble-312` |
| `mode` | Modo principal y un complemento opcional | ANATOMÍA + ESCENA 3D / ANIMADO-PASOS |
| `model` | ILUSTRACIÓN o SIMULACIÓN; alcance, supuestos y coordenadas | Giro ilustrativo / traza discreta exacta |
| `resources` | Geometrías y materiales reutilizables | Aro, tubo, aspa / una caja compartida |
| `entities` | Identidad, padre, nombre, función y poses locales | Rotor dentro del motor / elemento dentro del arreglo |
| `steps` | Cámara, subárboles visibles, texto, estado y predicción opcional | Interior o despiece / comparación o intercambio |
| `parameters` | Valor, unidad, rango y relaciones declarativas | Hz y fase / opcionales según el algoritmo |
| `faults` | Escenario, efectos visuales y sobre parámetros | Rama auxiliar abierta / lista vacía en esta traza |
| `takeaway` | Mensaje final | Relación entre partes / regla del ordenamiento |

Las claves desconocidas se rechazan, excepto dentro de `data` y los parámetros de una fábrica registrada, que tienen su contrato propio. `data` admite valores JSON para información del dominio: topología eléctrica, valor de un elemento, estado de la traza, etc.

Un documento requiere una raíz lógica única, IDs únicos por colección y padres válidos sin ciclos. El orden de declaración no importa. Una entidad sin geometría es un grupo; una entidad con geometría paramétrica requiere material. Una geometría `asset` reserva una URI .glb y un nombre de nodo opcional.

## Coordenadas y despiece

Sistema diestro, Y arriba, ángulos en radianes y Euler XYZ en el archivo. La unidad lineal es `m` o `scene-unit`. El PSC usa unidades de escena, sin afirmar medidas reales.

`transform.assembled` y `transform.exploded` contienen **poses locales absolutas respecto al padre**. Su posición es obligatoria. La rotación y la escala omitidas en ensamblado valen [0,0,0] y [1,1,1]. En despiece, esas dos propiedades omitidas heredan las de ensamblado.

`explode(0)` usa la pose ensamblada y `explode(1)` la separada. Las posiciones y escalas se interpolan linealmente; las orientaciones, con slerp entre cuaterniones precalculados. No se suman desplazamientos de llamadas anteriores. Los hijos heredan la transformación normal de su padre; si padre e hijo se separan, sus desplazamientos se componen jerárquicamente.

Los overrides `position`, `rotation` y `scale` de un paso reemplazan el componente correspondiente de la pose interpolada. No cambian la geometría. Las escalas del contrato deben ser positivas. Las relaciones LINEAR/SINE sobre escala se revisan para evitar rangos no positivos.

## Pasos como instantáneas

`visible` enumera raíces de subárboles. Nombrar una entidad activa sus descendientes y los ancestros necesarios; no activa hermanos de esos ancestros. El resto queda oculto. `visible: ["fan"]` muestra el conjunto completo; `visible: ["rotor_core"]` muestra el núcleo con su cadena de padres.

Cada `setStep(n)` recomputa la visibilidad y los overrides desde la base del documento. Reinicia la fase de las relaciones de animación, aplica cámara, selección y despiece del paso. No acumula datos ni materiales de pasos anteriores. `duration` se conserva como metadato para un director de recorrido; la clase no cambia automáticamente de paso al cumplirse el tiempo.

El nombre y la función breve permanecen juntos en `label` y `description`. La interfaz posterior deberá situarlos como anotación dentro de la escena, con la explicación inmediatamente debajo del nombre, según el criterio visual acordado.

La predicción contiene pregunta, opciones identificadas, respuesta y explicación. Es información del contrato: esta fase no muestra un cuestionario ni controla cuándo revelar la respuesta.

## Parámetros y animación

Cada parámetro define `name`, `label`, `unit`, `range: [mínimo,máximo]`, `value` inicial y `bindings`. `step` es una recomendación para el control futuro, no una cuantización obligatoria de `setParam`. `bindings: []` declara un parámetro de apoyo o reservado sin relación directa de dibujo.

Una relación escribe un único canal de una entidad: `position.x/y/z`, `rotation.x/y/z`, `scale.x/y/z` o `data.nombreNumerico`. Dos relaciones no pueden escribir el mismo canal. Los datos vinculados deben existir y ser numéricos; los overrides de los pasos conservan ese tipo.

| Tipo | Cálculo | Uso |
| --- | --- | --- |
| `LINEAR` | `v = scale·p + offset` | Valor instantáneo de posición, escala o dato |
| `PHASE` | `θ ← θ + dt·scale·p·producto(gains)` | Rotación o fase numérica |
| `SINE` | `v = bias + amplitude·p_amplitud·sin(θ + offset + phaseScale·p_fase)` | Señal o desplazamiento oscilatorio |

PHASE y SINE integran con exactitud la velocidad constante de cada intervalo de avance, sin usar `θ = velocidad_actual · tiempo_total`. Por eso variar una frecuencia no salta a otra fase. Se limita el ángulo módulo 2π. En SINE, `scale`, el parámetro fuente y `gains` definen la velocidad de fase; `amplitudeParameter` y `phaseParameter` son opcionales. Sin parámetro de amplitud se usa factor 1; sin parámetro de fase se añade 0.

`combine: "replace"` es el valor predeterminado. `combine: "add"` suma el resultado a la pose/dato base del paso, nunca al resultado del fotograma anterior. `explanation` documenta unidades y significado de la relación. No se admiten expresiones arbitrarias ni código JavaScript en el JSON.

Orden para resolver parámetros: **valor inicial → recomendación del paso → solicitud explícita del usuario → fallo activo**. Las solicitudes del usuario persisten entre pasos. Por ejemplo, una velocidad elegida por el usuario prevalece sobre la velocidad sugerida en una escena de despiece. Un fallo puede enmascarar esa solicitud; al retirarlo se recupera el valor solicitado. Todo resultado debe ser finito y estar dentro de su rango; de lo contrario la operación falla antes de cambiar estado.

Orden del estado visual: **interpolación de poses → overrides del paso → relaciones de parámetros → efectos visuales del fallo**. En cada actualización se parte de las bases, sin acumular efectos. Los efectos gráficos de selección se añadirán como adaptador posterior a esta composición.

## Fallos

`injectFault(id)` selecciona un solo fallo. Otro ID lo reemplaza; `null` lo retira. No se compone una lista simultánea en esta versión.

`parameterEffects` aplica `set`, `multiply` o `add` en el orden del array. `visualEffects` puede cambiar visibilidad, escala o referencia de material de la entidad. Un cambio de material requiere una entidad con geometría; para afectar un grupo se deben enumerar sus meshes pertinentes. Cambiar materiales no modifica el recurso compartido original.

`scenario` declara cuándo es válida la explicación. En el PSC, la apertura del capacitor se presenta como **intento de arranque desde reposo**. No se usa para asegurar que un motor ya girando se detendrá instantáneamente. El bloqueo del rotor anula el movimiento representado; no calcula corriente de bloqueo ni temperatura.

## Independencia del dominio

El núcleo no conoce motores ni burbuja. `psc.blade` se registra desde el ejemplo, fuera del núcleo. El algoritmo usa la fábrica genérica `box` y conserva `e3`, `e1` y `e2` como identidades estables. Cada paso cambia posiciones y materiales y aporta el estado lógico del arreglo en `data`.

La traza suministrada es:

1. Entrada [3,1,2].
2. Comparar 3 y 1.
3. Intercambiar: [1,3,2].
4. Comparar 3 y 2.
5. Intercambiar: [1,2,3].
6. Segunda pasada: comparar 1 y 2, sin intercambio.
7. Terminar: la pasada no produjo intercambios.

La etiqueta SIMULACIÓN se limita a esa reproducción discreta exacta. No equivale a ejecutar un ordenador virtual ni a resolver entradas nuevas.

## Render y extensiones posteriores

El renderer es una dependencia inyectada. El motor solicita frames solo cuando hay un cambio pendiente o una relación dinámica en reproducción. Un documento estático no mantiene RAF aunque se llame `play()`.

`visibilitychange` e `IntersectionObserver` suspenden el dibujo y cancelan RAF. Al volver, se reinicia la referencia temporal, conservando la fase, sin sumar el tiempo oculto. Los cambios de estado pedidos estando oculto se conservan para el siguiente dibujo visible. Sin IntersectionObserver, la suspensión por pestaña sigue funcionando; no se promete detectar salida de pantalla en un entorno que no ofrezca esa API.

El núcleo usa una lista de hijos precalculada, canales compilados y recursos reutilizados. La actualización del estado tiene coste O(entidades + relaciones + efectos), sin teselar mallas. El detalle móvil se decide al construir. No se han medido FPS en un teléfono real.

La Fase 2 podrá añadir un adaptador de efectos que lea selección y señales normalizadas, aplique clipping y dibuje el resaltado tras componer el estado. Las flechas deberán usar `main_winding.data.iNorm` y `aux_winding.data.iNorm` para conservar el mismo desfase, sin un reloj visual independiente.

## Decisiones para aprobar

- Recursos por referencia, jerarquía de raíz única y poses locales absolutas.
- Pasos como instantáneas, con preferencias explícitas del usuario persistentes.
- Relaciones limitadas a LINEAR/PHASE/SINE, ampliables de forma versionada.
- Un fallo activo y reversibilidad al retirarlo.
- ILUSTRACIÓN para el PSC y SIMULACIÓN limitada a la traza del algoritmo.

Confirmar este contrato antes de implementar clipping, resaltado o flechas de la Fase 2.
