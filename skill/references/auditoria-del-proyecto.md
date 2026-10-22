# Auditoría de VGE: protocolo con evidencia reproducible

Actuar como auditor independiente de software, gráficos, pedagogía y accesibilidad. Evaluar lo que existe y funciona en la instantánea actual. No defender entregas anteriores ni convertir intenciones, documentación o tests aprobados en pruebas de capacidades que no ejercitan.

## Activación y alcance

Al recibir «Hazme una auditoría», ejecutar este protocolo sobre el proyecto VGE actual: skill visualgrafic-eyes instalada y su copia en el proyecto, motor, esquemas, ejemplos e integraciones que existan. Si el usuario identifica otro proyecto, respetar ese destino. Si solo está definiendo el atajo para el futuro, guardarlo sin iniciar una auditoría.

Resolver la versión actual mediante las fuentes conectadas o el repositorio indicado. No asumir que una copia de otro chat o una auditoría previa sigue vigente. Comparar la skill instalada con la copia incluida en el proyecto y explicar diferencias.

## Reglas obligatorias

- **Solo lectura del proyecto y de la skill durante la auditoría.** No corregir, actualizar dependencias, formatear, modificar contratos, avanzar fases ni publicar. Los únicos entregables nuevos son el informe y el ZIP de copias.
- Ejecutar `npm ci`, pruebas, ejemplos, auditorías de dependencias y builds necesarios en una copia aislada. Estos comandos pueden escribir archivos o ejecutar scripts: no usarlos sobre el original. Mantener logs y cachés fuera del original. Comparar hashes antes/después para comprobar que las fuentes originales siguen intactas.
- Basar cada afirmación en lectura directa o ejecución observada. Dar archivo/sección o comando/resultado como evidencia. Escribir exactamente **NO VERIFICADO** para lo no comprobado. Una prueba antigua, un test con doble, la presencia de un adaptador o una dependencia instalada no demuestran una ejecución nativa actual.
- Distinguir fecha del archivo de fase de creación. No atribuir una fase ni declarar un archivo huérfano sin evidencia; usar NO VERIFICADO cuando corresponda. Definir el criterio de uso y seguir importaciones, entradas, scripts y referencias.
- Marcar fallos y bloqueos reales. Si un comando no existe o falla, incluir la salida y el código; no inventar resultados, sustituirlos por los de otra versión ni declarar aprobadas las comprobaciones dependientes.
- Conservar en el informe los borradores propuestos. No escribir `.gitignore`, `package.json`, README, licencia o ROADMAP sobre el proyecto auditado.
- No reproducir claves ni valores privados en el informe, logs entregables o ZIP. Documentar ubicaciones y hallazgos con valores ocultos. Delimitar el alcance de búsquedas de secretos: ausencia de coincidencias no demuestra ausencia universal de datos privados.
- No llamar «medición móvil» a un viewport pequeño, una simulación de CPU ni una prueba sin GPU. Diferenciar navegador real, emulación, revisión estática, cálculo y dobles de prueba.

## Entrega: un único informe AUDITORIA.md

Incluir fecha, versión o hash de las fuentes y alcance antes de estas nueve secciones, conservando sus nombres y orden. Mantener logs, borradores y evidencias textuales dentro del informe; no entregar informes auxiliares que fragmenten la auditoría.

### Método y criterios de aceptación

- Fijar una instantánea: fuente, versión/commit o SHA-256, fecha con zona horaria, archivos incluidos y exclusiones. Separar el original, la skill instalada y las copias de ejecución. Si el usuario cambia el protocolo antes de empezar las pruebas, registrar esa modificación autorizada y tomar la línea base después; no confundirla con una corrección del proyecto auditado.
- Crear una matriz requisito → archivo/función → comprobación → resultado → límite. Clasificar la evidencia como lectura estática, prueba automática sin render, prueba con doble, ejecución nativa, navegador con render o dispositivo físico. NO VERIFICADO nunca equivale a aprobado.
- Asignar IDs estables a hallazgos y documentar severidad alta/media/baja, impacto, evidencia, pasos mínimos de reproducción, recomendación y criterio para considerarlo resuelto. Separar defecto reproducido, limitación declarada y prueba bloqueada; no elevar una sospecha a defecto confirmado.
- Por comando, conservar fecha, directorio relativo, versiones relevantes, código de salida y stdout/stderr reales con secretos ocultos. Contar pruebas pasadas, fallidas y omitidas a partir de la ejecución actual. Si se abrevia un log largo, identificarlo y conservar el tramo que sustenta el resultado; no sustituirlo por una conclusión inventada.
- Comprobar estados inicial, habitual, límite, error y liberación cuando correspondan: JSON inválido, parámetro fuera de rango, cambio de escena, pausa/ocultación, recurso ausente y dispose. Probar interacciones por API y por interfaz por separado; que una funcione no demuestra sincronía de la otra.
- Evaluar cada motor nativo con estados distintos: adaptador implementado, dependencia disponible, fuente configurada, ejecución observada y salida inspeccionada. Inspeccionar una salida real cuando se afirme que fue producida. No contar un SVG como Spline, una secuencia HTML como Remotion ni un doble de CircuitJS como simulación eléctrica.
- Definir «hecho» por los criterios de la fase, «parcial» por requisitos faltantes identificados y «pendiente» por falta de implementación verificable. Si no hay evidencia suficiente, añadir NO VERIFICADO al estado; pasar tests no completa por sí solo una fase.
- Antes de entregar, verificar que los originales mantienen sus hashes y que el ZIP solo contiene copias fieles y el informe nuevo. Expresar un dictamen de publicación: listo / listo con condiciones / no listo, con bloqueos concretos. No prometer «listo para GitHub» cuando conservar imports exige tareas pendientes ni confundir subir fuentes con desplegar un ejemplo funcional.

### 1. INVENTARIO

Árbol completo de archivos, con tamaño y fecha. Para cada archivo, indicar qué es, qué fase lo creó y si se usa o está huérfano, con evidencia o NO VERIFICADO. Incluir `SKILL.md`, todas sus referencias y recursos, y la ubicación de la skill instalada.

Inventariar también los archivos existentes de motores e integraciones, fuentes nativas, esquemas, ejemplos, herramientas, dependencias declaradas, builds y evidencias. Distinguir la instantánea original de los archivos generados al ejecutar la copia. No ocultar archivos bajo una selección parcial presentada como árbol completo; declarar alcance y exclusiones justificadas si algún árbol no puede inspeccionarse.

### 2. ARQUITECTURA

Mostrar la conexión skill → esquema → JSON de ejemplo → motor → escena y los adaptadores/motores nativos presentes. Identificar qué genera geometría, qué anima y qué maneja la interfaz. Localizar datos hardcodeados que deberían estar en el JSON, con rutas y evidencia.

El usuario solicitó diagrama ASCII. Si las instrucciones del entorno exigen diagramas renderizados cuando estén disponibles, usar Mermaid para la misma arquitectura y explicar brevemente esa diferencia de formato. No perder el contenido de la relación por cambiar el formato.

### 3. ESTADO POR FASE

Tabla Fases 1 a 5: hecho / parcial / pendiente y evidencia. Usar el alcance acordado del proyecto:

1. Arquitectura data-driven: esquema, ejemplos, validación, jerarquía y API del motor.
2. Gráficos: corte, selección con respaldo ligero y campo ligado a corrientes.
3. UX/A11y: breadcrumbs, cámara, teclado, aria-live y voz opcional.
4. Pedagogía: predecir → observar → explicar, laboratorio y fallos por datos.
5. Autoverificación: pruebas en los tamaños acordados, consola, capturas y rigor técnico.

No confundir la posterior integración de herramientas nativas con haber completado las fases pendientes. Describirla también cuando exista.

Ejecutar literalmente `npm ci`, `npm test` y `npm run example` en la copia aislada. Pegar los resultados reales, códigos de salida, número de pruebas, errores y advertencias. Identificar versión de Node/npm y directorio relativo de ejecución. Si hay paquetes separados, registrar cuáles se comprobaron y cuáles quedaron NO VERIFICADO.

### 4. COHERENCIA

- ¿La skill describe lo que el código hace de verdad? Enumerar diferencias y separar intención de comportamiento comprobado.
- ¿Todos los JSON validan contra su esquema correspondiente? Clasificar documentos de motor, manifiestos, gráficos, lecciones, configuración y otros JSON; no afirmar validación contractual por solo parsearlos. Para datos sin esquema, indicarlo.
- ¿`CONTRATO.md` coincide con el esquema? Buscar el documento real, señalar si falta o si hay versiones históricas con otro nombre y comparar su alcance sin asumir equivalencia.
- ¿Cada escena cumple las capas común / técnico / avanzado y la etiqueta ILUSTRACIÓN/SIMULACIÓN? Comprobar datos y presentación efectiva; el texto común permanece visible. Diferenciar metadatos presentes de controles efectivamente implementados.

### 5. DEPENDENCIAS Y RIESGOS

Versiones de Three.js y demás paquetes, origen CDN o instalación local, licencias y avisos incluidos. Ejecutar `npm audit`, registrar resultados reales y separar cada árbol de dependencias presente.

Detectar rutas absolutas y dependencias del entorno que fallarían en otro equipo, así como claves o datos privados que no deban subirse. Distinguir rutas de ejecución de las que solo aparecen en informes históricos. No corregirlas durante la auditoría.

En motores nativos distinguir disponibilidad de Anatomy/kit, CircuitJS, Manim, Remotion y sus skills, Spline/runtime/exportación y Three.js. Una librería o fuente preparada no equivale a una integración funcionando. Leer licencias reales; no asignar MIT a todo el proyecto por usar una dependencia MIT.

### 6. RENDIMIENTO Y ACCESIBILIDAD

Separar lo medido de lo no medido. Identificar navegador, versión, viewport, dispositivo o emulación y operaciones probadas. Marcar qué se observó en un navegador real y qué solo se probó con dobles o sin render.

No afirmar rendimiento móvil sin medición. Documentar controles, desbordamientos, capas, etiquetas, teclado, pausa/visibilidad, movimiento reducido y accesibilidad solo hasta donde exista evidencia. Capturas o métricas históricas no prueban la versión actual. Todo lo no ejecutado se marca NO VERIFICADO.

### 7. DEUDA TÉCNICA

Lista priorizada alta / media / baja de problemas, duplicaciones y partes frágiles. Para cada hallazgo incluir ubicación, evidencia, consecuencia y acción recomendada; distinguir una recomendación de una modificación realizada. No aplicar fixes.

### 8. PREPARACIÓN PARA GITHUB

- Proponer estructura `skill/`, `engine/`, `schema/`, `examples/`, `docs/`, `tests/`; conservar las integraciones y herramientas adicionales necesarias.
- Mapa completo «archivo actual → ruta nueva», incluyendo rutas que deban conservarse por compatibilidad.
- Borradores de `.gitignore`, `package.json` con scripts, licencia sugerida y README: qué es, cómo instalar, correr y probar. No inventar titular de derechos ni declarar una licencia ya concedida.
- Plan de GitHub Pages: archivo exacto que abre el ejemplo, directorio de publicación y rutas que deben ser relativas. Separar viabilidad leída, prueba local y despliegue real. Auditar no autoriza desplegar.
- Borrador de `ROADMAP.md` con fases hechas y pendientes respaldadas por evidencia.

Mantener estos borradores dentro de AUDITORIA.md. Si la reorganización exige cambiar imports, scripts o configuración, documentarlo como pendiente y conservar las rutas originales necesarias en el ZIP. No romper el proyecto para forzar el árbol propuesto ni llamarlo listo para subir si faltan requisitos materiales.

### 9. RESUMEN EJECUTIVO

Máximo 10 líneas: qué está sólido, qué está frágil y qué debe arreglarse antes de subir. Reflejar limitaciones y problemas verificados; no concluir que todo funciona a partir de tests de alcance menor.

## ZIP y comandos Git

Entregar además un ZIP con la estructura propuesta, **solo copiando archivos, sin cambios de código**. Generarlo fuera del original y comparar bytes de las copias con sus fuentes. No sobrescribir archivos originales ni introducir los borradores como si fueran implementación aprobada. Se puede incluir una copia del nuevo AUDITORIA.md.

Conservar rutas de compatibilidad cuando mover archivos rompería imports. Documentar cualquier diferencia entre estructura ideal y copia funcional. Excluir credenciales y archivos privados de una preparación para GitHub, e identificar las exclusiones sin exponer sus valores. No incluir dependencias instaladas o cachés generadas como si fueran fuentes; explicar qué se excluye del ZIP frente al inventario.

Añadir al informe y a la respuesta final los comandos Git concretos para crear el repositorio local y el primer commit. No ejecutarlos sobre el proyecto auditado. Un `git push` o creación de repositorio remoto requiere una instrucción explícita del usuario; la auditoría por sí sola no lo autoriza.

Guardar AUDITORIA.md y el ZIP con el mecanismo persistente del entorno, preservando la identidad de un informe existente cuando se actualice. La petición de auditoría autoriza crear los entregables; no autoriza editar las fuentes, la skill ni el proyecto para que pasen las pruebas.
