import { WHATSAPP_NUMERO, FORM_ENDPOINT, API_BASE_URL } from "./config.js";
import { construirUrlWhatsApp } from "./whatsapp.js";
import { origenVisita, enviarContacto, precargarToken } from "./api.js";
import { track } from "./analytics.js";

const form = document.querySelector("[data-contact-form]");

function normalizarTelefono(valor) {
  let digitos = valor.replace(/\D/g, "");
  if (digitos.startsWith("591") && digitos.length === 11) digitos = digitos.slice(3);
  return /^[67]\d{7}$/.test(digitos) ? digitos : null;
}

if (form) {
  const els = {
    error: form.querySelector("[data-contact-error]"),
    boton: form.querySelector("[data-contact-submit]"),
    ok: document.querySelector("[data-contact-ok]"),
    okTitulo: document.querySelector("[data-contact-ok-titulo]"),
    okTexto: document.querySelector("[data-contact-ok-texto]"),
    okWa: document.querySelector("[data-contact-ok-wa]"),
  };

  const mostrarError = (texto) => {
    els.error.textContent = texto;
    els.error.hidden = false;
  };

  // El servidor exige un token de al menos 3 segundos: se pide en cuanto la persona toca el formulario.
  form.addEventListener("focusin", precargarToken, { once: true });

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    els.error.hidden = true;
    if (form.elements.web.value) return; // campo trampa para bots

    const nombre = form.elements.nombre.value.trim();
    const telefono = normalizarTelefono(form.elements.telefono.value);
    const interes = form.elements.interes.value.trim();

    if (nombre.length < 2) return mostrarError("Escribe tu nombre.");
    if (!telefono) return mostrarError("Escribe un celular de Bolivia de 8 dígitos, por ejemplo 77123456.");

    const mensaje =
      `Hola, soy ${nombre}. Quiero que me escriban.\nMi celular: ${telefono}` +
      (interes ? `\nMe interesa: ${interes}` : "");
    const urlWa = construirUrlWhatsApp(WHATSAPP_NUMERO, mensaje);
    els.okWa.href = urlWa;

    const lead = {
      nombre,
      telefono,
      interes,
      origen: origenVisita(),
      pagina: location.href,
      hp: "", // campo trampa (ya se descarto arriba si venia lleno)
    };

    // 1) API propia (tu servidor). Si falla, no se pierde el contacto: abre WhatsApp.
    if (API_BASE_URL) {
      els.boton.disabled = true;
      const resultado = await enviarContacto(lead);
      els.boton.disabled = false;
      track("formulario_contacto", { registrado: resultado.ok, motivo: resultado.ok ? undefined : `http_${resultado.status || "red"}` });
      if (resultado.ok) {
        form.hidden = true;
        els.ok.hidden = false;
      } else {
        window.open(urlWa, "_blank", "noopener");
      }
      return;
    }

    // 2) Sin API ni Google: solo abre WhatsApp con los datos escritos.
    if (!FORM_ENDPOINT) {
      track("formulario_contacto", { registrado: false, motivo: "sin_api" });
      window.open(urlWa, "_blank", "noopener");
      return;
    }

    // 3) Google Sheets (Apps Script).
    els.boton.disabled = true;
    try {
      await fetch(FORM_ENDPOINT, {
        method: "POST",
        mode: "no-cors",
        body: new URLSearchParams({
          fecha: new Date().toISOString(),
          nombre,
          telefono,
          interes,
          origen: origenVisita(),
          pagina: location.href,
        }),
      });
      form.hidden = true;
      els.ok.hidden = false;
    } catch {
      els.boton.disabled = false;
      mostrarError("No pudimos enviar tus datos. Inténtalo otra vez o escríbenos por WhatsApp.");
    }
  });
}
