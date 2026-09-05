# VIBRA URBANA — Catálogo Web Estático

Proyecto nuevo e independiente del sistema CI4. 100% HTML + CSS + JavaScript
vanilla (sin frameworks, sin build step) para que sea 100% compatible con
GitHub Pages.

## Cómo previsualizar

El sitio usa `fetch()` para leer `data/catalogo.json`, y los navegadores
bloquean `fetch` sobre archivos abiertos directamente (`file://`). Necesitás
un servidor local minimo. Cualquiera de estos sirve:

```bash
# Opción 1 — Python (ya viene instalado en casi todo)
python3 -m http.server 8080

# Opción 2 — Node
npx serve .
```

Después abrí `http://localhost:8080` en el navegador (probá primero en el
inspector con el modo "Responsive" en ~390px de ancho, que es el público
principal). En GitHub Pages esto no hace falta: `fetch` funciona normal
porque ya se sirve por HTTPS.

## Estructura

```
index.html          Home / Landing               (Fase 1 ✅)
catalogo.html        Grid + filtros + búsqueda     (Fase 2 — placeholder)
producto.html         Detalle + variantes           (Fase 3 — placeholder)
carrito.html          Carrito + WhatsApp            (Fase 4 — placeholder)

data/catalogo.json    "Base de datos" pública. Hoy con datos de ejemplo,
                       más adelante generada por el sistema CI4.

uploads/productos/    Imágenes, mismo criterio de carpetas que usará
                       la exportación real (producto/color/imagen).

assets/css/
  tokens.css           Design tokens (color, tipografía, espaciado)
  base.css             Reset + header + footer + componentes compartidos
                        (botones, chips, product-card) que usan todas las páginas
  home.css             Solo lo específico de la Home

assets/js/
  data.js              Único punto que hace fetch() al catalogo.json
                        y expone helpers (precioDesde, formatearPrecio, etc.)
  cart.js              Carrito en localStorage (hoy solo el contador;
                        la lógica completa llega en la Fase 4)
  header.js            Menú móvil + contador del carrito (compartido
                        por todas las páginas)
  icons.js             Set de íconos SVG inline (sin librería externa)
  render-home.js        Pinta la Home a partir de catalogo.json
```

## Por qué este formato de JSON

`catalogo.json` está anidado por color (no son tablas planas) para que el
frontend nunca tenga que cruzar datos en JavaScript:

```
producto
 └─ colores[]
     ├─ imagen_principal / imagenes[]   (viene de producto_imagenes)
     └─ variantes[]                      (viene de producto_variantes)
         ├─ sku
         ├─ talla
         ├─ stock
         └─ precio
```

Esto mapea 1:1 con las tablas reales de CI4, así que cuando llegue la Fase 7
un script PHP puede generarlo con una consulta bien armada — no hace falta
cambiar la forma de los datos, solo el origen.

## Plan de fases

| # | Fase | Estado |
|---|------|--------|
| 1 | Home/Landing (mobile + desktop) con datos mock | ✅ Entregado |
| 2 | Catálogo: grid, chips de etiquetas, buscador, orden | Próximo |
| 3 | Detalle de producto: galería por color, selector color/talla, precio y stock por variante | Pendiente |
| 4 | Carrito (localStorage) + botón "Consultar por WhatsApp" con mensaje autogenerado | Pendiente |
| 5 | Pulido responsive, estados vacío/agotado, microanimaciones | Pendiente |
| 6 | Esquema final de `catalogo.json` + checklist de exportación | Pendiente |
| 7 | Conexión real: script en CI4 que genera `catalogo.json` + copia imágenes a `uploads/` | Al final, no se toca el sistema actual hasta llegar acá |

## Notas de esta entrega (Fase 1)

- Las fotos de producto son un placeholder (silueta de zapatilla en
  `assets/icons/shoe-placeholder.svg`) porque todavía no hay imágenes reales
  conectadas — en la Fase 7, `imagen_principal` apuntará a archivos reales
  dentro de `uploads/`.
- El buscador y el ícono de carrito ya están en el header pero llevan a las
  páginas placeholder (`catalogo.html`, `carrito.html`) — se activan en sus
  fases correspondientes.
- Los "chips de estilo" de la Home se generan dinámicamente desde
  `catalogo.etiquetas` (las que tengan `visible_en_chips: true`), igual que
  hiciste en el módulo de Inventario del CI4 — mismo concepto, reutilizado.
- El número de WhatsApp (`meta.whatsapp_numero` en el JSON) es un placeholder
  boliviano de ejemplo — reemplazalo por el real cuando quieras probarlo, o
  decime el número definitivo y lo dejo cargado para la Fase 4.
