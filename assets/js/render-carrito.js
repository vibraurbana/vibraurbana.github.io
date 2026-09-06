import { cargarCatalogo, formatearPrecio } from "./data.js";
import { iniciarHeader, pintarContadorCarrito } from "./header.js";
import { obtenerCarrito, actualizarCantidad, eliminarDelCarrito, calcularTotal } from "./cart.js";
import { construirMensajeWhatsApp, construirUrlWhatsApp } from "./whatsapp.js";
import { RUTA_PLACEHOLDER } from "./product-card.js";

const els = {};
let catalogoGlobal = null;

/** Busca el stock actual de un SKU en el catálogo (para no dejar sumar
 *  más unidades de las que realmente hay). Si no lo encuentra, no limita. */
function stockDeSku(sku) {
  for (const p of catalogoGlobal.productos || []) {
    for (const c of p.colores || []) {
      for (const v of c.variantes || []) {
        if (v.sku === sku) return v.stock;
      }
    }
  }
  return null;
}

function filaItem(item, moneda) {
  const subtotal = item.precio * item.cantidad;
  return `
    <li class="cart-item" data-sku="${item.sku}">
      <span class="cart-item__media">
        <img src="${item.imagen || RUTA_PLACEHOLDER}" alt="" onerror="this.src='${RUTA_PLACEHOLDER}'">
      </span>
      <div class="cart-item__body">
        <div class="cart-item__top">
          <div>
            <h3 class="cart-item__nombre">${item.nombre}</h3>
            <p class="cart-item__variante">${item.colorNombre} · Talla ${item.talla}</p>
          </div>
          <button type="button" class="cart-item__quitar" data-quitar="${item.sku}" aria-label="Quitar del carrito">
            <svg viewBox="0 0 24 24" width="17" height="17" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2m3 0-1 14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2L4 6"/></svg>
          </button>
        </div>
        <div class="cart-item__bottom">
          <div class="stepper stepper--sm">
            <button type="button" data-menos="${item.sku}" aria-label="Quitar una unidad">−</button>
            <span class="stepper__valor">${item.cantidad}</span>
            <button type="button" data-mas="${item.sku}" aria-label="Agregar una unidad">+</button>
          </div>
          <span class="cart-item__precio">${formatearPrecio(subtotal, moneda)}</span>
        </div>
      </div>
    </li>`;
}

function iniciarEventosItems() {
  els.lista.querySelectorAll("[data-menos]").forEach((btn) => {
    btn.addEventListener("click", () => cambiarCantidad(btn.dataset.menos, -1));
  });
  els.lista.querySelectorAll("[data-mas]").forEach((btn) => {
    btn.addEventListener("click", () => cambiarCantidad(btn.dataset.mas, +1));
  });
  els.lista.querySelectorAll("[data-quitar]").forEach((btn) => {
    btn.addEventListener("click", () => {
      eliminarDelCarrito(btn.dataset.quitar);
      pintarContadorCarrito();
      render();
    });
  });
}

function cambiarCantidad(sku, delta) {
  const carrito = obtenerCarrito();
  const item = carrito.find((i) => i.sku === sku);
  if (!item) return;

  const stock = stockDeSku(sku);
  const nueva = item.cantidad + delta;

  if (delta > 0 && stock !== null && nueva > stock) return; // no hay mas stock

  actualizarCantidad(sku, nueva);
  pintarContadorCarrito();
  render();
}

function render() {
  const carrito = obtenerCarrito();
  const vacio = carrito.length === 0;

  els.lista.hidden = vacio;
  els.resumen.hidden = vacio;
  els.vacio.hidden = !vacio;

  if (vacio) {
    els.count.textContent = "";
    return;
  }

  const moneda = catalogoGlobal.meta.moneda;

  els.lista.innerHTML = carrito.map((item) => filaItem(item, moneda)).join("");
  iniciarEventosItems();

  const totalUnidades = carrito.reduce((t, i) => t + i.cantidad, 0);
  els.count.textContent = totalUnidades === 1 ? "1 producto" : `${totalUnidades} productos`;

  const total = calcularTotal(carrito);
  els.subtotal.textContent = formatearPrecio(total, moneda);
  els.total.textContent = formatearPrecio(total, moneda);

  const mensaje = construirMensajeWhatsApp(carrito, moneda);
  els.btnWhatsapp.href = construirUrlWhatsApp(catalogoGlobal.meta.whatsapp_numero, mensaje);
}

async function iniciar() {
  iniciarHeader();

  els.lista = document.querySelector("[data-cart-lista]");
  els.resumen = document.querySelector("[data-cart-resumen]");
  els.vacio = document.querySelector("[data-cart-vacio]");
  els.count = document.querySelector("[data-cart-page-count]");
  els.subtotal = document.querySelector("[data-cart-subtotal]");
  els.total = document.querySelector("[data-cart-total]");
  els.btnWhatsapp = document.querySelector("[data-cart-whatsapp]");

  try {
    catalogoGlobal = await cargarCatalogo();
    render();
  } catch (err) {
    console.error(err);
    els.lista.hidden = true;
    els.resumen.hidden = true;
    els.vacio.hidden = false;
  }
}

iniciar();
