import { cargarCatalogo, resolverImagen } from "./data.js";
import { iniciarHeader } from "./header.js";
import { tarjetaProductoHTML, RUTA_PLACEHOLDER } from "./product-card.js";
import { skeletonCards, skeletonStyleCards } from "./skeleton.js";

const MAX_DESTACADOS = 4;

function tarjetaEstilo(etiqueta) {
  const nombreArchivo = etiqueta.nombre
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/\s+/g, "_");
  const imagenEstilo = `assets/img/${nombreArchivo}.png`;
  const productoFallback = etiqueta.imagen_fallback || RUTA_PLACEHOLDER;

  return `
    <a class="style-card" href="catalogo.html?etiqueta=${etiqueta.id}" aria-label="Ver ${etiqueta.nombre}">
      <span class="style-card__media">
        <img src="${imagenEstilo}" alt="${etiqueta.nombre}" data-fallback="${productoFallback}">
        <span class="style-card__caption"><strong>${etiqueta.nombre}</strong><span aria-hidden="true">→</span></span>
      </span>
    </a>`;
}

async function iniciar() {
  iniciarHeader();

  const estiloGrid = document.querySelector("[data-style-grid]");
  const productoGrid = document.querySelector("[data-destacados-grid]");

  if (estiloGrid) estiloGrid.innerHTML = skeletonStyleCards(5);
  if (productoGrid) productoGrid.innerHTML = skeletonCards(MAX_DESTACADOS);

  try {
    const catalogo = await cargarCatalogo();

    if (estiloGrid) {
      const visibles = (catalogo.etiquetas || [])
        .filter((e) => e.visible_en_chips)
        .sort((a, b) => (a.orden || 0) - (b.orden || 0));
      const productos = (catalogo.productos || []).filter((p) => p.activo !== false);
      const tarjetas = visibles.map((etiqueta) => {
        const producto = productos.find((p) => (p.etiquetas_ids || []).includes(etiqueta.id)) || productos.find((p) => {
          const nombre = (p.nombre || "").toLowerCase();
          const termino = etiqueta.nombre.toLowerCase().split(" ")[0];
          return nombre.includes(termino);
        });
        return tarjetaEstilo({
          ...etiqueta,
          imagen_fallback: producto?.colores?.[0]?.imagen_principal
            ? resolverImagen(producto.colores[0].imagen_principal)
            : RUTA_PLACEHOLDER,
        });
      });
      estiloGrid.innerHTML = tarjetas.join("");
      estiloGrid.querySelectorAll("img[data-fallback]").forEach((img) => {
        img.addEventListener("error", () => {
          if (img.src.endsWith(img.dataset.fallback)) return;
          img.src = img.dataset.fallback;
        }, { once: true });
      });
      estiloGrid.classList.add("fade-in");
    }

    if (productoGrid) {
      const destacados = (catalogo.productos || [])
        .filter((p) => p.activo !== false)
        .slice(0, MAX_DESTACADOS);
      productoGrid.innerHTML = destacados.map((p) => tarjetaProductoHTML(catalogo, p)).join("");
      productoGrid.classList.add("fade-in");
    }
  } catch (err) {
    console.error(err);
    if (productoGrid) {
      productoGrid.innerHTML = `<p style="color:var(--color-text-muted)">No se pudo cargar el catálogo en este momento.</p>`;
    }
  }
}

iniciar();
