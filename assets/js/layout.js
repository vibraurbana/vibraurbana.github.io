import { ENLACES } from "./config.js";
import { pintarEnlacesWhatsApp } from "./whatsapp.js";

// Piezas compartidas por TODAS las paginas (un solo lugar): menu, barra inferior y pie.
// Los numeros de WhatsApp no estan aqui: llevan data-wa y los pinta whatsapp.js.

const WA_TXT = "Hola%2C%20vengo%20de%20la%20web%20de%20VIBRA%20URBANA%20y%20quiero%20hacer%20una%20consulta.";

const ico = {
  inicio: '<path d="M3 11l9-8 9 8"/><path d="M5 10v10h5v-6h4v6h5V10"/>',
  catalogo: '<rect x="3" y="3" width="7.5" height="7.5" rx="1.5"/><rect x="13.5" y="3" width="7.5" height="7.5" rx="1.5"/><rect x="3" y="13.5" width="7.5" height="7.5" rx="1.5"/><rect x="13.5" y="13.5" width="7.5" height="7.5" rx="1.5"/>',
  buscar: '<circle cx="11" cy="11" r="7"/><path d="M21 21l-4.3-4.3"/>',
  menu: '<path d="M3 6h18M3 12h18M3 18h18"/>',
  cerrar: '<path d="M6 6l12 12M18 6L6 18"/>',
};
const svg = (k) => `<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${ico[k]}</svg>`;

const pagina = () => (location.pathname.split("/").pop() || "index.html").replace(/\.html$/, "") || "index";

function redes(clase = "") {
  const defs = [["tiktok", "TikTok"], ["facebook", "Facebook"], ["instagram", "Instagram"]];
  const items = defs.filter(([k]) => ENLACES[k]).map(([k, n]) =>
    `<a href="${ENLACES[k]}" target="_blank" rel="noopener" data-social="${k}">${n}</a>`);
  return items.length ? `<div class="social-links ${clase}">${items.join("")}</div>` : "";
}

const comoLlegar = (clase) => ENLACES.maps
  ? `<a class="${clase}" href="${ENLACES.maps}" target="_blank" rel="noopener" data-map-link>📍 Cómo llegar</a>` : "";

function pieHTML() {
  return `
  <div class="container site-footer__main">
    <div class="site-footer__column site-footer__identity">
      <img src="assets/img/logo-t.webp" alt="VIBRA URBANA" class="site-footer__logo" loading="lazy" width="150" height="63">
      <p>Moda urbana y casual<br>para toda la familia.</p>
      ${redes("social-links--footer")}
    </div>
    <div class="site-footer__column">
      <h2>VISÍTANOS</h2>
      <p><strong>Comercial Cañoto<br><em>Local #163</em></strong><br>Santa Cruz de la Sierra, Bolivia</p>
      ${comoLlegar("site-footer__contact-btn site-footer__contact-btn--sec")}
      <h2>HORARIO</h2>
      <p>Lunes a sábado<br>10:00 - 19:00</p>
    </div>
    <div class="site-footer__column">
      <h2>CONTÁCTANOS</h2>
      <p>WhatsApp</p>
      <a class="site-footer__phone" href="#" data-wa="principal" data-wa-texto="${WA_TXT}" data-wa-visible target="_blank" rel="noopener">…</a>
      <p>WhatsApp alternativo</p>
      <a class="site-footer__phone" href="#" data-wa="alternativo" data-wa-texto="${WA_TXT}" data-wa-visible target="_blank" rel="noopener">…</a>
      <a class="site-footer__contact-btn" href="#" data-wa="principal" data-wa-texto="${WA_TXT}" target="_blank" rel="noopener">ESCRIBIR POR WHATSAPP →</a>
    </div>
    <div class="site-footer__column">
      <h2>COMPRAR Y ENVÍOS</h2>
      <p><a href="index.html#como-comprar">Cómo comprar</a></p>
      <p><strong>Retiro en tienda</strong><br>Local #163</p>
      <p><strong>Delivery local</strong><br>Coordinamos contigo.</p>
      <p><strong>Encomiendas</strong><br>A otros departamentos.<br>Recepción hasta las <em>17:00</em></p>
    </div>
  </div>
  <div class="site-footer__bottom">
    <div class="container"><small>© 2026 VIBRA URBANA · Moda urbana y casual para toda la familia.</small><span>Más cerca de ti</span>
    <nav><a href="index.html">Inicio</a><a href="catalogo.html">Catálogo</a><a href="index.html#visitanos">Visítanos</a><a href="index.html#contacto">Contacto</a></nav></div>
  </div>`;
}

function menuHTML() {
  return `
  <a href="index.html">Inicio</a>
  <a href="catalogo.html">Catálogo</a>
  <a href="index.html#como-comprar">Cómo comprar</a>
  <a href="index.html#visitanos">Visítanos</a>
  <a href="index.html#contacto">Contacto</a>
  ${redes("social-links--menu")}`;
}

export function iniciarLayout() {
  const activa = pagina();
  // Pie unico
  const pie = document.querySelector("footer.site-footer");
  if (pie) pie.innerHTML = pieHTML();

  // Menu desplegable (lo abre el boton "Menu" de la barra inferior)
  let menu = document.querySelector("[data-mobile-nav]");
  if (!menu) {
    menu = document.createElement("nav");
    menu.className = "mobile-nav";
    menu.id = "mobileNav";
    menu.setAttribute("data-mobile-nav", "");
    menu.setAttribute("aria-label", "Menú");
    document.body.appendChild(menu);
  }
  menu.innerHTML = menuHTML();

  // Barra inferior (solo celular): Inicio | Catalogo | Buscar | Menu. El carrito vive arriba.
  const barra = document.createElement("nav");
  barra.className = "bottom-nav";
  barra.setAttribute("aria-label", "Principal");
  const item = (href, k, txt, on) =>
    `<a href="${href}"${on ? ' aria-current="page"' : ""}>${svg(k)}<span>${txt}</span></a>`;
  barra.innerHTML =
    item("index.html", "inicio", "Inicio", activa === "index") +
    item("catalogo.html", "catalogo", "Catálogo", activa === "catalogo") +
    item("catalogo.html#buscar", "buscar", "Buscar", false) +
    `<button type="button" data-menu-toggle aria-expanded="false" aria-controls="mobileNav">${svg("menu")}<span>Menú</span></button>`;
  document.body.appendChild(barra);

  const acc = document.querySelector("[data-visit-actions]");
  if (acc && ENLACES.maps) acc.insertAdjacentHTML("afterbegin", comoLlegar("btn btn--primary"));

  pintarEnlacesWhatsApp(); // los enlaces recien creados reciben el numero
}
