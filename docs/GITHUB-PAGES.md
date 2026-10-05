# Publicar RGT Execution OS en GitHub Pages

## 1. Crear repositorio
Sube el contenido de esta carpeta a un repositorio GitHub.

## 2. Publicación
En GitHub:
Settings → Pages → Build and deployment → Deploy from a branch.
Selecciona la rama que contiene `index.html` y la carpeta `/ (root)`.

## 3. Características compatibles
- HTML/CSS/ES Modules sin build step.
- Rutas relativas.
- Hash router (`#/dashboard`, `#/board`, etc.).
- IndexedDB para datos locales del navegador.
- `.nojekyll` incluido.

## 4. Importante sobre IndexedDB
Los datos viven en el navegador y en el origen de GitHub Pages. Si abres la app desde otro dominio/origen, verás otra base local.

Esta fase no tiene backend ni autenticación. Eso es deliberado; se decidirá en fases posteriores si hace falta sincronización multiusuario.
