import { formatearPrecio, precioDesde, tieneStockDisponible, imagenPrincipal, resolverImagen, categoriaDeProducto } from "./data.js";
import { iconos } from "./icons.js";

export const RUTA_PLACEHOLDER = "assets/icons/shoe-placeholder.svg";

export function tarjetaProductoHTML(catalogo, producto) {
  const desde = precioDesde(producto);
  const disponible = tieneStockDisponible(producto);
  const rutaImagen = imagenPrincipal(producto);
  const imagen = rutaImagen ? resolverImagen(rutaImagen) : RUTA_PLACEHOLDER;
  const primeraEtiquetaId = (producto.etiquetas_ids || [])[0];
  const primeraEtiqueta = (catalogo.etiquetas || []).find((e) => e.id === primeraEtiquetaId);
  const categoria = categoriaDeProducto(catalogo, producto);
  const claseCategoria = categoria?.nombre === "Zapato" ? " product-card--shoe" : "";

  return `
    <a class="product-card${claseCategoria}" href="producto.html?id=${producto.id}">
      <span class="product-card__media">
        ${primeraEtiqueta ? `<span class="product-card__tag">${primeraEtiqueta.nombre}</span>` : ""}
        <button class="product-card__fav" type="button" aria-label="Guardar en favoritos" onclick="event.preventDefault()">${iconos.corazon}</button>
        <img src="${imagen}" alt="${producto.nombre}" loading="lazy"
             onerror="this.src='${RUTA_PLACEHOLDER}'">
      </span>
      <span class="product-card__body">
        <span class="product-card__brand">${producto.marca || ""}</span>
        <span class="product-card__name">${producto.nombre}</span>
        <span class="product-card__price">
          ${desde !== null ? `<span class="product-card__price-from">Desde</span>${formatearPrecio(desde, catalogo.meta.moneda)}` : "Consultar"}
        </span>
        ${!disponible ? `<span class="product-card__status">Agotado por ahora</span>` : ""}
      </span>
    </a>`;
}
