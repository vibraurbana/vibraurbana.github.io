import { cargarCatalogo, formatearPrecio, etiquetasDeProducto, resolverImagen, categoriaDeProducto } from "./data.js";
import { iniciarHeader, pintarContadorCarrito } from "./header.js";
import { agregarAlCarrito } from "./cart.js";
import { RUTA_PLACEHOLDER } from "./product-card.js";
import { construirUrlWhatsApp } from "./whatsapp.js";
import { tarjetaProductoHTML, stockTotal } from "./product-card.js";
import { GUIA_TALLAS } from "./config.js";
import { urlPublicaProducto } from "./slug.js";
import { track, itemProducto, MONEDA_GA, medirSeleccionDeProductos } from "./analytics.js";

let catalogo = null;
let producto = null;

const estado = {
  colorId: null,
  talla: null,
  cantidad: 1,
  miniaturaIndex: 0,
};

const els = {};

function infoColor(colorId) {
  return (catalogo.colores || []).find((c) => c.id === colorId) || null;
}

function colorDelProducto(colorId) {
  return (producto.colores || []).find((c) => c.color_id === colorId) || null;
}

function tallasDelColorActual() {
  const color = colorDelProducto(estado.colorId);
  if (!color) return [];
  const orden = (t) => parseFloat(t);
  return [...(color.variantes || [])].sort((a, b) => orden(a.talla) - orden(b.talla));
}

function varianteSeleccionada() {
  const tallas = tallasDelColorActual();
  return tallas.find((v) => v.talla === estado.talla) || null;
}

function elegirColorInicial() {
  const colores = producto.colores || [];
  const conStock = colores.find((c) => (c.variantes || []).some((v) => v.stock > 0));
  return (conStock || colores[0])?.color_id ?? null;
}

function elegirTallaInicial(colorId) {
  const color = colorDelProducto(colorId);
  if (!color) return null;
  const disponible = (color.variantes || []).find((v) => v.stock > 0);
  return disponible ? disponible.talla : null;
}

/* ---------- Render: galeria ---------- */
function renderGaleria() {
  const color = colorDelProducto(estado.colorId);
  const rutasCrudas = color && color.imagenes && color.imagenes.length ? color.imagenes : null;
  const imagenes = rutasCrudas ? rutasCrudas.map(resolverImagen) : [RUTA_PLACEHOLDER];
  const idx = Math.min(estado.miniaturaIndex, imagenes.length - 1);

  const cambiarImagen = () => {
    els.galeriaImg.src = imagenes[idx];
    els.galeriaImg.alt = producto.nombre;
    els.galeriaImg.onerror = () => { els.galeriaImg.src = RUTA_PLACEHOLDER; };
    requestAnimationFrame(() => els.galeriaImg.classList.remove("is-cambiando"));
  };

  if (els.galeriaImg.src) {
    els.galeriaImg.classList.add("is-cambiando");
    setTimeout(cambiarImagen, 140);
  } else {
    cambiarImagen();
  }

  els.galeriaContador.textContent = `${idx + 1}/${imagenes.length}`;
  els.galeriaContador.hidden = imagenes.length <= 1;

  els.miniaturas.innerHTML = imagenes
    .map(
      (src, i) => `
      <button type="button" class="galeria__miniatura${i === idx ? " is-active" : ""}" data-mini="${i}">
        <img src="${src}" alt="" onerror="this.src='${RUTA_PLACEHOLDER}'">
      </button>`
    )
    .join("");

  els.miniaturas.querySelectorAll("[data-mini]").forEach((btn) => {
    btn.addEventListener("click", () => {
      estado.miniaturaIndex = Number(btn.dataset.mini);
      renderGaleria();
    });
  });
}

/* ---------- Render: swatches de color ---------- */
function renderColores() {
  els.colorSwatches.innerHTML = (producto.colores || [])
    .map((c) => {
      const info = infoColor(c.color_id);
      if (!info) return "";
      const sinStock = !(c.variantes || []).some((v) => v.stock > 0);
      return `
        <button type="button"
                class="color-swatch${estado.colorId === c.color_id ? " is-active" : ""}"
                style="background:${info.codigo_hex}"
                data-color="${c.color_id}"
                title="${info.nombre}${sinStock ? " (agotado)" : ""}"
                aria-label="${info.nombre}">
        </button>`;
    })
    .join("");

  els.colorSwatches.querySelectorAll("[data-color]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const nuevoColorId = Number(btn.dataset.color);
      if (nuevoColorId === estado.colorId) return;

      estado.colorId = nuevoColorId;
      estado.miniaturaIndex = 0;

      // Si la talla actual existe con stock en el nuevo color, se mantiene;
      // si no, se busca la primera disponible; si ninguna, queda sin talla.
      const tallas = tallasDelColorActual();
      const mismaTalla = tallas.find((v) => v.talla === estado.talla && v.stock > 0);
      estado.talla = mismaTalla ? estado.talla : elegirTallaInicial(estado.colorId);
      estado.cantidad = 1;

      renderTodo();
    });
  });

  const colorActual = infoColor(estado.colorId);
  els.colorValor.textContent = colorActual ? colorActual.nombre : "";
}

/* ---------- Render: chips de talla ---------- */
function renderTallas() {
  const tallas = tallasDelColorActual();

  els.tallaChips.innerHTML = tallas
    .map((v) => {
      const agotada = v.stock <= 0;
      const activa = estado.talla === v.talla;
      return `
        <button type="button"
                class="talla-chip${activa ? " is-active" : ""}${agotada ? " is-agotada" : ""}"
                data-talla="${v.talla}"
                ${agotada ? "disabled" : ""}
                aria-pressed="${activa}">
          ${v.talla}
        </button>`;
    })
    .join("");

  els.tallaChips.querySelectorAll("[data-talla]:not([disabled])").forEach((btn) => {
    btn.addEventListener("click", () => {
      estado.talla = btn.dataset.talla;
      estado.cantidad = 1;
      renderTodo();
    });
  });
}

/* ---------- Render: precio + disponibilidad + accion ---------- */
function renderPrecioYDisponibilidad() {
  const variante = varianteSeleccionada();
  const moneda = catalogo.meta.moneda;

  if (variante) {
    els.precio.innerHTML = formatearPrecio(variante.precio, moneda);
    els.precioHint.hidden = true;
  } else {
    const color = colorDelProducto(estado.colorId);
    const precios = (color?.variantes || []).map((v) => v.precio);
    const desde = precios.length ? Math.min(...precios) : null;
    els.precio.innerHTML = desde !== null
      ? `<span class="product-card__price-from">Desde</span>${formatearPrecio(desde, moneda)}`
      : "Consultar";
    els.precioHint.hidden = false;
    els.precioHint.textContent = "Elige una talla para ver el precio exacto";
  }

  els.disponibilidad.className = "disponibilidad";
  const colorTieneStock = tallasDelColorActual().some((v) => v.stock > 0);

  if (!colorTieneStock) {
    els.disponibilidad.classList.add("es-agotado");
    els.disponibilidadTexto.textContent = "Agotado en este color por ahora";
  } else if (!variante) {
    els.disponibilidadTexto.textContent = "Elige una talla para ver disponibilidad";
  } else if (variante.stock <= 3) {
    els.disponibilidad.classList.add("es-poco");
    els.disponibilidadTexto.textContent = variante.stock === 1 ? "¡Queda solo 1!" : `¡Quedan solo ${variante.stock}!`;
  } else {
    els.disponibilidad.classList.add("es-disponible");
    els.disponibilidadTexto.textContent = "En stock";
  }

  const puedeAgregar = !!variante && variante.stock > 0;
  els.btnAgregar.disabled = !puedeAgregar;
  els.stepperMenos.disabled = !puedeAgregar;
  els.stepperMas.disabled = !puedeAgregar;
  els.stepperValor.textContent = estado.cantidad;
}

function renderTodo() {
  const categoria = categoriaDeProducto(catalogo, producto);
  els.galeria.classList.toggle("galeria--shoe", categoria?.nombre === "Zapato");
  renderGaleria();
  renderColores();
  renderTallas();
  renderPrecioYDisponibilidad();
}

/* ---------- Cabecera del producto (info fija, no cambia con color/talla) ---------- */
function renderInfoFija() {
  document.title = `${producto.nombre} — VIBRA URBANA`;
  els.miga.textContent = producto.nombre;
  els.marca.textContent = "";
  els.nombre.textContent = producto.nombre;
  els.descripcion.textContent = producto.descripcion ||
    "Diseño urbano y versátil, pensado para acompañarte todos los días.";

  const etiquetas = etiquetasDeProducto(catalogo, producto);
  els.etiquetas.innerHTML = etiquetas
    .map((e) => `<span class="chip chip--static">${e.nombre}</span>`)
    .join("");
}

/* ---------- Cantidad ---------- */
function iniciarStepper() {
  els.stepperMenos.addEventListener("click", () => {
    if (estado.cantidad > 1) {
      estado.cantidad -= 1;
      els.stepperValor.textContent = estado.cantidad;
    }
  });

  els.stepperMas.addEventListener("click", () => {
    const variante = varianteSeleccionada();
    const max = variante ? Math.min(variante.stock, 10) : 1;
    if (estado.cantidad < max) {
      estado.cantidad += 1;
      els.stepperValor.textContent = estado.cantidad;
    }
  });
}

/* ---------- Agregar al carrito ---------- */
function iniciarAgregar() {
  els.btnAgregar.addEventListener("click", () => {
    const variante = varianteSeleccionada();
    if (!variante) return;

    const color = infoColor(estado.colorId);
    const colorProducto = colorDelProducto(estado.colorId);

    agregarAlCarrito({
      sku: variante.sku,
      varianteId: variante.variante_id ?? null,
      productoId: producto.id,
      nombre: producto.nombre,
      colorNombre: color ? color.nombre : "",
      talla: variante.talla,
      precio: variante.precio,
      cantidad: estado.cantidad,
      imagen: (colorProducto && colorProducto.imagen_principal)
        ? resolverImagen(colorProducto.imagen_principal)
        : RUTA_PLACEHOLDER,
    });

    track("add_to_cart", {
      currency: MONEDA_GA,
      value: variante.precio * estado.cantidad,
      items: [itemProducto(producto, { variante, colorNombre: color ? color.nombre : "", cantidad: estado.cantidad })],
    });

    pintarContadorCarrito();
    mostrarToast(`Agregado: ${producto.nombre} · ${variante.talla}`);
    estado.cantidad = 1;
    renderPrecioYDisponibilidad();
  });
}

const urlDelProducto = () => urlPublicaProducto(producto.id, producto.nombre);

/* ---------- Compartir ---------- */
/** Canonical y titulo con el enlace amigable (aunque se haya entrado por producto.html?id=). */
function fijarMetaSEO() {
  const url = urlDelProducto();
  let link = document.querySelector('link[rel="canonical"]');
  if (!link) { link = document.createElement("link"); link.rel = "canonical"; document.head.appendChild(link); }
  link.href = url;
  document.title = `${producto.nombre} — VIBRA URBANA`;
}

function iniciarCompartir() {
  const url = urlDelProducto();
  const texto = `${producto.nombre} — VIBRA URBANA`;
  const medir = (metodo) => track("product_share", { method: metodo, items: [itemProducto(producto)] });
  document.querySelectorAll("[data-share]").forEach((el) => {
    const tipo = el.dataset.share;
    if (tipo === "whatsapp") el.href = `https://wa.me/?text=${encodeURIComponent(`${texto}\n${url}`)}`;
    if (tipo === "facebook") el.href = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`;
    el.addEventListener("click", async () => {
      medir(tipo);
      if (tipo !== "copiar") return;
      try {
        await navigator.clipboard.writeText(url);
        mostrarToast("Enlace copiado");
      } catch {
        window.prompt("Copia este enlace:", url);
      }
    });
  });
}

/* ---------- Guia de tallas (texto en config.js; sin texto, no se muestra) ---------- */
function iniciarGuiaTallas() {
  const btn = document.querySelector("[data-guia-tallas]");
  const dlg = document.querySelector("[data-guia-dialog]");
  if (!btn || !dlg || !String(GUIA_TALLAS).trim()) return;
  const texto = dlg.querySelector("[data-guia-texto]");
  texto.textContent = GUIA_TALLAS;
  texto.style.whiteSpace = "pre-line";
  btn.hidden = false;
  btn.addEventListener("click", () => dlg.showModal());
  dlg.querySelector("[data-guia-cerrar]").addEventListener("click", () => dlg.close());
  dlg.addEventListener("click", (e) => { if (e.target === dlg) dlg.close(); });
}

/* ---------- Productos similares: mismo estilo, con stock ---------- */
function renderSimilares() {
  const seccion = document.querySelector("[data-similares]");
  const grid = document.querySelector("[data-similares-grid]");
  if (!seccion || !grid) return;
  const mias = new Set(producto.etiquetas_ids || []);
  const candidatos = (catalogo.productos || []).filter((p) => p.id !== producto.id && stockTotal(p) > 0);
  // Mas peso al mismo estilo (etiquetas); si no hay, se usa la misma categoria.
  const puntaje = (p) => (p.etiquetas_ids || []).filter((e) => mias.has(e)).length * 2
    + (p.categoria_id === producto.categoria_id ? 1 : 0);
  const lista = candidatos.filter((p) => puntaje(p) > 0)
    .sort((a, b) => puntaje(b) - puntaje(a)).slice(0, 4);
  if (!lista.length) return;
  grid.innerHTML = lista.map((p) => tarjetaProductoHTML(catalogo, p)).join("");
  seccion.hidden = false;
  medirSeleccionDeProductos(catalogo, "similares");
}

/* ---------- Consultar por WhatsApp ---------- */
function iniciarConsultar() {
  els.btnConsultar.addEventListener("click", () => {
    const variante = varianteSeleccionada();
    const color = infoColor(estado.colorId);
    const partes = [`Hola, me interesa ${producto.nombre}`];
    if (color) partes.push(`color ${color.nombre}`);
    if (variante) partes.push(`talla ${variante.talla}`);
    const url = urlDelProducto();
    const mensaje = `${partes.join(", ")}.\n¿Está disponible?\n${url}`;
    track("product_inquiry", {
      items: [itemProducto(producto, { variante, colorNombre: color ? color.nombre : "" })],
      agotado: variante ? variante.stock <= 0 : false,
    });
    window.open(construirUrlWhatsApp(catalogo.meta.whatsapp_numero, mensaje), "_blank", "noopener");
  });
}

let toastTimer = null;
function mostrarToast(mensaje) {
  els.toast.textContent = "✓ " + mensaje;
  els.toast.classList.add("is-visible");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => els.toast.classList.remove("is-visible"), 2200);
}

function mostrarNoEncontrado() {
  document.querySelector("[data-producto-layout]").hidden = true;
  document.querySelector("[data-producto-empty]").hidden = false;
}

async function iniciar() {
  iniciarHeader();

  els.miga = document.querySelector("[data-miga]");
  els.galeria = document.querySelector(".galeria");
  els.galeriaImg = document.querySelector("[data-galeria-img]");
  els.galeriaContador = document.querySelector("[data-galeria-contador]");
  els.miniaturas = document.querySelector("[data-miniaturas]");
  els.colorSwatches = document.querySelector("[data-color-swatches]");
  els.colorValor = document.querySelector("[data-color-valor]");
  els.tallaChips = document.querySelector("[data-talla-chips]");
  els.marca = document.querySelector("[data-producto-marca]");
  els.nombre = document.querySelector("[data-producto-nombre]");
  els.descripcion = document.querySelector("[data-producto-desc]");
  els.etiquetas = document.querySelector("[data-producto-etiquetas]");
  els.precio = document.querySelector("[data-producto-precio]");
  els.precioHint = document.querySelector("[data-producto-precio-hint]");
  els.disponibilidad = document.querySelector("[data-disponibilidad]");
  els.disponibilidadTexto = document.querySelector("[data-disponibilidad-texto]");
  els.stepperMenos = document.querySelector("[data-stepper-menos]");
  els.stepperMas = document.querySelector("[data-stepper-mas]");
  els.stepperValor = document.querySelector("[data-stepper-valor]");
  els.btnAgregar = document.querySelector("[data-btn-agregar]");
  els.btnConsultar = document.querySelector("[data-btn-consultar]");
  els.toast = document.querySelector("[data-toast]");

  try {
    catalogo = await cargarCatalogo();
    // La pagina estatica publicada (producto/<nombre>-<id>/) define window.PRODUCTO_ID.
    const id = Number(window.PRODUCTO_ID || new URLSearchParams(location.search).get("id"));
    producto = (catalogo.productos || []).find((p) => p.id === id) || null;

    if (!producto) {
      mostrarNoEncontrado();
      return;
    }

    estado.colorId = elegirColorInicial();
    estado.talla = elegirTallaInicial(estado.colorId);

    fijarMetaSEO();
    renderInfoFija();
    renderTodo();
    iniciarStepper();
    iniciarAgregar();
    iniciarConsultar();
    iniciarCompartir();
    iniciarGuiaTallas();
    renderSimilares();

    const precios = (producto.colores || []).flatMap((c) => (c.variantes || []).map((v) => v.precio));
    track("view_item", {
      currency: MONEDA_GA,
      value: precios.length ? Math.min(...precios) : undefined,
      items: [itemProducto(producto)],
    });
  } catch (err) {
    console.error(err);
    mostrarNoEncontrado();
  }
}

iniciar();
