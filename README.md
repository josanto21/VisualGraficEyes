# VGE · núcleo de herramientas nativas

El proyecto coordina **Anatomy, CircuitJS/Falstad, Manim, Remotion y Spline**, y
conserva Three.js para el abanico paramétrico. Cada motor mantiene sus fuentes
nativas. Hay un manifiesto común, adaptadores interactivos y tareas de build/render.

Empezar por [Núcleo y herramientas](docs/NUCLEO-HERRAMIENTAS.md) y
[Verificación actual](docs/NUCLEO-VERIFICACION.md).

```bash
npm ci
npm test
npm run core:validate
npm run core:doctor
npm run core:run -- maquina build
```

Anatomy y Remotion se ejecutaron nativamente; el motor PSC sigue pasando sus
pruebas. CircuitJS necesita su distribución local, Manim su instalación y Spline
una escena propia. Sus pruebas con dobles no demuestran ejecución nativa.
Las instrucciones para activar cada motor están en la documentación del núcleo.
La Fase 3 sigue pendiente de aprobación. La auditoría previa refleja la versión
anterior a esta ampliación.

La documentación y demo originales de Fase 2 se conservan a continuación.

El [Bloque C](docs/BLOQUE-C.md), versión **2.0.0-alpha.2.2**, aplica las tres
capas también al visor genérico. Para probar el ejemplo de números abre
`dist/index.html?example=bubble-sort` en un navegador, o
`http://127.0.0.1:5173/?example=bubble-sort` después de `npm run dev`.
`Nivel` parte en «Para todos»; los detalles se pueden abrir por separado y
la explicación común sigue visible. El recorrido repite siete estados preparados
para [3, 1, 2]; no ejecuta ordenamiento sobre entradas nuevas.

# VGE 2.0 · Fase 2, público general por capas

Explicación del motor de un ventilador: pregunta → analogía de dos personas que empujan una rueda → escena 3D. La capa común permanece visible; los nombres técnicos, ondas y valores son opcionales. Las fórmulas y los límites se abren aparte. No se ha iniciado la Fase 3.

## Abrir y usar

Abre `dist/index.html` en un navegador con WebGL 2. Contiene Three.js, validadores, geometría y datos: funciona sin conexión ni CDN. Recorre los cuatro pasos; al final puedes tocar piezas, girar la vista y abrir la ventana al interior o separar y volver a juntar el conjunto.

`Nivel` elige las capas que se abren por defecto en cada paso. `Ver el nombre técnico` y `Saber más` permiten abrirlas por separado. La capa común nunca desaparece. Las palabras se explican con ejemplos en el glosario tocable. El movimiento se puede pausar; con movimiento reducido comienza pausado.

El verde representa únicamente el campo. El azul identifica el rollo A y el naranja el B; las piezas físicas restantes son neutras. Las ondas, el brillo y la flecha leen el mismo reloj, y mover la línea blanca busca el mismo instante en todo el dibujo.

## Archivos

| Archivo | Función |
| --- | --- |
| `examples/psc.lesson.json` | Historia en cuatro pasos, tres capas por paso, nombres comunes/técnicos, funciones, anclas y glosario |
| `examples/psc.beginner.json` | Modelo de la demo: 75 entidades, metal gris, corrientes ilustrativas y diez pasos disponibles por API |
| `examples/psc.beginner.graphics.json` | Plano, selección y campo con estela; dos etiquetas simultáneas en móvil |
| `examples/psc.json`, `psc.graphics.json` | Caso técnico previo para la API y regresiones; paleta física corregida |
| `examples/bubble-sort.json` | Segundo dominio usando el mismo contrato |
| `examples/bubble-sort.lesson.json` | Analogía, siete pasos en tres capas, funciones y glosario del ejemplo numérico |
| `schema/vge.lesson.schema.json` | Contrato de las lecciones de ambos ejemplos; copia idéntica en `skill/assets/` |
| `schema/vge.schema.json` | Contrato de dominio aprobado en Fase 1, conservado |
| `schema/vge.graphics.schema.json` | Configuración de efectos, ampliada con estela y visibilidad de componentes |
| `src/VGEEngine.mjs` | Jerarquía, poses, estado, validación, reloj y ciclo de vida |
| `src/graphics/FieldVectors.mjs` | Campo y estela a partir de los canales de corriente y sus fases |
| `src/graphics/CoilPulse.mjs` | Brillo de los rollos a partir de los mismos canales |
| `src/ui/mountBeginnerVGE.mjs` | Historia, capas, escena, selección y controles para el público general |
| `src/ui/mountVGE.mjs`, `validateLesson.mjs` | Visor genérico por capas y validación estructural y de referencias de las lecciones |
| `src/ui/SignalDiagram.mjs` | Ondas y cursor del reloj común |
| `tests/` | Regresiones de núcleo, gráficos, lección y bloques; el total actual lo informa `npm test` |
| `tools/check-390.cjs` | Comprobación puntual de navegador requerida para esta corrección |
| `docs/FASE-2.md` | Arquitectura, convenciones, rendimiento y rigor |
| `docs/CORRECCION-ADELANTO.md` | Corrección de B adelantada y nueva prueba de navegador a 390 px |
| `docs/REVISION.html` | Informe histórico de la revisión por capas anterior a esta corrección |

## Desarrollar

Requiere Node.js 22.12.0 o posterior:

```sh
npm ci
npm test
npm run validate
npm run build
npm run dev
```

`dev` sirve la demo en `http://127.0.0.1:5173`; se puede cambiar con `VGE_PORT`. Las licencias de dependencias están dentro del HTML y en `dist/THIRD-PARTY-LICENSES.txt`.

La revisión usa Playwright 1.64.1 y el descargador `@puppeteer/browsers` 3.2.6,
fijados en `devDependencies` y en el lock. Después de `npm ci`, un comando
descarga Chrome Headless Shell **156.0.8078.4**, la versión que declara ese
Playwright, desde Chrome for Testing de Google. Se guarda en la caché local
`.cache/vge-browser/`, excluida de Git. No se instala Puppeteer para ejecutar
pruebas: el ejecutor sigue siendo Playwright.

```sh
npm run browser:install
npm run build
npm run check:390
npm run check:block-a
```

No necesita `NODE_PATH`, un Playwright del host ni una ruta manual a Chrome.
En Linux mínimo, usa `npm run browser:install -- --with-deps` para instalar
también las bibliotecas del sistema que pide Playwright (puede requerir
privilegios de administración). La descarga necesita conexión; repetirla reutiliza
la caché. La demo empaquetada sigue siendo autónoma.

Las capturas y los resultados se escriben en `out/qa-390/`, `out/qa-block-c/` y `out/qa-block-a/`;
`VGE_QA_DIR` permite elegir otro directorio de salida. El check cuenta las frases
del texto común y las etiquetas de piezas visibles en los estados recorridos:
máximo dos de cada una. No mide comprensión humana, FPS en teléfono ni completa
la matriz de Fase 5. El navegador real y la GPU observados figuran en su JSON.

## Fuente canónica y licencia pendiente

`src/` es la única implementación del motor; exports, demo, ejemplos y pruebas
la consumen. Se retiraron las copias de `engine/`: cualquier consumidor externo
de esas rutas debe migrar al export del paquete o a su módulo equivalente en
`src/`. Las salidas `dist/index.html` y `docs/index.html` se regeneran juntas.

La licencia del código propio sigue sin elegirse: [LICENSE-PENDIENTE.md](LICENSE-PENDIENTE.md).
Los avisos de terceros se conservan; consulta también el
[aviso sobre Spline](docs/TERMINOS-SPLINE.md).

## API conservada y extensión del reloj

El visor genérico ahora requiere `mountVGE(host, modelo, {lesson})` con una
lección `layout: "steps"` que valide contra `schema/vge.lesson.schema.json`.
`mountBeginnerVGE` usa la lección PSC `layout: "story"`. El esquema de modelo
`schema/vge.schema.json` no cambia: la lección es un archivo complementario.
El visor valida capas, referencias, correspondencia de pasos y funciones comunes
de las entidades seleccionables antes de construir la escena; si faltan, muestra
un mensaje. La demo resuelve las lecciones de sus dos ejemplos conocidos;
un modelo nuevo requiere aportar su lección mediante la API. El selector de
archivos conserva la carga de esos ejemplos conocidos.

`select(id)`, `explode(t)`, `setStep(n)`, `setParam(name,v)`, `injectFault(id)` y `dispose()` mantienen sus funciones. Los fallos siguen pudiendo cambiar parámetros y visibilidad; las escenas admiten predicción opcional. El JSON inválido muestra un panel con el motivo.

`getBindingState(id)` devuelve fase, velocidad angular de presentación, amplitud y desplazamiento de una animación. `seekCycle(id,fraction)` busca un instante de ese ciclo en todas las animaciones sin reconstruir geometría ni perder selección, despiece o parámetros. Las ondas muestrean ese mismo estado; no tienen otro reloj.

## Límites

Es una **ILUSTRACIÓN**, no una solución del circuito ni una simulación electromecánica. La variante inicial elige amplitudes iguales y 90° para que el campo se vea circular; son supuestos ilustrativos. B empuja primero y A después: el capacitor adelanta la corriente de la rama auxiliar. La convención del dibujo usa i_A = sin(θ), i_B = a sin(θ + δ) y eje de B en −Z para que campo, pieza central y aspas giren hacia +X; el capacitor no es un temporizador. Su capacitancia no se usa para resolver aquí el desfase.

El brillo representa el valor absoluto de una señal relativa, no luminosidad ni calor reales. La velocidad de las piezas no se calcula desde el campo. En el control de turnos a 0° se detiene cualitativamente el giro del dibujo y se muestra un campo pulsante. Separar piezas es un recurso didáctico; no muestra un motor que funcione físicamente separado.

La Fase 3, el laboratorio de Hz y los fallos pedagógicos de Fase 4, y la matriz formal de Fase 5 siguen pendientes. WebXR, DOF, partículas y carga .glb permanecen fuera de alcance; .glb conserva solo su interfaz reservada.
