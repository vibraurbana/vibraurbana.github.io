// Único punto de acceso a los datos del catálogo. Hoy lee un JSON mock;
// en la Fase 7 esto seguirá apuntando a "data/catalogo.json", solo que
// ese archivo lo generará el sistema CI4 en vez de estar escrito a mano.

const RUTA_CATALOGO = "data/catalogo.json";

let catalogoCache = null;

export async function cargarCatalogo() {
  if (catalogoCache) return catalogoCache;

  const res = await fetch(RUTA_CATALOGO);
  if (!res.ok) {
    throw new Error("No se pudo cargar el catalogo (" + res.status + ")");
  }
  catalogoCache = await res.json();
  return catalogoCache;
}

export function formatearPrecio(valor, moneda) {
  const monto = Number(valor).toLocaleString("es-BO", { maximumFractionDigits: 0 });
  return (moneda || "Bs") + " " + monto;
}

/** Menor precio entre todas las variantes activas del producto. */
export function precioDesde(producto) {
  let min = null;
  for (const color of producto.colores || []) {
    for (const variante of color.variantes || []) {
      if (min === null || variante.precio < min) min = variante.precio;
    }
  }
  return min;
}

/** true si al menos una variante tiene stock > 0. */
export function tieneStockDisponible(producto) {
  return (producto.colores || []).some((color) =>
    (color.variantes || []).some((v) => v.stock > 0)
  );
}

/** Primera imagen disponible del producto (para la card del listado). */
export function imagenPrincipal(producto) {
  const primerColor = (producto.colores || [])[0];
  return primerColor ? primerColor.imagen_principal : null;
}

export function etiquetasDeProducto(catalogo, producto) {
  const ids = new Set(producto.etiquetas_ids || []);
  return (catalogo.etiquetas || []).filter((e) => ids.has(e.id));
}

export function categoriaDeProducto(catalogo, producto) {
  return (catalogo.categorias || []).find((c) => c.id === producto.categoria_id) || null;
}
