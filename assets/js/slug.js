import { SITIO } from "./config.js";

// Regla UNICA para armar el enlace amigable de un producto. Debe ser identica a slug() de
// tools/generar_paginas.py (la pagina estatica se publica con esta misma ruta).
export function slug(texto) {
  const s = String(texto || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60)
    .replace(/-+$/g, "");
  return s || "producto";
}

export const rutaProducto = (id, nombre) => `producto/${slug(nombre)}-${id}/`;

/** Enlace publico para compartir (siempre con el dominio oficial). */
export const urlPublicaProducto = (id, nombre) => `${SITIO}/${rutaProducto(id, nombre)}`;
