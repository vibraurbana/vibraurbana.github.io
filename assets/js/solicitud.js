import { enviarPedido } from "./api.js";
import { construirMensajeWhatsApp, construirUrlWhatsApp } from "./whatsapp.js";
import { track, itemCarrito, valorCarrito, MONEDA_GA } from "./analytics.js";

// Flujo unico de "pedir por WhatsApp" (carrito y pagina de producto):
// registra el pedido en el sistema, recibe el codigo y abre WhatsApp con el mensaje armado.

/** El servidor es la fuente de verdad del precio: se usan sus precios en el mensaje. */
function conPreciosDelServidor(carrito, itemsServidor) {
  const porVariante = new Map((itemsServidor || []).map((i) => [i.variante_id, i.precio_unitario]));
  return carrito.map((i) => (porVariante.has(i.varianteId) ? { ...i, precio: porVariante.get(i.varianteId) } : i));
}

export function textoSinStock(carrito, noDisponibles) {
  const lineas = noDisponibles.map((n) => {
    const item = carrito.find((i) => i.varianteId === n.variante_id);
    const nombre = n.nombre || (item ? `${item.nombre} (${item.colorNombre} / Talla ${item.talla})` : "Un producto");
    return n.disponible > 0 ? `${nombre}: quedan ${n.disponible}` : `${nombre}: ya no está disponible`;
  });
  return `Ya no hay stock suficiente de: ${lineas.join(" · ")}.`;
}

/**
 * @param {{carrito: object[], moneda: string, numero: string, ubicacion: string}} opciones
 * @returns {Promise<{sinStock?: object[], codigo?: string, registrado?: boolean}>}
 *   sinStock => no se abrio WhatsApp; hay que avisar a la persona.
 */
export async function solicitarPorWhatsApp({ carrito, moneda, numero, ubicacion }) {
  // La pestana se abre YA, dentro del clic, para que el navegador no la bloquee
  // mientras esperamos el codigo del servidor.
  const ventana = window.open("", "_blank");
  if (ventana) ventana.document.write("<p style=\"font-family:sans-serif\">Abriendo WhatsApp…</p>");

  const items = carrito.map(itemCarrito);
  track("begin_checkout", { currency: MONEDA_GA, value: valorCarrito(carrito), items, ubicacion });

  const r = await enviarPedido(carrito);

  // El producto se agoto desde la ultima actualizacion del catalogo: no se abre WhatsApp.
  if (r.status === 422 && r.datos?.no_disponibles?.length) {
    if (ventana) ventana.close();
    track("pedido_sin_stock", { ubicacion });
    return { sinStock: r.datos.no_disponibles };
  }

  // Con codigo si el sistema registro el pedido; sin codigo en cualquier otro caso
  // (sin API, sin red, limite de pedidos): la consulta por WhatsApp sigue igual.
  const codigo = r.ok ? r.datos.codigo : "";
  const lineas = r.ok ? conPreciosDelServidor(carrito, r.datos.items) : carrito;

  if (r.ok) {
    track("generate_lead", { currency: MONEDA_GA, value: r.datos.total, transaction_id: codigo, ubicacion, items });
  } else {
    // Motivo para detectar fugas: sin API, sin variante_id en el catalogo, limite, red...
    track("pedido_no_registrado", { ubicacion, motivo: r.omitido ? "omitido" : `http_${r.status || "red"}` });
  }

  const url = construirUrlWhatsApp(numero, construirMensajeWhatsApp(lineas, moneda, codigo));
  if (ventana) ventana.location.href = url;
  else window.location.href = url;

  return { codigo, registrado: r.ok };
}
