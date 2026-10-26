import { formatearPrecio, precioDesde, imagenPrincipal, resolverImagen, categoriaDeProducto } from "./data.js";

export const RUTA_PLACEHOLDER = "assets/icons/shoe-placeholder.svg";

const MAX_PUNTOS_COLOR = 5;
const MAX_TALLAS = 6;
const ORDEN_LETRAS = ["XXS", "XS", "S", "M", "L", "XL", "XXL", "XXXL"];

/** Tallas con stock (sin repetir), ordenadas: numericas de menor a mayor, o S-M-L-XL. */
function tallasHTML(producto) {
  const set = new Set();
  for (const c of producto.colores || []) for (const v of c.variantes || []) if (Number(v.stock) > 0 && v.talla) set.add(String(v.talla));
  if (!set.size) return "";
  const valor = (t) => (isNaN(parseFloat(t)) ? 1000 + ORDEN_LETRAS.indexOf(t.toUpperCase()) : parseFloat(t));
  const lista = [...set].sort((a, b) => valor(a) - valor(b));
  const visibles = lista.slice(0, MAX_TALLAS).join(" · ");
  const resto = lista.length - MAX_TALLAS;
  return `<span class="product-card__sizes" aria-label="Tallas disponibles">Tallas ${visibles}${resto > 0 ? ` +${resto}` : ""}</span>`;
}

/** Unidades totales (suma de todas las variantes). */
export function stockTotal(producto) {
  let t = 0;
  for (const c of producto.colores || []) for (const v of c.variantes || []) t += Math.max(0, Number(v.stock) || 0);
  return t;
}

/** "agotado" | "ultimas" (1-3 unidades) | "ok". Nunca se muestra el numero exacto. */
export function estadoStock(producto) {
  const t = stockTotal(producto);
  return t === 0 ? "agotado" : t <= 3 ? "ultimas" : "ok";
}

/** Precio unico ("Bs 130") o "Desde Bs 130" si las variantes tienen precios distintos. */
function precioHTML(catalogo, producto) {
  const precios = [];
  for (const c of producto.colores || []) for (const v of c.variantes || []) precios.push(Number(v.precio));
  if (!precios.length) return "Consultar";
  const min = Math.min(...precios);
  const moneda = catalogo.meta?.moneda;
  return Math.max(...precios) === min
    ? formatearPrecio(min, moneda)
    : `<span class="product-card__price-from">Desde</span>${formatearPrecio(min, moneda)}`;
}

function puntosColorHTML(catalogo, producto) {
  const hexPorId = new Map((catalogo.colores || []).map((c) => [c.id, c]));
  const colores = (producto.colores || []).map((c) => hexPorId.get(c.color_id)).filter(Boolean);
  if (colores.length < 2) return "";
  const visibles = colores.slice(0, MAX_PUNTOS_COLOR)
    .map((c) => `<i style="background:${c.codigo_hex}" title="${c.nombre}"></i>`).join("");
  const resto = colores.length - MAX_PUNTOS_COLOR;
  return `<span class="product-card__colors" aria-label="${colores.length} colores">${visibles}${resto > 0 ? `<em>+${resto}</em>` : ""}</span>`;
}

export function tarjetaProductoHTML(catalogo, producto) {
  const rutaImagen = imagenPrincipal(producto);
  const imagen = rutaImagen ? resolverImagen(rutaImagen) : RUTA_PLACEHOLDER;
  const primeraEtiquetaId = (producto.etiquetas_ids || [])[0];
  const primeraEtiqueta = (catalogo.etiquetas || []).find((e) => e.id === primeraEtiquetaId);
  const categoria = categoriaDeProducto(catalogo, producto);
  const claseCategoria = categoria?.nombre === "Zapato" ? " product-card--shoe" : "";
  const estado = estadoStock(producto);
  const insignia = estado === "agotado" ? `<span class="product-card__stock product-card__stock--agotado">Agotado</span>`
    : estado === "ultimas" ? `<span class="product-card__stock product-card__stock--ultimas">Últimas unidades</span>` : "";

  return `
    <a class="product-card${claseCategoria}${estado === "agotado" ? " is-agotado" : ""}" href="producto.html?id=${producto.id}">
      <span class="product-card__media">
        ${primeraEtiqueta ? `<span class="product-card__tag">${primeraEtiqueta.nombre}</span>` : ""}
        ${insignia}
        <img src="${imagen}" alt="${producto.nombre}" loading="lazy" decoding="async"
             onerror="this.src='${RUTA_PLACEHOLDER}'">
      </span>
      <span class="product-card__body">
        <span class="product-card__name">${producto.nombre}</span>
        <span class="product-card__price">${precioHTML(catalogo, producto)}</span>
        ${puntosColorHTML(catalogo, producto)}
        ${tallasHTML(producto)}
      </span>
    </a>`;
}
