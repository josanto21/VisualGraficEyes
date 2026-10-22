# Núcleo VGE: herramientas reales

## Selección y contrato común

VGE dirige la pedagogía y la procedencia. Un manifiesto de proyecto reúne las escenas; cada adaptador conserva el formato nativo. Elegir una herramienta principal y hasta una complementaria por escena. Se pueden usar más en el proyecto completo.

| Motor | Uso | Fuente nativa y salida | Verificación mínima |
| --- | --- | --- | --- |
| Anatomy | Máquina ilustrada con función, interior y despiece | JS/TS + kit SVG → HTML/SVG | Identificar skill/kit, compilar, abrir y comprobar una interacción |
| CircuitJS/Falstad | Experimentar con circuitos calculados | Texto de circuito → simulador + medidas | Importar realmente, resolver y contrastar al menos una medida |
| Manim Community | Matemáticas animadas paso a paso | Python Scene → video o fotogramas | Ejecutar Manim, leer el log e inspeccionar una salida |
| Remotion | Video explicativo y composición de clips | React + composición + props → preview/video | Cargar skills oficiales pertinentes, abrir preview o inspeccionar render real |
| Spline | Escena 3D editable y manipulable | Proyecto en editor y export .splinecode → runtime | Cargar una exportación válida, probar interacción y liberar recursos |
| Three.js VGE | Geometría paramétrica, corte y despiece | JSON VGE → escena del motor | Validar JSON, ejecutar y comprobar selección/animación |

No confundir un modo ANATOMÍA con el producto/kit Anatomy. No presentar Three.js o SVG como un proyecto Spline. Si se solicita el acabado de un reel, inspeccionar el reel o clip disponible antes de afirmar fidelidad visual.

## Datos y capas compartidos

El manifiesto debe identificar proyecto, motor por escena, fuente, etiqueta ILUSTRACIÓN/SIMULACIÓN, las tres capas de explicación y parámetros con unidades/rangos. Conservar identidades de piezas, significado de colores y supuestos al cambiar de herramienta. La capa común permanece visible. Las escenas de motores distintos no necesitan tener idénticos controles: selección/despiece, integración temporal, render a video y edición externa son capacidades distintas.

Compartir medidas de CircuitJS con una escena requiere un mapeo explícito y el mismo origen para la API del iframe. Manim y Remotion producen fotogramas determinados por tiempo, no medidas eléctricas nuevas. Spline carga una exportación real; su runtime no crea por sí solo un proyecto en el editor.

## Disponibilidad y ejecución

1. Buscar herramientas, plugins y skills disponibles y comprobar archivos/ejecutables. Consultar documentación oficial actual antes de fijar versiones o APIs.
2. Informar qué está preparado, qué se ejecutó y qué necesita configuración. Registrar comando o API, versión, resultado y artefacto; escribir NO VERIFICADO para pruebas no realizadas.
3. Mantener dependencias pesadas aisladas y cargar solo el motor necesario. No instalar todos los motores para una consulta sencilla.
4. Preparar fuentes y comandos completos. No declarar un MP4 producido ni una escena publicada sin comprobarlo.
5. Respetar el alcance de la tarea y las aprobaciones de fases existentes. Cambiar la orquestación no autoriza desarrollar una fase de UX pendiente.

## Fuentes oficiales y skills

- Anatomy: resolver la skill/kit realmente instalado. Conservar su licencia y referencias cuando se redistribuya el kit; no inventar un repositorio oficial.
- CircuitJS: https://www.falstad.com/circuit/doc/js-interface.html y https://github.com/pfalstad/circuitjs1 . La API requiere mismo origen; una página externa no permite ese control directo.
- Manim: https://docs.manim.community/en/stable/ . Preparar entorno Python separado y sus dependencias del sistema. LaTeX solo si las escenas lo requieren.
- Remotion: https://www.remotion.dev/docs/ai/skills y https://github.com/remotion-dev/skills . Leer la skill oficial disponible o descargar sus instrucciones actuales antes de trabajar; consultar los archivos enlazados que apliquen. No afirmar que se instalaron globalmente por haberlos leído. Mantener versiones de remotion y @remotion/* iguales. Comprobar la licencia del uso previsto.
- Spline: https://docs.spline.design/exporting-your-scene/web/code-api-for-web y paquete @splinetool/runtime . Requiere .splinecode real o acceso al editor/MCP oficial que esté conectado; no inventar credenciales, URLs ni archivos exportados.

Las referencias son rutas de descubrimiento, no prueba de conexión. Leer documentación puede guiar la implementación, pero no cuenta como ejecución del motor.
