export function skeletonCards(cantidad) {
  return Array.from({ length: cantidad })
    .map(
      () => `
      <div class="skeleton-card" aria-hidden="true">
        <div class="skeleton-card__media"></div>
        <div class="skeleton-card__line skeleton-card__line--sm"></div>
        <div class="skeleton-card__line skeleton-card__line--lg"></div>
      </div>`
    )
    .join("");
}

export function skeletonChips(cantidad) {
  return Array.from({ length: cantidad })
    .map(() => `<div class="skeleton-chip" aria-hidden="true"></div>`)
    .join("");
}

/** Placeholders cuadrados para la grilla "Explora por estilo" de la Home
 *  (misma forma que .style-card, sin texto ni ícono, solo el pulso). */
export function skeletonStyleCards(cantidad) {
  return Array.from({ length: cantidad })
    .map(
      () => `
      <div class="style-card" aria-hidden="true">
        <span class="style-card__media skeleton-card__media" style="border-radius: var(--radius-md);"></span>
      </div>`
    )
    .join("");
}
