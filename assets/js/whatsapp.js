import { WHATSAPP_NUMERO, WHATSAPP_ALTERNATIVO } from "./config.js";

// Arma el mensaje de WhatsApp a partir del carrito. Formato basado
// exactamente en el ejemplo del brief de VIBRA URBANA (sección 23).

function urlProducto(item) {
  if (!item.productoId) return "";
  return new URL(`producto.html?id=${item.productoId}`, location.href).href;
}

// "PUMA 1234": como la gente reconoce el producto. Puede faltar.
export function referenciaProducto(item) {
  return [item.marca, item.modelo].map((x) => String(x || "").trim()).filter(Boolean).join(" ");
}

export function construirMensajeWhatsApp(carrito, moneda, codigoPedido = "") {
  const lineas = carrito
    .map((item, i) => {
      const subtotal = item.precio * item.cantidad;
      return (
        `${i + 1}. ${item.nombre}\n` +
        (referenciaProducto(item) ? `   Marca/modelo: ${referenciaProducto(item)}\n` : "") +
        `   Color: ${item.colorNombre}\n` +
        `   Talla: ${item.talla}\n` +
        `   Cantidad: ${item.cantidad}\n` +
        `   Precio unitario: ${moneda} ${item.precio}\n` +
        `   Subtotal: ${moneda} ${subtotal}` +
        (urlProducto(item) ? `\n   Ver: ${urlProducto(item)}` : "")
      );
    })
    .join("\n\n");

  const total = carrito.reduce((t, item) => t + item.precio * item.cantidad, 0);

  return (
    `Hola, quiero consultar el siguiente pedido${codigoPedido ? ` (${codigoPedido})` : ""}:\n\n` +
    lineas +
    `\n\nTotal: ${moneda} ${total}` +
    "\n\nQuisiera confirmar disponibilidad y coordinar pago y entrega."
  );
}

const soloDigitos = (x) => String(x || "").replace(/\D+/g, "");
const valido = (n) => n.length >= 8 && n.length <= 15;

// UNICO lugar donde la web conoce los numeros. Arrancan con el respaldo de config.js y pasan
// a ser los del sistema en cuanto se lee catalogo.json (data.js llama a fijarNumerosWhatsApp).
let principal = soloDigitos(WHATSAPP_NUMERO);
let alternativo = soloDigitos(WHATSAPP_ALTERNATIVO);

export const numeroWhatsApp = () => principal;

/** Escribe los numeros en los enlaces del HTML: <a data-wa="principal|alternativo" data-wa-texto="...">. */
export function pintarEnlacesWhatsApp() {
  const aplicar = () => {
    document.querySelectorAll("a[data-wa]").forEach((a) => {
      const numero = a.dataset.wa === "alternativo" ? alternativo : principal;
      if (!valido(numero)) {
        // Sin numero (ej. no hay alternativo): se oculta el enlace y su rotulo.
        a.hidden = true;
        const rotulo = a.previousElementSibling;
        if (rotulo && rotulo.tagName === "P") rotulo.hidden = true;
        return;
      }
      a.href = `https://wa.me/${numero}?text=${a.dataset.waTexto || ""}`;
      if (a.hasAttribute("data-wa-visible")) a.textContent = numero.replace(/^591/, "");
    });
  };
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", aplicar, { once: true });
  else aplicar();
}

/** Recibe meta de catalogo.json ({ whatsapp_numero, whatsapp_alternativo }) y actualiza todo. */
export function fijarNumerosWhatsApp(meta = {}) {
  const p = soloDigitos(meta.whatsapp_numero);
  const a = soloDigitos(meta.whatsapp_alternativo);
  if (valido(p)) principal = p;
  if (valido(a)) alternativo = a;
  pintarEnlacesWhatsApp();
}

pintarEnlacesWhatsApp(); // con el respaldo, por si catalogo.json tarda o falla

export function construirUrlWhatsApp(numero, mensaje) {
  return `https://wa.me/${soloDigitos(numero) || principal}?text=${encodeURIComponent(mensaje)}`;
}
