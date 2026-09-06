import { cargarCatalogo } from "./data.js";
import { iniciarHeader } from "./header.js";
import { tarjetaProductoHTML, RUTA_PLACEHOLDER } from "./product-card.js";

const MAX_DESTACADOS = 4;

function tarjetaEstilo(etiqueta) {
  return `
    <a class="style-card" href="catalogo.html?etiqueta=${etiqueta.id}">
      <span class="style-card__media"><img src="${RUTA_PLACEHOLDER}" alt="" aria-hidden="true"></span>
      <span class="style-card__label">${etiqueta.nombre}</span>
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
      productoGrid.innerHTML = destacados.map((p) => tarjetaProductoHTML(catalogo, p)).join("");
    }
  } catch (err) {
    console.error(err);
    if (productoGrid) {
      productoGrid.innerHTML = `<p style="color:var(--color-text-muted)">No se pudo cargar el catálogo en este momento.</p>`;
    }
  }
}

iniciar();
