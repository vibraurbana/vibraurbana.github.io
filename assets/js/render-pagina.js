import { iniciarHeader } from "./header.js";
import { cargarCatalogo } from "./data.js";
import { redes } from "./layout.js";

// Paginas informativas (como comprar, envios, visitanos, cambios, contacto).
iniciarHeader();

// Cargar el catalogo solo para recibir el numero de WhatsApp del sistema (meta.whatsapp_numero).
cargarCatalogo().catch(() => {});

const caja = document.querySelector("[data-contacto-redes]");
if (caja) caja.innerHTML = redes("social-links--pagina") || "<p>Pronto publicaremos nuestras redes.</p>";
