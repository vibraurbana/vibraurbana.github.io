// Carrito persistido en localStorage, identificado por SKU (no por
// producto_id): un mismo producto puede aparecer varias veces si el
// cliente lleva distintos colores/tallas. La revisión completa del
// carrito y el mensaje de WhatsApp se arman en la Fase 4; esta Fase 3
// ya deja "agregar" funcionando desde la página de producto.

const CART_KEY = "vibra_urbana_cart_v1";

export function obtenerCarrito() {
  try {
    const datos = JSON.parse(localStorage.getItem(CART_KEY));
    return Array.isArray(datos) ? datos : [];
  } catch {
    return [];
  }
}

function guardarCarrito(carrito) {
  localStorage.setItem(CART_KEY, JSON.stringify(carrito));
}

/**
 * Agrega una variante (SKU) al carrito. Si ese SKU ya estaba, suma la
 * cantidad en vez de duplicar la linea -- el carrito identifica items
 * por SKU, nunca por producto_id (un mismo producto puede tener varias
 * lineas si el cliente lleva mas de un color/talla).
 */
export function agregarAlCarrito(item) {
  const carrito = obtenerCarrito();
  const existente = carrito.find((i) => i.sku === item.sku);

  if (existente) {
    existente.cantidad += item.cantidad;
  } else {
    carrito.push(item);
  }

  guardarCarrito(carrito);
  return carrito;
}

export function contarUnidadesCarrito() {
  return obtenerCarrito().reduce((total, item) => total + (item.cantidad || 0), 0);
}

/** Cambia la cantidad de una linea (por SKU). cantidad <= 0 la elimina. */
export function actualizarCantidad(sku, cantidad) {
  const carrito = obtenerCarrito();
  const item = carrito.find((i) => i.sku === sku);
  if (!item) return carrito;

  if (cantidad <= 0) {
    return eliminarDelCarrito(sku);
  }

  item.cantidad = cantidad;
  guardarCarrito(carrito);
  return carrito;
}

export function eliminarDelCarrito(sku) {
  const carrito = obtenerCarrito().filter((i) => i.sku !== sku);
  guardarCarrito(carrito);
  return carrito;
}

export function vaciarCarrito() {
  guardarCarrito([]);
  return [];
}

export function calcularTotal(carrito) {
  return carrito.reduce((total, item) => total + item.precio * item.cantidad, 0);
}
