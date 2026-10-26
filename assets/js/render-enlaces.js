import { iniciarHeader } from "./header.js";
import { cargarCatalogo, formatearPrecio } from "./data.js";
import { SITIO } from "./config.js";
import { rutaProducto } from "./slug.js";

iniciarHeader();
const $ = (s) => document.querySelector(s);
const els = {
  destino: $("[data-en-destino]"), bloque: $("[data-en-bloque-producto]"), buscar: $("[data-en-buscar]"),
  producto: $("[data-en-producto]"), red: $("[data-en-red]"), campana: $("[data-en-campana]"),
  url: $("[data-en-url]"), texto: $("[data-en-texto]"), abrir: $("[data-en-abrir]"),
};
let productos = [];

const slugCampana = (t) => t.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "")
  .replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 40);

const stockDe = (p) => (p.colores || []).flatMap((c) => c.variantes || []);
function tallasTxt(p) {
  const ts = [...new Set(stockDe(p).filter((v) => Number(v.stock) > 0 && v.talla).map((v) => String(v.talla)))];
  const num = ts.every((t) => !isNaN(parseFloat(t)));
  if (!ts.length) return "";
  if (num) { ts.sort((a, b) => a - b); return ts.length === 1 ? ts[0] : `${ts[0]}–${ts[ts.length - 1]}`; }
  return ts.join(" ");
}
const precioMin = (p) => Math.min(...stockDe(p).map((v) => Number(v.precio)).filter((n) => !isNaN(n)));

function pintarLista() {
  const q = els.buscar.value.trim().toLowerCase();
  const prev = els.producto.value;
  els.producto.innerHTML = productos
    .filter((p) => !q || p.nombre.toLowerCase().includes(q))
    .map((p) => `<option value="${p.id}">${p.nombre}</option>`).join("");
  if (prev && els.producto.querySelector(`option[value="${prev}"]`)) els.producto.value = prev;
  else if (els.producto.options.length) els.producto.selectedIndex = 0;
}

function generar() {
  const [fuente, medio] = els.red.value.split("|");
  const params = new URLSearchParams({ utm_source: fuente, utm_medium: medio });
  const camp = slugCampana(els.campana.value);
  if (camp) params.set("utm_campaign", camp);

  let ruta = "", texto = "";
  const dest = els.destino.value;
  els.bloque.hidden = dest !== "producto";
  if (dest === "inicio") { ruta = ""; texto = "VIBRA URBANA — moda urbana y casual\nMira el catálogo 👇"; }
  else if (dest === "catalogo") { ruta = "catalogo.html"; texto = "Mira todo el catálogo de VIBRA URBANA 👇"; }
  else {
    const p = productos.find((x) => String(x.id) === els.producto.value);
    if (!p) { els.url.value = ""; els.texto.textContent = ""; return; }
    ruta = rutaProducto(p.id, p.nombre);
    const precio = isFinite(precioMin(p)) ? ` · ${formatearPrecio(precioMin(p))}` : "";
    const tallas = tallasTxt(p) ? `\nTallas ${tallasTxt(p)}` : "";
    texto = `${p.nombre}${precio}${tallas}\nVer producto 👇`;
  }
  const url = `${SITIO}/${ruta}?${params}`;
  els.url.value = url;
  els.abrir.href = url;
  els.texto.dataset.url = url;
  els.texto.textContent = `${texto}\n${url}`;
}

async function copiar(valor, boton) {
  try { await navigator.clipboard.writeText(valor); } catch { window.prompt("Copia:", valor); return; }
  const t = boton.textContent; boton.textContent = "¡Copiado!"; setTimeout(() => (boton.textContent = t), 1400);
}
$("[data-en-copiar-url]").addEventListener("click", (e) => copiar(els.url.value, e.currentTarget));
$("[data-en-copiar-texto]").addEventListener("click", (e) => copiar(els.texto.textContent, e.currentTarget));
["change", "input"].forEach((ev) => [els.destino, els.producto, els.red, els.campana].forEach((el) => el.addEventListener(ev, generar)));
els.buscar.addEventListener("input", () => { pintarLista(); generar(); });

cargarCatalogo().then((cat) => {
  productos = (cat.productos || []).slice().sort((a, b) => a.nombre.localeCompare(b.nombre, "es"));
  pintarLista(); generar();
}).catch(() => { els.texto.textContent = "No se pudo cargar el catálogo."; });
