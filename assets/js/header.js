import { contarUnidadesCarrito } from "./cart.js";

export function pintarContadorCarrito() {
  const badge = document.querySelector("[data-cart-count]");
  if (!badge) return;
  const cantidad = contarUnidadesCarrito();
  badge.textContent = cantidad;
  badge.hidden = cantidad === 0;
}

export function iniciarMenuMovil() {
  const btn = document.querySelector("[data-menu-toggle]");
  const panel = document.querySelector("[data-mobile-nav]");
  if (!btn || !panel) return;

  btn.addEventListener("click", () => {
    const abierto = panel.classList.toggle("is-open");
    btn.setAttribute("aria-expanded", String(abierto));
  });
}

export function iniciarHeader() {
  pintarContadorCarrito();
  iniciarMenuMovil();
}
