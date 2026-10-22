# VGE · paquete completo

Este paquete reúne el proyecto disponible, la skill VisualGraficEyes, el esquema,
los ejemplos, la auditoría actual y el prompt de auditoría mejorado.
Los 119 archivos de la entrega auditada se conservan sin cambios; esta guía es
el único archivo añadido. El empaquetado no corrige los hallazgos de la auditoría.

## Por dónde empezar

| Ruta | Contenido |
| --- | --- |
| `AUDITORIA.md` | Auditoría actual: evidencia, pruebas, riesgos y preparación para GitHub |
| `README.md` | Instalación, desarrollo y uso de los motores |
| `skill/SKILL.md` | Instrucciones de VisualGraficEyes |
| `skill/references/auditoria-del-proyecto.md` | Prompt y protocolo mejorados de auditoría |
| `skill/references/` | Referencias de la skill |
| `schema/` | Esquemas de datos |
| `src/` | Motor e interfaz actuales |
| `examples/` | Ejemplos y configuraciones |
| `tests/` | Pruebas automatizadas |
| `docs/` | Documentación y revisiones anteriores |
| `dist/index.html` | Ejemplo del ventilador listo para abrir |

## Abrir el ejemplo

Descomprime el ZIP y abre `VGE-GitHub/dist/index.html` en un navegador compatible
con WebGL 2. Para el desarrollo y los motores nativos, sigue `README.md` y
`docs/NUCLEO-HERRAMIENTAS.md`.

## Instalar y comprobar

Desde `VGE-GitHub`, con Node.js 22 o posterior:

```sh
npm ci
npm test
npm run example
```

Estos comandos instalan dependencias y ejecutan comprobaciones en tu copia.
Los resultados ya obtenidos y los límites de lo verificado están en `AUDITORIA.md`.

## Crear el repositorio y el primer commit

Desde la carpeta descomprimida:

```sh
cd VGE-GitHub
git init -b main
git add .
git commit -m "Importar VGE y auditoría inicial"
```

Esto crea un repositorio local. La auditoría contiene las propuestas de README,
ROADMAP, organización de archivos y publicación en GitHub Pages. Revisa sus
hallazgos y las licencias antes de publicar.
