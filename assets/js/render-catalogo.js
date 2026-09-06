import { cargarCatalogo, precioDesde } from "./data.js";
import { iniciarHeader } from "./header.js";
import { tarjetaProductoHTML } from "./product-card.js";
import { skeletonCards, skeletonChips } from "./skeleton.js";

const estado = {
  q: "",
  etiquetaId: null,
  colorId: null,
  talla: null,
  orden: "destacados",
  pagina: 1,
};

let catalogoGlobal = null;
let primerRenderGrid = true;
const PRODUCTOS_POR_PAGINA = 12;

const els = {};

function leerParamsIniciales() {
  const params = new URLSearchParams(location.search);
  const etiqueta = params.get("etiqueta");
  if (etiqueta) estado.etiquetaId = Number(etiqueta);
  const q = params.get("q");
  if (q) estado.q = q;
}

function normalizar(texto) {
  return (texto || "")
    .toString()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

function productoCoincide(producto) {
  if (estado.q) {
    const q = normalizar(estado.q);
    const enTexto = [producto.nombre, producto.marca, producto.modelo, producto.codigo]
      .some((campo) => normalizar(campo).includes(q));
    if (!enTexto) return false;
  }

  if (estado.etiquetaId !== null) {
    if (!(producto.etiquetas_ids || []).includes(estado.etiquetaId)) return false;
  }

  if (estado.colorId !== null) {
    const tieneColor = (producto.colores || []).some((c) => c.color_id === estado.colorId);
    if (!tieneColor) return false;
  }

  if (estado.talla !== null) {
    const tieneTalla = (producto.colores || []).some((c) =>
      (c.variantes || []).some((v) => v.talla === estado.talla)
    );
    if (!tieneTalla) return false;
  }

  return true;
}

function ordenar(lista) {
  const copia = [...lista];
  switch (estado.orden) {
    case "nombre_asc":
      return copia.sort((a, b) => a.nombre.localeCompare(b.nombre));
    case "precio_asc":
      return copia.sort((a, b) => (precioDesde(a) ?? Infinity) - (precioDesde(b) ?? Infinity));
    case "precio_desc":
      return copia.sort((a, b) => (precioDesde(b) ?? -Infinity) - (precioDesde(a) ?? -Infinity));
    default:
      return copia; // "destacados" = orden original del catalogo
  }
}

function pintarChips() {
  const activas = (catalogoGlobal.etiquetas || [])
    .filter((e) => e.visible_en_chips)
    .sort((a, b) => (a.orden || 0) - (b.orden || 0));

  const chipTodos = `<button type="button" class="chip${estado.etiquetaId === null ? " is-active" : ""}" data-etiqueta="">Todos</button>`;
  const chipsEtiquetas = activas
    .map(
      (e) =>
        `<button type="button" class="chip${estado.etiquetaId === e.id ? " is-active" : ""}" data-etiqueta="${e.id}">${e.nombre}</button>`
    )
    .join("");

  els.chips.innerHTML = chipTodos + chipsEtiquetas;

  els.chips.querySelectorAll("[data-etiqueta]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const valor = btn.dataset.etiqueta;
      estado.etiquetaId = valor === "" ? null : Number(valor);
      actualizar();
    });
  });
}

function coloresDisponibles() {
  const mapa = new Map();
  (catalogoGlobal.productos || []).forEach((p) => {
    (p.colores || []).forEach((c) => {
      if (!mapa.has(c.color_id)) {
        const info = (catalogoGlobal.colores || []).find((col) => col.id === c.color_id);
        if (info) mapa.set(c.color_id, info);
      }
    });
  });
  return [...mapa.values()];
}

function tallasDisponibles() {
  const set = new Set();
  (catalogoGlobal.productos || []).forEach((p) => {
    (p.colores || []).forEach((c) => {
      (c.variantes || []).forEach((v) => set.add(v.talla));
    });
  });
  return [...set].sort((a, b) => parseFloat(a) - parseFloat(b));
}

function pintarFiltroColor() {
  const colores = coloresDisponibles();
  els.panelColor.innerHTML = colores
    .map(
      (c) => `
      <button type="button" class="filtro-pop__color${estado.colorId === c.id ? " is-active" : ""}" data-color="${c.id}">
        <span class="filtro-pop__swatch" style="background:${c.codigo_hex}"></span>${c.nombre}
      </button>`
    )
    .join("");

  els.panelColor.querySelectorAll("[data-color]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const id = Number(btn.dataset.color);
      estado.colorId = estado.colorId === id ? null : id;
      document.getElementById("popColor").open = false;
      actualizar();
    });
  });
}

function pintarFiltroTalla() {
  const tallas = tallasDisponibles();
  els.panelTalla.innerHTML = tallas
    .map(
      (t) => `<button type="button" class="filtro-pop__talla${estado.talla === t ? " is-active" : ""}" data-talla="${t}">${t}</button>`
    )
    .join("");

  els.panelTalla.querySelectorAll("[data-talla]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const t = btn.dataset.talla;
      estado.talla = estado.talla === t ? null : t;
      document.getElementById("popTalla").open = false;
      actualizar();
    });
  });
}

function marcarPopoverActivo(id, tieneValor) {
  const el = document.getElementById(id);
  if (el) el.classList.toggle("tiene-valor", tieneValor);
}

function pintarPaginacion(total) {
  const totalPaginas = Math.ceil(total / PRODUCTOS_POR_PAGINA);
  els.pagination.hidden = totalPaginas <= 1;
  els.pagination.innerHTML = "";
  if (totalPaginas <= 1) return;

  const crearBoton = (texto, pagina, etiqueta, deshabilitado = false) => {
    const boton = document.createElement("button");
    boton.type = "button";
    boton.className = "catalogo-pagination__button";
    boton.textContent = texto;
    boton.setAttribute("aria-label", etiqueta);
    boton.disabled = deshabilitado;
    if (pagina === estado.pagina) {
      boton.classList.add("is-active");
      boton.setAttribute("aria-current", "page");
    }
    boton.addEventListener("click", () => {
      estado.pagina = pagina;
      actualizar(false);
      window.scrollTo({ top: 0, behavior: "smooth" });
    });
    return boton;
  };

  els.pagination.append(crearBoton("Anterior", estado.pagina - 1, "Página anterior", estado.pagina === 1));
  for (let pagina = 1; pagina <= totalPaginas; pagina += 1) {
    els.pagination.append(crearBoton(String(pagina), pagina, `Ir a la página ${pagina}`));
  }
  els.pagination.append(crearBoton("Siguiente", estado.pagina + 1, "Página siguiente", estado.pagina === totalPaginas));
}

function actualizar(resetPagina = true) {
  if (resetPagina) estado.pagina = 1;
  const filtrados = ordenar((catalogoGlobal.productos || []).filter(productoCoincide));
  const totalPaginas = Math.max(1, Math.ceil(filtrados.length / PRODUCTOS_POR_PAGINA));
  estado.pagina = Math.min(estado.pagina, totalPaginas);
  const inicio = (estado.pagina - 1) * PRODUCTOS_POR_PAGINA;
  const paginaActual = filtrados.slice(inicio, inicio + PRODUCTOS_POR_PAGINA);

  els.grid.innerHTML = paginaActual.length
    ? paginaActual.map((p) => tarjetaProductoHTML(catalogoGlobal, p)).join("")
    : "";

  if (primerRenderGrid) {
    els.grid.classList.add("fade-in");
    primerRenderGrid = false;
  }

  els.empty.hidden = filtrados.length !== 0;

  const n = filtrados.length;
  els.count.textContent = n === 1 ? "1 producto" : `${n} productos`;
  pintarPaginacion(n);

  els.search.value = estado.q;
  els.searchClear.classList.toggle("is-visible", estado.q.length > 0);

  marcarPopoverActivo("popColor", estado.colorId !== null);
  marcarPopoverActivo("popTalla", estado.talla !== null);

  pintarChips();
  pintarFiltroColor();
  pintarFiltroTalla();
}

function limpiarFiltros() {
  estado.q = "";
  estado.etiquetaId = null;
  estado.colorId = null;
  estado.talla = null;
  estado.orden = "destacados";
  els.orden.value = "destacados";
  actualizar();
}

function iniciarControles() {
  els.search.addEventListener("input", () => {
    estado.q = els.search.value;
    actualizar();
  });

  els.searchClear.addEventListener("click", () => {
    estado.q = "";
    els.search.focus();
    actualizar();
  });

  els.orden.addEventListener("change", () => {
    estado.orden = els.orden.value;
    actualizar();
  });

  els.resetColor.addEventListener("click", (e) => {
    e.preventDefault();
    estado.colorId = null;
    document.getElementById("popColor").open = false;
    actualizar();
  });

  els.resetTalla.addEventListener("click", (e) => {
    e.preventDefault();
    estado.talla = null;
    document.getElementById("popTalla").open = false;
    actualizar();
  });

  els.emptyReset.addEventListener("click", limpiarFiltros);

  // Cerrar el popover que no se toco cuando se abre el otro
  document.querySelectorAll(".filtro-pop").forEach((pop) => {
    pop.addEventListener("toggle", () => {
      if (!pop.open) return;
      document.querySelectorAll(".filtro-pop").forEach((otro) => {
        if (otro !== pop) otro.open = false;
      });
    });
  });
}

async function iniciar() {
  iniciarHeader();
  leerParamsIniciales();

  els.grid = document.querySelector("[data-catalogo-grid]");
  els.chips = document.querySelector("[data-catalogo-chips]");
  els.count = document.querySelector("[data-catalogo-count]");
  els.empty = document.querySelector("[data-catalogo-empty]");
  els.emptyReset = document.querySelector("[data-catalogo-empty-reset]");
  els.search = document.querySelector("[data-catalogo-search]");
  els.searchClear = document.querySelector("[data-catalogo-search-clear]");
  els.orden = document.querySelector("[data-catalogo-orden]");
  els.pagination = document.querySelector("[data-catalogo-pagination]");
  els.panelColor = document.querySelector("[data-panel-color]");
  els.panelTalla = document.querySelector("[data-panel-talla]");
  els.resetColor = document.querySelector("[data-reset-color]");
  els.resetTalla = document.querySelector("[data-reset-talla]");

  els.chips.innerHTML = skeletonChips(5);
  els.grid.innerHTML = skeletonCards(8);

  try {
    catalogoGlobal = await cargarCatalogo();
    iniciarControles();
    actualizar();
  } catch (err) {
    console.error(err);
    els.grid.innerHTML = "";
    els.empty.hidden = false;
    els.count.textContent = "";
  }
}

iniciar();
