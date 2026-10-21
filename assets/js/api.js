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

// ---------------------------------------------------------------------------
// API del sistema (CI4). Protocolo:
//   1) GET  /token   -> token firmado por el servidor.
//   2) POST /pedido  o  /contacto con ese token. El servidor rechaza tokens de
//      menos de 3 segundos (bots) o de mas de 1 hora, por eso se espera si hace
//      falta y se renueva si vencio.
// El CODIGO del pedido (W-XXXXXX) lo genera el servidor, no esta web.
// Nada de esto lanza error: si la API falla, WhatsApp sigue funcionando.
// ---------------------------------------------------------------------------
const MADURO_MS = 3500;            // el servidor exige >= 3 s desde que emitio el token
const VIDA_MS = 50 * 60 * 1000;    // se renueva antes de la hora de vigencia
let tokenActual = null;            // { valor, emitidoEn }

const base = () => API_BASE_URL.replace(/\/+$/, "");

async function fetchJSON(url, opciones = {}, ms = 8000) {
  const control = new AbortController();
  const temporizador = setTimeout(() => control.abort(), ms);
  try {
    const resp = await fetch(url, { ...opciones, signal: control.signal });
    const datos = await resp.json().catch(() => ({}));
    return { resp, datos };
  } finally {
    clearTimeout(temporizador);
  }
}

async function pedirToken() {
  const { resp, datos } = await fetchJSON(`${base()}/token`);
  if (!resp.ok || !datos.ok || !datos.token) throw new Error("token");
  tokenActual = { valor: datos.token, emitidoEn: Date.now() };
}

/** Pide el token por adelantado (al abrir el carrito o enfocar el formulario). */
export function precargarToken() {
  if (!base()) return;
  if (!tokenActual || Date.now() - tokenActual.emitidoEn > VIDA_MS) pedirToken().catch(() => {});
}

async function tokenListo() {
  if (!tokenActual || Date.now() - tokenActual.emitidoEn > VIDA_MS) await pedirToken();
  const espera = MADURO_MS - (Date.now() - tokenActual.emitidoEn);
  if (espera > 0) await new Promise((r) => setTimeout(r, espera));
  return tokenActual.valor;
}

// Devuelve { ok, status, datos } o { ok:false, omitido:true } si no hay API configurada.
async function postJSON(ruta, cuerpo) {
  if (!base()) return { ok: false, omitido: true };
  try {
    for (let intento = 0; intento < 2; intento++) {
      const token = await tokenListo();
      const { resp, datos } = await fetchJSON(`${base()}/${ruta}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...cuerpo, token }),
      });
      // 400 = token vencido o invalido: se pide uno nuevo y se reintenta una vez.
      if (resp.status === 400 && intento === 0) { tokenActual = null; continue; }
      return { ok: resp.ok && datos.ok === true, status: resp.status, datos };
    }
  } catch {}
  return { ok: false };
}

/** Registra el pedido en el sistema. Respuesta: { ok, datos: { codigo, total, items } }. */
export function enviarPedido(carrito) {
  // Carritos guardados antes de existir variante_id no se pueden registrar:
  // se omiten (WhatsApp funciona igual).
  if (carrito.some((i) => !i.varianteId)) return Promise.resolve({ ok: false, omitido: true });
  return postJSON("pedido", {
    origen: origenVisita(),
    hp: "", // campo trampa: un bot lo rellena, una persona nunca
    items: carrito.map((i) => ({ variante_id: i.varianteId, cantidad: i.cantidad })),
  });
}

export function enviarContacto(lead) {
  return postJSON("contacto", lead);
}
