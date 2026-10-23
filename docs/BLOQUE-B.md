# Bloque B · reproducibilidad y limpieza

Fecha: 22 de octubre de 2026, America/Panama. Base comprobada:
`20794263940eec07ebc1caee10305ae5f6672ecd` (Bloque A). Rama: `bloque-b`.
El PR se propone sobre `bloque-a` mientras A siga sin fusionarse; así su diff
contiene solo B. Después de fusionar A, su base puede cambiarse a `main`.
Las fusiones corresponden al usuario.

## Cambios

| Requisito | Resultado |
| --- | --- |
| VGE-009 | Playwright 1.64.1 y descargador @puppeteer/browsers 3.2.6 fijados; Chrome Headless Shell 156.0.8078.4 en caché del proyecto. Un comando lo descarga, conserva permisos ejecutables y comprueba su versión y arranque. |
| VGE-010 | AJV 8.17.1 → 8.20.0; lock y bundle regenerados. npm audit raíz informa 0 vulnerabilidades. |
| VGE-011 | Retiradas las 12 copias de engine/. src/ sigue siendo la fuente que consumen exports, demo, ejemplos y tests; las pruebas impiden reintroducir ese segundo árbol o imports hacia él. |
| Conteo de contenido | check:390 mide las frases del texto común y las etiquetas de piezas visibles. Incluye dos pruebas negativas en el DOM para impedir un resultado positivo si deja de contar. |
| Licencia | LICENSE-PENDIENTE.md y aviso de Spline preparados. No se eligió licencia; la decisión y la autorización concreta del SDK siguen pendientes. |

Los imports activos ya utilizaban `src/`; se verificaron y se conservan. Para un
consumidor que antes importaba `engine/<ruta>.mjs`, la ruta equivalente es
`src/<ruta>.mjs`. Para el motor principal conviene usar el export del paquete.
Los 12 archivos retirados son AssetLoader, VGEEngine, factories, validate,
graphics/{CoilPulse,FieldVectors,VGEGraphics,validateGraphics} y
ui/{SignalDiagram,mountBeginnerVGE,mountVGE,status}.
Consumidores externos de las rutas retiradas: **NO VERIFICADO**.

El build actualiza juntos `dist/index.html` y `docs/index.html`: sus bytes son
idénticos. La implementación y las lecciones de `src/` y `examples/` se conservan.
No se inicia el Bloque C ni la Fase 3.

## Reproducir

Requiere Node.js >=22.12.0 (mínimo del descargador fijado):

```sh
npm ci
npm run browser:install
npm test
npm run validate
npm run build
npm run check:390
npm run check:block-a
npm audit
```

En Linux mínimo se puede sustituir la preparación por
`npm run browser:install -- --with-deps`; las bibliotecas del sistema pueden
requerir privilegios administrativos. Esa variante no fue necesaria aquí:
**NO VERIFICADO** en un sistema sin esas bibliotecas.

La descarga estándar del CDN de Playwright devolvió HTML de error donde se
esperaba un ZIP. Se emplea la API pública del descargador de Puppeteer para
obtener de Google el mismo build que declara Playwright; un test comprueba
esa correspondencia. Playwright sigue siendo quien ejecuta las pruebas.
Se corrigió además la extracción sin permiso de ejecución y se repitió la
descarga con la caché del proyecto vacía; el comando verificó `--version`
antes de anunciar el navegador preparado. No se suministró NODE_PATH, módulo
del host ni ruta manual de Chrome a las comprobaciones finales.

Referencias: [navegadores Playwright](https://playwright.dev/docs/browsers),
[descargador de Puppeteer](https://pptr.dev/browsers-api),
[advisory de AJV](https://github.com/advisories/GHSA-2g4f-4pwh-qvx6).

## Resultados reales

Entorno: Node 24.19.0, npm 11.9.0, Linux x64. Chromium real headless
156.0.8078.4 con WebGL por software (SwiftShader).

| Comando final | Código | Resultado |
| --- | --- | --- |
| npm ci | 0 | 27 paquetes instalados |
| npm run browser:install | 0 | Descarga desde caché vacía y arranque/versionado de 156.0.8078.4 comprobados |
| npm test | 0 | 77/77; 0 fallos, omisiones o cancelaciones |
| npm run validate | 0 | Tres documentos válidos: PSC 75 entidades/10 pasos, PSC común 75/10 y ordenamiento 4/7 |
| npm run build | 0 | 995020 bytes; dist y docs idénticos |
| npm run check:390 | 0 | 19 comprobaciones; 390 px y revisión adicional a 320 px; 0 errores JS/consola y 0 solicitudes HTTP |
| npm run check:block-a | 0 | 3/3 regresiones de interfaz, incluido fallback sin WebGL |
| npm audit --json | 0 | 0 vulnerabilidades informadas en el árbol raíz |

Los comandos npm emiten el aviso del entorno `Unknown env config "http-proxy"`.
No se confunde ese aviso con la consola del navegador, que quedó sin errores.
No se actualizaron ni auditaron de nuevo los árboles separados de integraciones.

## Regresiones antes y después

Los mismos bytes de `tests/block-b.test.mjs` se ejecutaron sobre una copia
aislada del commit base y sobre B: 4 fallan antes → las 4 pasan después dentro
de las 77 pruebas. Los hashes y las salidas completas están en
[verification.json](../qa/block-b/verification.json).

Antes, `npm run check:390` sin NODE_PATH fallaba con módulo Playwright ausente;
después funciona con la dependencia local y el navegador preparado por el
comando documentado. npm audit pasó de 1 vulnerabilidad moderada de AJV a 0.

Para comprobar el defecto del conteo se utilizó el mismo HTML de A con una
tercera frase añadida al primer paso. El checker antiguo terminó con código 0
y afirmó un máximo de dos; el nuevo terminó con código 1 y el mensaje
`Inicio: 3 frases; máximo 2`. Solo esta sonda del checker antiguo recibió
explícitamente las herramientas que no declaraba. No es una dependencia de B.
El checker normal incluye además el rechazo de una tercera etiqueta visible
antes de continuar con la escena original restaurada.

### Qué cuenta el check

El texto común de `.story-text`, segmentado en oraciones con Intl.Segmenter
en español. Cada uno de los cuatro pasos mostró 2 frases. Las etiquetas se
cuentan en `.piece-label` cuando tienen rectángulo visible y visibilidad CSS:
0/0/0/2 en los cuatro pasos; máximo 2 en las siete selecciones recorridas.
Se registraron 20 mediciones de contenido. El título, la leyenda general,
los controles y los detalles opcionales no forman parte de esos dos conteos.
Es un criterio automático de contenido, no una prueba de comprensión.

## Revisión en el teléfono

Las capturas corresponden a un navegador de escritorio a 390 px:
[inicio](../qa/block-b/inicio-390.png) y
[escena común](../qa/block-b/comun-390.png). Se inspeccionaron ambas imágenes.

1. Recorre los cuatro pasos y confirma que B actúa primero, A después y la
   cajita adelanta a B; la explicación común debe permanecer al cambiar Nivel.
2. Comprueba selección, ventana al interior, separación y pausa; no deben
   cambiar respecto de A ni provocar desplazamiento horizontal.
3. Abre el glosario y los detalles y comprueba que texto y controles se leen
   cómodamente en tu dispositivo.

GitHub muestra el código cuando se abre el archivo del repositorio. Para
ejecutarlo, abre el HTML descargado en un navegador o usa el servidor local
documentado. No se ha publicado una web de B ni modificado Pages.

Rendimiento en teléfono físico, comprensión de personas, lector de pantalla,
Windows/macOS nativos, Node 22.12 exacto y CI de GitHub Actions:
**NO VERIFICADO**. La integración nativa de todos los motores tampoco se
ejecutó en este bloque. La Fase 3 y los demás bloques permanecen pendientes.
