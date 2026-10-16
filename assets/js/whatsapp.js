// Arma el mensaje de WhatsApp a partir del carrito. Formato basado
// exactamente en el ejemplo del brief de VIBRA URBANA (sección 23).

function urlProducto(item) {
  if (!item.productoId) return "";
  return new URL(`producto.html?id=${item.productoId}`, location.href).href;
}

export function construirMensajeWhatsApp(carrito, moneda, codigoPedido = "") {
  const lineas = carrito
    .map((item, i) => {
      const subtotal = item.precio * item.cantidad;
      return (
        `${i + 1}. ${item.nombre}\n` +
        `   Código: ${item.sku}\n` +
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

export function construirUrlWhatsApp(numero, mensaje) {
  return `https://wa.me/${numero}?text=${encodeURIComponent(mensaje)}`;
}
