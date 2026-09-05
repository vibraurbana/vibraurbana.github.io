// Carrito persistido en localStorage. En esta fase solo se usa para
// pintar el contador del header; agregar/editar/eliminar items y el
// mensaje de WhatsApp se implementan en la Fase 4.

const CART_KEY = "vibra_urbana_cart_v1";

export function obtenerCarrito() {
  try {
    const datos = JSON.parse(localStorage.getItem(CART_KEY));
    return Array.isArray(datos) ? datos : [];
  } catch {
    return [];
  }
}

export function contarUnidadesCarrito() {
  return obtenerCarrito().reduce((total, item) => total + (item.cantidad || 0), 0);
}
