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
  render-catalogo.js     Pinta el Catálogo: filtros, búsqueda, orden
  render-producto.js      Pinta el detalle de producto: galería, color,
                          talla, precio/stock por variante, agregar al carrito
  render-carrito.js       Pinta la página de carrito: items, cantidad,
                          totales, link de WhatsApp
  whatsapp.js             Arma el texto del pedido + el link https://wa.me/...
  product-card.js        Builder de la card de producto (compartido por
                          Home y Catálogo, para no duplicar el HTML)
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
| 2 | Catálogo: grid, chips de etiquetas, buscador, orden, filtro color/talla | ✅ Entregado |
| 3 | Detalle de producto: galería por color, selector color/talla, precio y stock por variante | ✅ Entregado |
| 4 | Carrito (localStorage) + botón "Consultar por WhatsApp" con mensaje autogenerado | ✅ Entregado |
| 5 | Pulido responsive, estados vacío/agotado, microanimaciones | ✅ Entregado |
| 6 | Esquema final de `catalogo.json` + checklist de exportación | Próximo |
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

## Notas de la Fase 2 (Catálogo)

- El buscador filtra por `nombre`, `marca`, `modelo` y `codigo` a medida que
  escribís (sin distinguir mayúsculas ni acentos).
- Los chips de estilo salen de `catalogo.etiquetas` (mismas que en la Home),
  selección única — igual criterio que ya usás en el chip de Inventario del
  CI4.
- "Color" y "Talla" son popovers nativos (`<details>`) armados dinámicamente
  con los colores/tallas que **realmente existen** en `catalogo.json` — si
  mañana agregás un color nuevo en CI4, aparece solo, no hay nada
  hardcodeado.
- "Ordenar" tiene 4 opciones: Destacados (orden del JSON), Nombre A-Z,
  Precio menor→mayor y mayor→menor. No hay "más vendidos" todavía porque el
  catálogo estático no tiene datos de ventas — eso viviría del lado del CI4
  si en algún momento se quiere exportar ese dato también.
- El filtro por talla considera la talla como disponible en el catálogo
  aunque esa variante puntual esté agotada (mismo criterio del proyecto:
  "no ocultar, mostrar el estado") — el detalle de agotado/disponible por
  talla se resuelve en la Fase 3, dentro de la página de producto.
- Estado vacío: si ningún producto matchea los filtros, se muestra un
  mensaje con botón para limpiar todo de una.

## Notas de la Fase 3 (Detalle de producto)

- **Selección por defecto:** al entrar, se preselecciona automáticamente el
  primer color con stock disponible, y dentro de ese color la primera talla
  con stock — así el botón "Agregar al carrito" ya queda usable sin obligar
  a un clic extra. Si el producto está 100% agotado, no se preselecciona
  ninguna talla y el botón queda deshabilitado.
- **Tallas agotadas:** se muestran siempre (tachadas, sin poder
  seleccionarse) — nunca se ocultan, tal como pediste. Cambiar de color
  recalcula qué tallas están disponibles para ESE color específico.
- **Precio y stock:** ambos pertenecen a la variante (color+talla), no al
  producto — por eso solo se ven "en firme" cuando hay una talla
  seleccionada; antes de eso se muestra "Desde Bs X".
- **Disponibilidad:** 3 estados — "En stock" (>3 unidades), "Últimas
  unidades" (1-3) y "Agotado" — nunca el número exacto de unidades, según
  lo que pediste en el punto 20 del brief.
- **Agregar al carrito ya funciona de verdad:** guarda en `localStorage`
  identificado por SKU (no por producto), y si volvés a agregar el mismo
  SKU, suma cantidad en vez de duplicar la línea. El contador del carrito
  en el header se actualiza al toque. La Fase 4 solo tiene que **leer** ese
  mismo localStorage para mostrar la pantalla de carrito — no hay que tocar
  esta lógica de nuevo.
- La galería cambia sus fotos e índice de miniaturas al cambiar de color,
  usando las imágenes de `producto.colores[].imagenes` — mismo criterio que
  tu tabla `producto_imagenes` (imágenes por producto + color).

## Modo remoto — leer directo del CI4 (sin copiar archivos)

En vez del plan original de "exportar y subir archivos a mano", este
catálogo-web puede leer `catalogo.json` **directo del servidor donde vive
tu CI4**, incluyendo las imágenes de su `uploads/` tal cual están — sin
duplicar nada. Se activa con un solo valor en `assets/js/config.js`:

```js
export const CATALOGO_BASE_URL = "https://tu-dominio-o-ip.com"; // sin barra final
```

Vacío (`""`) = sigue en modo local con el JSON mock de este repo (lo que
usamos en las Fases 1-5). Con un valor, `data.js` lee
`<CATALOGO_BASE_URL>/catalogo.json` y arma cada imagen como
`<CATALOGO_BASE_URL>/<ruta del json>` automáticamente — no hay que tocar
nada más en el resto del código.

### Checklist de factibilidad — correr ANTES de poner la URL real

Estas son pruebas contra **tu** servidor CI4, para confirmar que el modo
remoto realmente va a funcionar antes de depender de él. Reemplazá
`https://tu-dominio.com` por tu URL real en cada comando.

**1. Certificado HTTPS válido**
```bash
curl -vI https://tu-dominio.com/catalogo.json 2>&1 | grep -i "SSL certificate\|subject\|expire"
```
o simplemente abrí esa URL en el navegador: si el candado sale roto/tachado,
o Chrome avisa "no seguro", el modo remoto no va a funcionar (los
navegadores bloquean `fetch` a HTTPS con certificado inválido, sin
excepción posible desde el código).

**2. `catalogo.json` responde y tiene CORS**
```bash
curl -I https://tu-dominio.com/catalogo.json
```
Tiene que devolver `200 OK` y, en las cabeceras, algo como
`Access-Control-Allow-Origin: *` (o al menos el dominio de GitHub Pages).
Prueba más directa, pegá esto en la consola del navegador (F12) estando en
**cualquier** página, incluso `localhost`:
```js
fetch('https://tu-dominio.com/catalogo.json').then(r => r.json()).then(console.log).catch(console.error)
```
Si sale un error mencionando **"CORS policy"** o **"blocked by CORS"**,
falta ese header del lado del servidor — es la causa más común de que esto
falle en la práctica, y el navegador no explica cómo arreglarlo desde acá.

**3. `uploads/` accesible sin sesión/login**
```bash
curl -I https://tu-dominio.com/uploads/productos/101/negro/1.jpg
```
(usá una ruta real que exista en tu servidor). Tiene que dar `200` con un
`Content-Type: image/...`. Si da `302` (redirección a login), `403`
(prohibido) o `404` con una ruta que sabés que existe, significa que esas
imágenes hoy se sirven a través de un controlador PHP con sesión/permisos,
no como archivos estáticos — y en ese caso hay que exponer esa carpeta
aparte (o crear una ruta pública específica solo para lectura).
También podés simplemente abrir esa URL de imagen en una pestaña de
incógnito (sin haber iniciado sesión en el CI4): si la ves, está bien
expuesta.

**4. Cache-Control razonable**
```bash
curl -I https://tu-dominio.com/catalogo.json
```
Mirá el header `Cache-Control`. Si no existe, o dice algo como `max-age`
de varios días, el navegador de un cliente puede quedarse con una versión
vieja del catálogo un buen rato después de que regeneres el JSON. Un
`max-age=300` (5 min) o `no-cache` es razonable para este archivo puntual
(no hace falta tocar el resto de la configuración del servidor).

**5. Prueba de punta a punta (la que realmente confirma todo)**
Con los 4 puntos anteriores en verde, poné la URL real en `config.js`,
corré el catalogo-web local (`python3 -m http.server 8080`) y abrí
`catalogo.html` con la consola del navegador abierta. Si carga el grid con
tus productos reales y las fotos reales, andás. Si algo falla, el error
en consola va a decir exactamente cuál de los 4 puntos de arriba es.

### Nota sobre carritos ya guardados

Si venís probando el carrito desde las Fases 3-4 con el modo local, esas
líneas del carrito tienen rutas de imagen del JSON mock guardadas tal
cual. Al pasar a modo remoto, lo más prolijo es limpiar ese carrito de
prueba (`localStorage.clear()` en la consola del navegador) para que las
próximas líneas ya guarden la URL resuelta correctamente.

## Notas de la Fase 4 (Carrito + WhatsApp)

- El carrito lee directo de `localStorage` (lo que ya guarda la Fase 3) —
  no hay nada nuevo que sincronizar, esta fase solo lo **muestra y edita**.
- **Editar cantidad** respeta el stock real: el botón "+" se frena si ya
  llegaste al stock disponible de ese SKU en `catalogo.json` (búsqueda en
  vivo, no un número guardado de memoria que se puede desactualizar).
- **Quitar un item** es inmediato, sin confirmación — carrito de bajo
  compromiso, coherente con "no quiero un sistema complejo de pedidos".
- **Mensaje de WhatsApp:** armado exactamente con el formato de tu brief
  (sección 23) — un bloque por producto con color/talla/cantidad/precio
  unitario/subtotal, y el total al final. Se abre en pestaña nueva con
  `https://wa.me/<numero>?text=<mensaje>`.
- El número de WhatsApp sigue siendo el placeholder de `meta.whatsapp_numero`
  en `catalogo.json` — cambialo ahí (un solo lugar) cuando tengas el
  definitivo, y automáticamente lo toman tanto el carrito como el footer.
- Estado vacío: ícono de carrito + "Tu carrito está vacío" + botón directo
  a "Ver zapatos", igual criterio visual que el resto de los estados vacíos
  del sitio.

## Notas de la Fase 5 (Pulido responsive + microanimaciones)

- **Breakpoint de tablet (640–1023px)** en las 4 páginas: grillas de 3
  columnas en vez de saltar directo de 2 (mobile) a 4 (desktop), y
  `producto.html`/`carrito.html` se centran con un ancho máximo en vez de
  estirarse hasta el borde.
- **Skeletons de carga** — Home y Catálogo muestran placeholders
  pulsantes (mismo tamaño que las cards/chips reales) mientras
  `catalogo.json` está en camino, en vez de una pantalla en blanco. Con el
  JSON local es casi instantáneo, pero en GitHub Pages con una conexión
  de TikTok promedio sí se va a notar.
- **Microanimaciones agregadas:**
  - Product card: se levanta un poco y la foto hace zoom sutil al pasar
    el mouse (solo en dispositivos con hover real, no interfiere en touch).
  - Galería de producto: fade entre fotos al cambiar de color o miniatura,
    en vez de un salto brusco.
  - Swatches de color y chips de talla: feedback de "presionado" al
    tocar, y el color activo se agranda levemente.
  - Ícono del carrito: "bump" (rebote) cada vez que sube la cantidad —
    agregar producto, sumar unidades en el carrito.
  - Item del carrito: se desliza y se achica antes de desaparecer al
    quitarlo, en vez de saltar de golpe.
  - Popovers de Color/Talla en el catálogo: entran con un fade + slide
    corto en vez de aparecer de golpe.
- **`prefers-reduced-motion` respetado de verdad** — agregué una regla
  global que apaga (casi) todas las transiciones/animaciones del sitio si
  el usuario tiene esa preferencia activada en su sistema, no solo las que
  usan la variable `--duration`.
- No hay nada "roto" que arreglar de estados vacío/agotado — ya estaban
  bien desde las Fases 2-4; esta fase los dejó visualmente más pulidos
  (mismo lenguaje visual, sin inconsistencias entre páginas) en vez de
  rehacerlos.
