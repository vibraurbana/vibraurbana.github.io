import { CATALOGO_BASE_URL } from "./config.js";
import { fijarNumerosWhatsApp } from "./whatsapp.js";

// Único punto de acceso a los datos del catálogo. En modo local lee un
// JSON mock; en modo remoto (ver config.js) apunta al catalogo.json que
// genera el sistema CI4 en su propio servidor -- misma forma de datos,
// solo cambia de dónde se leen.

const RUTA_CATALOGO = CATALOGO_BASE_URL
  ? `${CATALOGO_BASE_URL.replace(/\/$/, "")}/catalogo.json`
  : "data/catalogo.json";

let catalogoCache = null;
let catalogoPromesa = null;

// Una sola descarga aunque varias piezas (menu, pagina) pidan el catalogo a la vez.
export function cargarCatalogo() {
  if (catalogoCache) return Promise.resolve(catalogoCache);
  if (!catalogoPromesa) {
    catalogoPromesa = descargarCatalogo().catch((err) => { catalogoPromesa = null; throw err; });
  }
  return catalogoPromesa;
}

// Fotos ya copiadas al propio sitio (las genera tools/espejo_imagenes.py al publicar):
// { "uploads/productos/x.jpg": { g: "<foto grande>", m: "<foto mediana para tarjetas>" } }
// Si la foto esta en esa lista se usa la copia local (no gasta el servidor del sistema); si no, la del servidor.
let fotosEspejo = new Map();
async function cargarEspejo() {
  if (!CATALOGO_BASE_URL) return;
  try {
    const r = await fetch("espejo.json", { cache: "no-cache" });
    if (r.ok) {
      const j = await r.json();
      if (j && j.v === 2 && j.imagenes) fotosEspejo = new Map(Object.entries(j.imagenes));
    }
  } catch (_) { /* sin espejo: todo sale del servidor, como antes */ }
}

// ── Promocion temporal (promo.json) ─────────────────────────────────────────────
// Los productos con la etiqueta `etiqueta_id` pasan a `precio` hasta la fecha `hasta` (inclusive).
// No toca el sistema: solo cambia lo que se muestra y se manda por WhatsApp. Al vencer la fecha
// (o poner "activa": false) la web vuelve sola a los precios del sistema.
let promoVigente = null;

export function promoActiva() {
  return promoVigente;
}

async function cargarPromo() {
  try {
    const r = await fetch("promo.json", { cache: "no-cache" });
    if (!r.ok) return null;
    const p = await r.json();
    const fin = new Date(`${p.hasta}T23:59:59`);
    if (!p.activa || !(Number(p.precio) > 0) || !p.etiqueta_id || isNaN(fin) || new Date() > fin) return null;
    return { ...p, precio: Number(p.precio), etiqueta_id: Number(p.etiqueta_id) };
  } catch {
    return null;
  }
}

function aplicarPromo(catalogo, promo) {
  if (!promo) return;
  for (const p of catalogo.productos || []) {
    if (!(p.etiquetas_ids || []).includes(promo.etiqueta_id)) continue;
    for (const c of p.colores || []) {
      for (const v of c.variantes || []) {
        const normal = Number(v.precio);
        if (normal > promo.precio) {
          v.precio_antes = normal;
          v.precio = promo.precio;
          p.en_oferta = true;
        }
      }
    }
  }
  const css = document.createElement("style");
  css.textContent = `
    .precio-antes { text-decoration: line-through; color: var(--color-text-muted, #777); font-weight: 600; font-size: .8em; margin-right: 6px; }
    .precio-oferta { color: #d62828; }
    .promo-pill { display: inline-block; background: #d62828; color: #fff; font-size: .65rem; font-weight: 800; letter-spacing: .04em; text-transform: uppercase; padding: 2px 8px; border-radius: 999px; margin-left: 6px; vertical-align: middle; }
    .promo-banner { background: #d62828; color: #fff; border-radius: 14px; padding: 14px 18px; margin: 0 0 16px; display: flex; flex-direction: column; gap: 2px; }
    .promo-banner strong { font-size: 1.05rem; letter-spacing: .02em; }
    .promo-banner span { font-size: .9rem; opacity: .95; }`;
  document.head.appendChild(css);
}

/** Precio "antes" (sin promocion) de un conjunto de variantes, o null si no hay oferta. */
export function precioAntesMin(variantes) {
  const antes = (variantes || []).map((v) => Number(v.precio_antes)).filter((n) => n > 0);
  return antes.length ? Math.min(...antes) : null;
}

async function descargarCatalogo() {
  const promoLista = cargarPromo();
  const espejoListo = cargarEspejo();
  const res = await fetch(RUTA_CATALOGO);
  if (!res.ok) {
    throw new Error("No se pudo cargar el catalogo (" + res.status + ")");
  }
  catalogoCache = await res.json();
  // Campo opcional del sistema: visible_web=false (o 0) oculta el producto de la web.
  // Si el sistema aun no lo envia, se muestran todos los activos como hasta ahora.
  catalogoCache.productos = (catalogoCache.productos || []).filter(
    (p) => p.activo !== false && p.visible_web !== false && p.visible_web !== 0 && p.visible_web !== "0"
  );
  fijarNumerosWhatsApp(catalogoCache.meta); // los numeros los define el sistema
  promoVigente = await promoLista;
  aplicarPromo(catalogoCache, promoVigente);
  await espejoListo;
  return catalogoCache;
}

/**
 * Estante LIVE publicado por el sistema (catalogo.estante), con cada numero resuelto a su
 * producto. Devuelve null si no hay estante o ningun modelo sigue visible en la web.
 * Forma: { titulo, fecha, items: [{ numero, producto, colorId }] } ordenado por numero.
 */
export function estanteActivo(catalogo) {
  const e = catalogo?.estante;
  if (!e || !Array.isArray(e.items)) return null;
  const porId = new Map((catalogo.productos || []).map((p) => [p.id, p]));
  const items = e.items
    .map((i) => ({ numero: Number(i.numero), producto: porId.get(i.producto_id), colorId: i.color_id ?? null }))
    .filter((i) => i.producto && i.numero > 0)
    .sort((a, b) => a.numero - b.numero);
  return items.length ? { titulo: e.titulo || "Estante virtual", fecha: e.fecha || null, items } : null;
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
export function resolverImagen(ruta, tipo = "g") {
  if (!ruta) return ruta;
  if (/^https?:\/\//i.test(ruta)) return ruta;
  if (!CATALOGO_BASE_URL) return ruta;
  const limpia = ruta.replace(/^\//, "");
  const copia = fotosEspejo.get(limpia);
  if (copia && copia[tipo]) return copia[tipo];                       // copia local (GitHub Pages)
  return `${CATALOGO_BASE_URL.replace(/\/$/, "")}/${limpia}`;        // la del servidor del sistema
}

/** Version liviana (tarjetas, listados, miniaturas). Si aun no esta copiada, es la normal. */
export function resolverImagenTarjeta(ruta) {
  return resolverImagen(ruta, "m");
}

/** Foto original en el servidor del sistema: respaldo si la copia local fallara. "" en modo local. */
export function respaldoImagen(ruta) {
  if (!ruta || !CATALOGO_BASE_URL || /^https?:\/\//i.test(ruta)) return "";
  return `${CATALOGO_BASE_URL.replace(/\/$/, "")}/${ruta.replace(/^\//, "")}`;
}

/** Atributo onerror: primero el respaldo (si es otra URL), luego el icono por defecto. */
export function onerrorImagen(ruta, placeholder) {
  const r = respaldoImagen(ruta);
  return r
    ? `if(this.dataset.r!=='1'){this.dataset.r='1';this.src='${r}'}else{this.src='${placeholder}'}`
    : `this.src='${placeholder}'`;
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
