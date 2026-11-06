# Entrega en artefactos de claude.ai

Usar esta referencia cuando la visualización se publique como artefacto de claude.ai. Reúne lo que funcionó y lo que falló al publicar una página con los siete modos. Los límites los fija la plataforma y pueden cambiar: si su herramienta de publicación dice otra cosa, manda ella.

## Forma de la página

- Escribir un fragmento HTML: sin `<!doctype>`, `<html>`, `<head>` ni `<body>`. La plataforma añade el esqueleto. Poner `<title>` (un nombre de 2–4 palabras) y `<style>` al principio, dentro de los primeros 8 KB.
- Definir colores como variables en `:root`, redefinirlas para tema oscuro y dar a `body` un fondo propio; un `body` transparente muestra el fondo del visor.
- Margen lateral de al menos 16 px, sin desplazamiento horizontal a 390 px y controles táctiles de 44 px como mínimo.

## Qué se puede cargar

| Recurso | Cómo |
| --- | --- |
| Scripts externos | Solo de cdnjs.cloudflare.com, cdn.jsdelivr.net/npm/, unpkg.com, cdn.tailwindcss.com y code.jquery.com, con versión exacta |
| Three.js | `<script type="importmap">` con `three` → `https://cdn.jsdelivr.net/npm/three@<versión>/build/three.module.min.js` y `three/addons/` → `.../examples/jsm/`; luego `<script type="module">` |
| Fuentes | Hojas de Google Fonts, siempre con pila de respaldo |
| Imágenes, video, datos | Como archivos publicados junto a la página (parámetro `files`) y referidos con ruta relativa, o en línea como `data:` |
| Video renderizado | El MP4 y su póster como archivos adjuntos: `<video controls playsinline preload="metadata" poster="…">` |

Todo lo demás se bloquea sin error visible: hojas de estilo, imágenes o `fetch` de otros sitios.

## Qué no se puede hacer

- Incrustar otros sitios con `<iframe>`: falstad.com, YouTube o mapas no cargan. CircuitJS solo funcionaría como copia servida desde los archivos del propio artefacto; eso está «NO VERIFICADO» en este proyecto.
- Descargar archivos desde la página, imprimir, ni usar `alert`, `confirm` o `prompt`.
- Guardar estado importante en `localStorage`: sirve solo para comodidades del lector y debe ir dentro de `try/catch`.

## Rendimiento

- Crear cada escena 3D la primera vez que se abre su pestaña. Pausar el ciclo de dibujo cuando la pestaña o la página no se ven y cuando nada se mueve.
- Limitar `devicePixelRatio` a 2. Respetar `prefers-reduced-motion`: sin giro automático y con transiciones directas.
- Dar una alternativa en texto si WebGL no arranca.

## Verificar antes de publicar

```sh
npm run verify:page -- ruta/pagina.html --artefacto
```

El verificador envuelve el fragmento como la plataforma, aplica una aproximación de su lista de orígenes y sirve desde `node_modules` los scripts de jsDelivr o unpkg cuya versión coincide. Detecta errores, recursos bloqueados, desbordamiento, controles pequeños, texto cortado, decimales mezclados y fondo transparente, y recorre pestañas (`role="tab"`) y etapas (`data-step`). No sustituye la prueba en la página publicada ni en un teléfono real: ambas quedan «NO VERIFICADO» hasta hacerlas.
