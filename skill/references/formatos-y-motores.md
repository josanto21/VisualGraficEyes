# Formatos y motores

Usar esta referencia al elegir una implementación concreta, preparar un proyecto o manejar una capacidad ausente. Mantener el contrato VGE independiente del proveedor, con Anatomy, CircuitJS/Falstad, Manim, Remotion y Spline como motores del núcleo. Leer nucleo-y-herramientas.md; una alternativa no cuenta como ejecución del motor solicitado.

## Prioridad de entrega

1. Respetar el formato pedido.
2. Revisar herramientas y skills realmente disponibles.
3. Elegir la solución más pequeña que permita aprender o experimentar.
4. Producir el resultado y comprobar la función principal.
5. Indicar en una o dos líneas cómo verlo o usarlo y cualquier limitación pendiente.

No obligar a elegir motor cuando el objetivo ya determine la solución. No convertir la instalación de una biblioteca en requisito para una explicación sencilla.

## Visual dentro de la conversación

- Utilizar la capacidad de visualización del entorno si está disponible y leer su skill completa.
- Respetar su contrato: algunos entornos esperan un fragmento HTML y una referencia nativa; otros admiten otro formato. No suponer que una página HTML completa se renderiza dentro de cualquier chat.
- Mantener fórmulas y narrativa fuera del fragmento si así lo requiere la superficie.
- Usar SVG para estructuras exactas; usar controles solo cuando permitan descubrir una relación.
- Preferir Mermaid para topología o relaciones compactas y una tabla para correspondencias exactas.
- Si no existe renderizado interactivo, entregar el esquema estático o un archivo completo como alternativa y explicar la diferencia.
- Utilizar los estilos, fuentes, bibliotecas y orígenes admitidos por el entorno. No depender de llamadas de red bloqueadas.

## HTML/SVG descargable

- Entregar un documento completo con estilos, contenido y comportamiento.
- Para un artefacto pequeño sin dependencias, incluir CSS, JavaScript y datos en el archivo.
- Evitar CDNs, fuentes remotas e importaciones si se promete funcionamiento sin conexión.
- Si una biblioteca hace necesaria la red, declararlo o empaquetarla cuando la licencia y el objetivo lo permitan.
- Verificar que se pueda abrir mediante el procedimiento indicado. Evitar rutas de máquina y módulos que fallen al abrir directamente un archivo.
- Adaptar tamaño, controles y etiquetas a móvil. Usar etiquetas accesibles y una alternativa textual breve.
- Para un sitio o app con varias rutas, un proyecto existente o publicación, utilizar el flujo de sitios o repositorio correspondiente.

## Manim: video matemático

- Elegir Manim para fórmulas, transformaciones, geometría y demostraciones secuenciales que se entreguen como video.
- No presentar un video como simulación interactiva.
- Preparar un proyecto pequeño con fuentes, dependencias, escenas y comandos compatibles con la versión utilizada.
- Indicar instalación, vista previa y renderizado final. Añadir LaTeX u otros requisitos solo si el código los necesita.
- Renderizar y revisar una escena representativa cuando las herramientas estén disponibles. Identificar claramente cualquier parte que no se haya ejecutado.
- Verificar que cada transformación sea matemáticamente válida y que el ritmo permita leerla.

## Remotion: video explicativo

- Elegirlo para composiciones de video mediante React, con escenas, tiempos, gráficos y narración cuando se disponga de audio.
- Utilizar la skill del motor si está disponible. Consultar documentación oficial actual antes de fijar dependencias, APIs o comandos que puedan cambiar.
- Entregar estructura completa, punto de entrada, composición y comandos de vista previa y exportación.
- Elaborar una apertura breve, desarrollo y cierre. Relacionar cada escena con la idea núcleo.
- No inventar una pista de voz. Diferenciar narración escrita, audio generado y audio realmente incorporado.
- Revisar imágenes renderizadas o un video si se producen. No llamar «video terminado» a un guion o proyecto sin renderizar.

## CircuitJS/Falstad: circuitos

- Preferir un simulador de circuitos para topologías complejas, conmutación, transitorios o componentes cuyo modelo no deba improvisarse.
- Para relaciones básicas, usar un modelo HTML/JS explícito y comprobable cuando resulte suficiente.
- Entregar un archivo importable o enlace verificado si se generó. No inventar formatos de importación ni parámetros URL.
- Explicar el procedimiento de apertura y las condiciones iniciales.
- Mantener la misma notación en esquema, controles, medidas y explicación.

## Three.js o Spline: forma espacial

- Utilizar 3D si el giro, corte o selección resuelven una duda espacial real.
- Usar bibliotecas o servicios solo si son accesibles. La mención de Spline no implica que haya cuenta, conexión o agente disponible.
- No prometer un proyecto editable en un servicio externo sin haberlo creado allí.
- Para un proyecto local, fijar dependencias después de consultar su documentación y proporcionar comandos reproducibles.
- Mantener una alternativa estática o explicación accesible si falla WebGL.
- Limitar complejidad para móvil y permitir teclado o botones además de gestos.

## Datos e imágenes

- Usar herramientas de trazado para gráficos científicos y datos exactos. Entregar archivo independiente si se pide exportar o publicar.
- Utilizar la generación de imágenes para escenas o ilustraciones donde sea apropiada, sin delegarle escalas, cifras o diagramas que deban ser exactos.
- Indicar si una imagen es ilustrativa. No tratar una imagen generada como evidencia del mecanismo o fenómeno.
- Consultar la skill específica de gráficos, imágenes, documentos o presentaciones cuando gobierne la salida.
