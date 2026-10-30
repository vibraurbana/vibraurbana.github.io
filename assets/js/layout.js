import { ENLACES } from "./config.js";
import { pintarEnlacesWhatsApp } from "./whatsapp.js";

// Piezas compartidas por TODAS las paginas (un solo lugar): menu, barra inferior y pie.
// Los numeros de WhatsApp no estan aqui: llevan data-wa y los pinta whatsapp.js.

const WA_TXT = "Hola%2C%20vengo%20de%20la%20web%20de%20VIBRA%20URBANA%20y%20quiero%20hacer%20una%20consulta.";

const ico = (n, extra = "") => `<span class="ico ico--${n} ${extra}" aria-hidden="true"></span>`;

const pagina = () => (location.pathname.split("/").pop() || "index.html").replace(/\.html$/, "") || "index";

export function redes(clase = "") {
  const defs = [["tiktok", "TikTok"], ["facebook", "Facebook"], ["instagram", "Instagram"]];
  const items = defs.filter(([k]) => ENLACES[k]).map(([k, n]) =>
    `<a href="${ENLACES[k]}" target="_blank" rel="noopener" data-social="${k}" aria-label="${n}"><img class="ico-color" src="assets/icons/color/${k}.svg" alt="" width="28" height="28"><span>${n}</span></a>`);
  return items.length ? `<div class="social-links ${clase}">${items.join("")}</div>` : "";
}

const comoLlegar = (clase) => ENLACES.maps
  ? `<a class="${clase}" href="${ENLACES.maps}" target="_blank" rel="noopener" data-map-link>${ico("como-llegar")} Cómo llegar</a>` : "";

function pieHTML() {
  return `
  <div class="trust-strip"><div class="container">
    <span>${ico("envio-pais")} Envíos a todo el país</span>
    <span>${ico("retiro")} Retiro en tienda</span>
    <span>${ico("delivery")} Delivery local</span>
    <span>${ico("atencion")} Atención personalizada</span>
  </div></div>
  <div class="container site-footer__main">
    <div class="site-footer__column site-footer__identity">
      <img src="assets/img/logo-t.webp" alt="VIBRA URBANA" class="site-footer__logo" loading="lazy" width="150" height="63">
      <p>Moda urbana y casual<br>para toda la familia.</p>
      <img class="site-footer__brush" src="assets/img/mas-cerca-de-ti.png" alt="Más cerca de ti" width="140" height="40" loading="lazy">
      ${redes("social-links--footer")}
    </div>
    <div class="site-footer__column">
      <h2>${ico("mapa")} VISÍTANOS</h2>
      <p><strong>Comercial Cañoto<br><em>Pasillo Toborochi · Local #163</em></strong><br>Av. Busch, primer anillo<br>Santa Cruz de la Sierra, Bolivia</p>
      ${comoLlegar("site-footer__contact-btn site-footer__contact-btn--sec")}
      <h2>${ico("horario")} HORARIO</h2>
      <p>Lunes a sábado<br>10:00 - 19:00</p>
    </div>
    <div class="site-footer__column">
      <h2>${ico("llamar")} CONTÁCTANOS</h2>
      <p>WhatsApp</p>
      <a class="site-footer__phone" href="#" data-wa="principal" data-wa-texto="${WA_TXT}" data-wa-visible target="_blank" rel="noopener">…</a>
      <p>WhatsApp alternativo</p>
      <a class="site-footer__phone" href="#" data-wa="alternativo" data-wa-texto="${WA_TXT}" data-wa-visible target="_blank" rel="noopener">…</a>
      <a class="site-footer__contact-btn" href="#" data-wa="principal" data-wa-texto="${WA_TXT}" target="_blank" rel="noopener"><img class="ico-color" src="assets/icons/color/whatsapp-mini.svg" alt="" width="22" height="22"> ESCRIBIR POR WHATSAPP</a>
    </div>
    <div class="site-footer__column">
      <h2>COMPRAR Y ENVÍOS</h2>
      <p><a href="como-comprar.html">Cómo comprar</a></p>
      <p><a href="envios.html">Envíos y entregas</a></p>
      <p><a href="cambios-devoluciones.html">Cambios y devoluciones</a></p>
      <p><a href="quienes-somos.html">Quiénes somos</a></p>
      <p><a href="visitanos.html">Visítanos</a></p>
      <p><a href="contacto.html">Contacto</a></p>
      <p class="site-footer__small">Retiro en tienda · Delivery local · Encomiendas hasta las <em>17:00</em></p>
    </div>
  </div>
  <div class="site-footer__bottom">
    <div class="container"><small>© 2026 VIBRA URBANA · Moda urbana y casual para toda la familia.</small><span>Más cerca de ti</span>
    <nav><a href="index.html">Inicio</a><a href="catalogo.html">Catálogo</a><a href="index.html#visitanos">Visítanos</a><a href="index.html#contacto">Contacto</a><a href="politica-de-privacidad.html">Privacidad</a><a href="terminos-y-condiciones.html">Términos</a></nav></div>
  </div>`;
}

function menuHTML() {
  const it = (href, icono, txt) => `<a href="${href}">${ico(icono)}<span>${txt}</span></a>`;
  return `
  ${it("index.html", "inicio", "Inicio")}
  ${it("catalogo.html", "catalogo", "Catálogo")}
  ${it("como-comprar.html", "documento", "Cómo comprar")}
  ${it("envios.html", "delivery", "Envíos y entregas")}
  ${it("cambios-devoluciones.html", "transferencia", "Cambios y devoluciones")}
  ${it("quienes-somos.html", "tienda", "Quiénes somos")}
  ${it("visitanos.html", "mapa", "Visítanos")}
  ${it("contacto.html", "llamar", "Contacto")}
  <p class="mobile-nav__titulo">Síguenos</p>
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

  // Barra inferior (solo celular): Inicio | Catalogo | Buscar. Menu y carrito viven arriba.
  const barra = document.createElement("nav");
  barra.className = "bottom-nav";
  barra.setAttribute("aria-label", "Principal");
  const item = (href, k, txt, on) =>
    `<a href="${href}"${on ? ' aria-current="page"' : ""}>${ico(k)}<span>${txt}</span></a>`;
  barra.innerHTML =
    item("index.html", "inicio", "Inicio", activa === "index") +
    item("catalogo.html", "catalogo", "Catálogo", activa === "catalogo") +
    item("catalogo.html#buscar", "buscar", "Buscar", false);
  document.body.appendChild(barra);

  // Hamburguesa arriba a la izquierda (solo celular/tablet; en escritorio se ve el menu horizontal)
  const interior = document.querySelector(".site-header__inner");
  if (interior && !interior.querySelector("[data-menu-toggle]")) {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "site-header__menu-btn";
    btn.setAttribute("data-menu-toggle", "");
    btn.setAttribute("aria-expanded", "false");
    btn.setAttribute("aria-controls", "mobileNav");
    btn.setAttribute("aria-label", "Abrir menú");
    btn.innerHTML = `<span data-ico-abrir>${ico("menu")}</span><span data-ico-cerrar hidden>${ico("cerrar")}</span>`;
    interior.insertBefore(btn, interior.firstChild);
  }

  const acc = document.querySelector("[data-visit-actions]");
  if (acc && ENLACES.maps) acc.insertAdjacentHTML("afterbegin", comoLlegar("btn btn--primary"));

  pintarEnlacesWhatsApp(); // los enlaces recien creados reciben el numero
}
