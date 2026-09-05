import { cargarCatalogo, formatearPrecio, precioDesde, tieneStockDisponible, imagenPrincipal } from "./data.js";
import { iniciarHeader } from "./header.js";
import { iconos } from "./icons.js";

const RUTA_PLACEHOLDER = "assets/icons/shoe-placeholder.svg";
const MAX_DESTACADOS = 4;

function tarjetaEstilo(etiqueta) {
  return `
    <a class="style-card" href="catalogo.html?etiqueta=${etiqueta.id}">
      <span class="style-card__media"><img src="${RUTA_PLACEHOLDER}" alt="" aria-hidden="true"></span>
      <span class="style-card__label">${etiqueta.nombre}</span>
    </a>`;
}

function tarjetaProducto(catalogo, producto) {
  const desde = precioDesde(producto);
  const disponible = tieneStockDisponible(producto);
  const imagen = imagenPrincipal(producto) || RUTA_PLACEHOLDER;
  const primeraEtiquetaId = (producto.etiquetas_ids || [])[0];
  const primeraEtiqueta = (catalogo.etiquetas || []).find((e) => e.id === primeraEtiquetaId);

  return `
    <a class="product-card" href="producto.html?id=${producto.id}">
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

async function iniciar() {
  iniciarHeader();

  const estiloGrid = document.querySelector("[data-style-grid]");
  const productoGrid = document.querySelector("[data-destacados-grid]");

  try {
    const catalogo = await cargarCatalogo();

    if (estiloGrid) {
      const visibles = (catalogo.etiquetas || [])
        .filter((e) => e.visible_en_chips)
        .sort((a, b) => (a.orden || 0) - (b.orden || 0));
      estiloGrid.innerHTML = visibles.map(tarjetaEstilo).join("");
    }

    if (productoGrid) {
      const destacados = (catalogo.productos || [])
        .filter((p) => p.activo !== false)
        .slice(0, MAX_DESTACADOS);
      productoGrid.innerHTML = destacados.map((p) => tarjetaProducto(catalogo, p)).join("");
    }
  } catch (err) {
    console.error(err);
    if (productoGrid) {
      productoGrid.innerHTML = `<p style="color:var(--color-text-muted)">No se pudo cargar el catálogo en este momento.</p>`;
    }
  }
}

iniciar();
