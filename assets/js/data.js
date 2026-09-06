import { CATALOGO_BASE_URL } from "./config.js";

// Único punto de acceso a los datos del catálogo. En modo local lee un
// JSON mock; en modo remoto (ver config.js) apunta al catalogo.json que
// genera el sistema CI4 en su propio servidor -- misma forma de datos,
// solo cambia de dónde se leen.

const RUTA_CATALOGO = CATALOGO_BASE_URL
  ? `${CATALOGO_BASE_URL.replace(/\/$/, "")}/catalogo.json`
  : "data/catalogo.json";

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

/**
 * Resuelve una ruta de imagen tal como viene en catalogo.json.
 * - Modo local: la deja igual (ruta relativa a este proyecto).
 * - Modo remoto: la antepone con CATALOGO_BASE_URL para que apunte a
 *   uploads/ del servidor CI4 en vez de a este repo.
 * - Si ya viene una URL absoluta (http/https), no la toca.
 * No usar esto con RUTA_PLACEHOLDER (assets/icons/...): ese es un
 * recurso propio de este proyecto, no un dato del catálogo.
 */
export function resolverImagen(ruta) {
  if (!ruta) return ruta;
  if (/^https?:\/\//i.test(ruta)) return ruta;
  if (!CATALOGO_BASE_URL) return ruta;
  return `${CATALOGO_BASE_URL.replace(/\/$/, "")}/${ruta.replace(/^\//, "")}`;
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
