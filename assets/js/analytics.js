import { GA_MEASUREMENT_ID } from "./config.js";

// Google Analytics 4 (gratuito). Se activa solo si GA_MEASUREMENT_ID (config.js) tiene un
// ID valido y la web NO corre en localhost. Sin ID, todo esto es inocuo (no carga nada).
// En localhost los eventos se muestran en la consola (console.debug) para poder probarlos.
const local = ["localhost", "127.0.0.1", ""].includes(location.hostname);
const activo = /^G-[A-Z0-9]{6,}$/i.test(GA_MEASUREMENT_ID) && !local;

export const MONEDA_GA = "BOB"; // GA4 pide codigo ISO (la web muestra "Bs")

if (activo) {
  window.dataLayer = window.dataLayer || [];
  window.gtag = function () { window.dataLayer.push(arguments); };
  window.gtag("js", new Date());
  window.gtag("config", GA_MEASUREMENT_ID); // page_view automatico; utm_source se atribuye solo
  const script = document.createElement("script");
  script.async = true;
  script.src = `https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(GA_MEASUREMENT_ID)}`;
  document.head.appendChild(script);
}

/** Nunca lanza error: medir jamas debe romper la web. */
export function track(evento, params = {}) {
  try {
    if (activo) window.gtag("event", evento, params);
    else if (local) console.debug("[analytics]", evento, params);
  } catch {}
}

// Solo el nombre del producto (sin modelo ni marca).
const nombreGA = (nombre) => String(nombre || "").trim();

/** Item GA4 desde un producto del catalogo. item_id = id del producto (igual en vista, carrito y pedido). */
export function itemProducto(producto, { variante = null, colorNombre = "", cantidad = 1 } = {}) {
  return {
    item_id: String(producto.id),
    item_name: nombreGA(producto.nombre),
    item_variant: variante ? `${colorNombre} / ${variante.talla}` : undefined,
    price: variante ? variante.precio : undefined,
    quantity: cantidad,
  };
}

/** Item GA4 desde una linea del carrito. */
export function itemCarrito(i) {
  return {
    item_id: String(i.productoId ?? i.sku),
    item_name: nombreGA(i.nombre),
    item_variant: `${i.colorNombre} / ${i.talla}`,
    price: i.precio,
    quantity: i.cantidad,
  };
}

export const valorCarrito = (carrito) => carrito.reduce((t, i) => t + i.precio * i.cantidad, 0);

// --- Clics en enlaces a WhatsApp, mapa y redes (boton flotante, pie, portada, paginas...). ---
// El boton del carrito se mide aparte (begin_checkout / generate_lead).
// Parametros: link_location (dentro de la pagina), page_path y, en WhatsApp, attendant
// (principal / alternativo: sirve para ver quien atiende mas consultas).
const ubicacionDelEnlace = (a) =>
  a.classList.contains("wa-float") ? "floating" : a.closest("footer") ? "footer" : a.closest("header") ? "header" : "content";

document.addEventListener("click", (e) => {
  const base = (a) => ({ link_location: ubicacionDelEnlace(a), page_path: location.pathname });

  const wa = e.target.closest?.('a[href*="wa.me"]');
  if (wa && !wa.hasAttribute("data-cart-whatsapp")) {
    track("whatsapp_click", { ...base(wa), attendant: wa.dataset.wa || "otro" });
    return;
  }
  const mapa = e.target.closest?.("a[data-map-link]");
  if (mapa) { track("map_click", base(mapa)); return; }
  const red = e.target.closest?.("a[data-social]");
  if (red) track("social_click", { ...base(red), network: red.dataset.social });
});

/** Mide el clic en tarjetas de producto (select_item). Llamar una vez con el catalogo cargado. */
export function medirSeleccionDeProductos(catalogo, listaNombre) {
  document.addEventListener("click", (e) => {
    const tarjeta = e.target.closest?.("a.product-card");
    if (!tarjeta) return;
    const id = Number(new URL(tarjeta.href, location.href).searchParams.get("id"));
    const producto = (catalogo.productos || []).find((p) => p.id === id);
    if (producto) track("select_item", { item_list_name: listaNombre, items: [itemProducto(producto)] });
  });
}
