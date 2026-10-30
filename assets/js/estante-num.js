// Circulo con el numero del Estante LIVE. Mismos colores que el sistema (Estante LIVE > Preparar),
// uno por numero y se repite cada 12, para que el 03 de la pantalla sea el 03 del estante fisico.
export const PALETA_ESTANTE = [
  "#1E88E5", "#111827", "#14B8A6", "#F97316", "#EC4899", "#D4A017",
  "#64748B", "#0F766E", "#EA580C", "#1E3A8A", "#BE123C", "#7C3AED",
];

export const colorDeNumero = (n) => PALETA_ESTANTE[(Math.max(1, Number(n) || 1) - 1) % PALETA_ESTANTE.length];

/** HTML del circulo (el numero siempre con dos cifras: 01, 02...). */
export function numeroEstanteHTML(n, extraClase = "") {
  const num = Number(n);
  if (!Number.isFinite(num) || num < 1) return "";
  return `<span class="est-num ${extraClase}" style="--est-c:${colorDeNumero(num)}" aria-label="Número ${num}">${String(num).padStart(2, "0")}</span>`;
}
