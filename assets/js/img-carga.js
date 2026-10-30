// Transicion de carga de fotos: mientras una foto de producto baja, su recuadro muestra un fondo gris con
// brillo que se desplaza (clase .img-cargando) y la foto aparece con un fundido al terminar.
// Vigila TODAS las tarjetas, galeria, miniaturas y "similares" (tambien cuando cambia el src al elegir un color),
// sin que cada pagina tenga que acordarse de hacerlo.

const RECUADROS = ".product-card__media, .estante-card__media, .est-sim__media, .galeria__principal, .galeria__miniatura, .style-card__media";

function vigilar(img) {
  const caja = img.closest(RECUADROS);
  if (!caja) return;
  const terminar = () => caja.classList.remove("img-cargando");
  if (img.complete) { terminar(); return; } // ya cargada (cache) o con error
  caja.classList.add("img-cargando");
  img.addEventListener("load", terminar, { once: true });
  img.addEventListener("error", terminar, { once: true });
}

function revisar(nodo) {
  if (nodo.nodeType !== 1) return;
  if (nodo.tagName === "IMG") vigilar(nodo);
  else nodo.querySelectorAll?.("img").forEach(vigilar);
}

export function iniciarCargaImagenes() {
  if (window.__imgCarga) return;
  window.__imgCarga = true;
  document.querySelectorAll("img").forEach(vigilar);
  new MutationObserver((cambios) => {
    for (const c of cambios) {
      if (c.type === "attributes") vigilar(c.target);
      else c.addedNodes.forEach(revisar);
    }
  }).observe(document.body, { childList: true, subtree: true, attributes: true, attributeFilter: ["src"] });
}
