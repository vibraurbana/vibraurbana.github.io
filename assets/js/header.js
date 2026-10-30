import { contarUnidadesCarrito } from "./cart.js";
import "./api.js";
import "./analytics.js"; // GA4 en todas las paginas
import { iniciarLayout } from "./layout.js";
import { iniciarCargaImagenes } from "./img-carga.js";

let ultimoConteo = null;

export function pintarContadorCarrito() {
  const badges = document.querySelectorAll("[data-cart-count]");
  if (!badges.length) return;
  const cantidad = contarUnidadesCarrito();

  badges.forEach((badge) => {
    badge.textContent = cantidad;
    badge.hidden = cantidad === 0;
    if (ultimoConteo !== null && cantidad > ultimoConteo) {
      badge.classList.remove("is-bump");
      void badge.offsetWidth; // reflow para re-disparar la animacion
      badge.classList.add("is-bump");
    }
  });
  ultimoConteo = cantidad;
}

export function iniciarMenuMovil() {
  const btn = document.querySelector("[data-menu-toggle]");
  const panel = document.querySelector("[data-mobile-nav]");
  if (!btn || !panel) return;

  const pintar = (abierto) => {
    btn.setAttribute("aria-expanded", String(abierto));
    btn.setAttribute("aria-label", abierto ? "Cerrar menú" : "Abrir menú");
    btn.querySelector("[data-ico-abrir]")?.toggleAttribute("hidden", abierto);
    btn.querySelector("[data-ico-cerrar]")?.toggleAttribute("hidden", !abierto);
  };
  const cerrar = () => { panel.classList.remove("is-open"); pintar(false); };
  btn.addEventListener("click", () => pintar(panel.classList.toggle("is-open")));
  panel.addEventListener("click", (e) => { if (e.target.closest("a")) cerrar(); });
  document.addEventListener("keydown", (e) => { if (e.key === "Escape") cerrar(); });
}

export function iniciarHeader() {
  iniciarLayout();
  iniciarCargaImagenes();
  pintarContadorCarrito();
  iniciarMenuMovil();
}
