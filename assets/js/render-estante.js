import { cargarCatalogo, estanteActivo, resolverImagen, categoriaDeProducto } from "./data.js";
import { iniciarHeader } from "./header.js";
import { numeroEstanteHTML } from "./estante-num.js";
import { RUTA_PLACEHOLDER, idsIndicadores } from "./product-card.js";
import { track } from "./analytics.js";

// Pagina "Estante Virtual": los modelos numerados del LIVE (catalogo.estante), con la foto y el stock
// actuales del catalogo. Cada tarjeta abre la ficha del producto en el color que se ve en pantalla.

iniciarHeader();

const $ = (s) => document.querySelector(s);
const esc = (t) => String(t ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

let estante = null;
let catalogo = null;
const filtro = { etiquetaId: null, orden: "numero" };

/** Foto, precio y stock del modelo tal como se ve en el estante: el color elegido, o el primero con stock. */
function vistaDeItem(item) {
  const p = item.producto;
  const colores = p.colores || [];
  const color =
    colores.find((c) => c.color_id === item.colorId) ||
    colores.find((c) => (c.variantes || []).some((v) => v.stock > 0)) ||
    colores[0] || null;
  const variantes = color?.variantes || [];
  const conStock = variantes.filter((v) => Number(v.stock) > 0);
  const precios = (conStock.length ? conStock : variantes).map((v) => Number(v.precio));
  return {
    color,
    precio: precios.length ? Math.min(...precios) : Infinity,
    agotado: conStock.length === 0,
    imagen: color?.imagen_principal ? resolverImagen(color.imagen_principal) : RUTA_PLACEHOLDER,
  };
}

/** Texto del chip sobre la foto: el estilo (etiqueta) del producto; si no tiene, su categoria. */
function textoChip(p) {
  const ind = idsIndicadores(p);
  const id = (p.etiquetas_ids || []).find((x) => !ind.has(x));
  const et = (catalogo.etiquetas || []).find((e) => e.id === id);
  return et ? et.nombre : (categoriaDeProducto(catalogo, p)?.nombre || "");
}

function tarjetaHTML(item) {
  const p = item.producto;
  const v = vistaDeItem(item);
  const params = new URLSearchParams({ id: p.id, n: item.numero });
  if (v.color) params.set("color", v.color.color_id);
  const chip = textoChip(p);
  return `
    <a class="estante-card${v.agotado ? " is-agotado" : ""}" href="producto.html?${params}" data-num="${item.numero}" aria-label="Modelo ${item.numero}: ${esc(p.nombre)}">
      <span class="estante-card__media">
        ${numeroEstanteHTML(item.numero)}
        ${p.es_nuevo ? '<span class="estante-card__nuevo">NUEVO</span>' : ""}
        ${chip ? `<span class="estante-card__tag">${esc(chip)}</span>` : ""}
        ${v.agotado ? '<span class="estante-card__agotado">Agotado</span>' : ""}
        <img src="${esc(v.imagen)}" alt="${esc(p.nombre)}" loading="lazy" decoding="async" onerror="this.src='${RUTA_PLACEHOLDER}'">
      </span>
    </a>`;
}

function ordenar(items) {
  const copia = [...items];
  const ms = (i) => Date.parse(i.producto.creado_en || "") || 0;
  const por = {
    numero: (a, b) => a.numero - b.numero,
    recientes: (a, b) => ms(b) - ms(a) || a.numero - b.numero,
    "precio-asc": (a, b) => vistaDeItem(a).precio - vistaDeItem(b).precio,
    "precio-desc": (a, b) => vistaDeItem(b).precio - vistaDeItem(a).precio,
  }[filtro.orden] || ((a, b) => a.numero - b.numero);
  return copia.sort(por);
}

function pintarChips() {
  // Estilos (etiquetas) que realmente tienen los modelos de este estante, en el orden del sistema.
  const usados = new Set();
  estante.items.forEach((i) => {
    const ind = idsIndicadores(i.producto);
    (i.producto.etiquetas_ids || []).forEach((id) => { if (!ind.has(id)) usados.add(id); });
  });
  const lista = (catalogo.etiquetas || []).filter((e) => usados.has(e.id)).sort((a, b) => (a.orden || 0) - (b.orden || 0));
  const cont = $("[data-estante-chips]");
  if (lista.length < 2) { cont.innerHTML = ""; return; }
  const chip = (id, txt) => `<button type="button" class="estante-chip" data-et="${id ?? ""}" aria-pressed="${filtro.etiquetaId === id}">${esc(txt)}</button>`;
  cont.innerHTML = chip(null, "Todos") + lista.map((e) => chip(e.id, e.nombre)).join("");
}

function pintarGrid() {
  const visibles = estante.items.filter((i) => filtro.etiquetaId === null || (i.producto.etiquetas_ids || []).includes(filtro.etiquetaId));
  const grid = $("[data-estante-grid]");
  grid.innerHTML = ordenar(visibles).map(tarjetaHTML).join("");
  // Forma del estante fisico: si la cantidad es impar, el 1.º va solo y centrado arriba y el resto de a dos.
  // Solo con el estante completo y en orden por numero (con filtros u otro orden es una cuadricula normal).
  grid.classList.toggle("is-impar", visibles.length % 2 === 1 && filtro.etiquetaId === null && filtro.orden === "numero");
  $("[data-estante-sin]").hidden = visibles.length > 0;
}

function irAlNumero(n) {
  document.querySelectorAll(".estante-card.is-destacada").forEach((c) => c.classList.remove("is-destacada"));
  const card = n ? document.querySelector(`.estante-card[data-num="${n}"]`) : null;
  if (!card) return;
  card.scrollIntoView({ behavior: "smooth", block: "center" });
  card.classList.add("is-destacada");
  setTimeout(() => card.classList.remove("is-destacada"), 2600);
}

function fechaLarga(iso) {
  const d = iso ? new Date(iso + "T12:00:00") : null;
  return d && !isNaN(d) ? "· " + d.toLocaleDateString("es-BO", { weekday: "long", day: "numeric", month: "long" }) : "";
}

function pintarVacio() {
  $("[data-estante-hero]").hidden = true;
  $("[data-estante-tools]").hidden = true;
  $(".estante-orden").hidden = true;
  $(".est-promo").hidden = true;
  $("[data-estante-vacio]").hidden = false;
}

async function iniciar() {
  try {
    catalogo = await cargarCatalogo();
    estante = estanteActivo(catalogo);
  } catch (err) {
    console.error(err);
    estante = null;
  }
  if (!estante) { pintarVacio(); return; }

  $("[data-estante-nombre]").textContent = estante.titulo;
  $("[data-estante-fecha]").textContent = fechaLarga(estante.fecha);
  document.title = estante.titulo + " — Estante Virtual · VIBRA URBANA";
  // Portada: foto del primer modelo, oscurecida (da el aire del prototipo sin necesitar otra imagen)
  const bg = $("[data-estante-bg]");
  if (bg) bg.style.backgroundImage = `url("${vistaDeItem(estante.items[0]).imagen}")`;

  pintarChips();
  pintarGrid();
  track("estante_view", { titulo: estante.titulo, modelos: estante.items.length });

  $("[data-estante-chips]").addEventListener("click", (e) => {
    const b = e.target.closest("[data-et]");
    if (!b) return;
    filtro.etiquetaId = b.dataset.et === "" ? null : Number(b.dataset.et);
    pintarChips(); pintarGrid();
  });
  $("[data-estante-orden]").addEventListener("change", (e) => { filtro.orden = e.target.value; pintarGrid(); });
  $("[data-estante-reset]").addEventListener("click", () => { filtro.etiquetaId = null; pintarChips(); pintarGrid(); });
  $("[data-estante-num]").addEventListener("input", (e) => {
    const n = parseInt(e.target.value, 10);
    if (n && filtro.etiquetaId !== null && !$(`.estante-card[data-num="${n}"]`)) { filtro.etiquetaId = null; pintarChips(); pintarGrid(); }
    irAlNumero(n);
  });
  $("[data-estante-grid]").addEventListener("click", (e) => {
    const a = e.target.closest("[data-num]");
    if (a) track("estante_modelo_click", { numero: Number(a.dataset.num) });
  });
}

iniciar();
