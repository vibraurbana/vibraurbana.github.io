import { API_BASE_URL } from "./config.js";

// Origen de la visita (utm_source). Se guarda en sessionStorage para que
// sobreviva al paso entre paginas. Este modulo se importa desde header.js,
// asi que corre en todas las paginas.
export function origenVisita() {
  try {
    const param = new URLSearchParams(location.search).get("utm_source");
    if (param) sessionStorage.setItem("vu_origen", param);
    const guardado = sessionStorage.getItem("vu_origen");
    if (guardado) return guardado;
  } catch {}
  if (document.referrer) {
    try { return new URL(document.referrer).hostname; } catch {}
  }
  return "directo";
}
origenVisita();

// Codigo de pedido tipo VU-261016-4K7M (fecha + 4 caracteres al azar).
export function generarCodigoPedido() {
  const d = new Date();
  const dos = (n) => String(n).padStart(2, "0");
  const fecha = String(d.getFullYear()).slice(2) + dos(d.getMonth() + 1) + dos(d.getDate());
  const alfabeto = "ABCDEFGHJKMNPQRSTUVWXYZ23456789"; // sin caracteres que se confunden
  const azar = crypto.getRandomValues(new Uint8Array(4));
  const sufijo = Array.from(azar, (n) => alfabeto[n % alfabeto.length]).join("");
  return `VU-${fecha}-${sufijo}`;
}

// El mismo carrito conserva el mismo codigo (si el cliente pulsa dos veces no
// se duplica el pedido); si el carrito cambia, se genera un codigo nuevo.
export function codigoParaCarrito(carrito) {
  const firma = carrito.map((i) => `${i.sku}x${i.cantidad}`).sort().join("|");
  try {
    const guardado = JSON.parse(sessionStorage.getItem("vu_pedido"));
    if (guardado && guardado.firma === firma) return guardado.codigo;
  } catch {}
  const codigo = generarCodigoPedido();
  try { sessionStorage.setItem("vu_pedido", JSON.stringify({ firma, codigo })); } catch {}
  return codigo;
}

async function postJSON(ruta, cuerpo, ms = 6000) {
  const base = API_BASE_URL.replace(/\/+$/, "");
  if (!base) return { ok: false, omitido: true };
  const control = new AbortController();
  const temporizador = setTimeout(() => control.abort(), ms);
  try {
    const resp = await fetch(`${base}/${ruta}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(cuerpo),
      keepalive: true,
      signal: control.signal,
    });
    const datos = await resp.json().catch(() => ({}));
    return { ok: resp.ok && datos.ok === true, datos };
  } catch {
    return { ok: false };
  } finally {
    clearTimeout(temporizador);
  }
}

// Nunca lanzan error: si el servidor falla, la venta por WhatsApp sigue igual.
export function enviarPedido(carrito, codigo) {
  // Carritos guardados antes de existir variante_id no se pueden registrar:
  // se omiten (WhatsApp funciona igual).
  if (carrito.some((i) => !i.varianteId)) return Promise.resolve({ ok: false, omitido: true });
  return postJSON("pedidos", {
    codigo,
    origen: origenVisita(),
    items: carrito.map((i) => ({ variante_id: i.varianteId, cantidad: i.cantidad })),
    web: "",
  });
}

export function enviarContacto(lead) {
  return postJSON("contactos", lead);
}
