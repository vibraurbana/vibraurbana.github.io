# Fase 1 — Inicio, navegación y pie

- Tema nuevo (todas las páginas): espacio de trabajo blanco/grafito; encabezado, pie y bloque "Cómo comprar" en negro; amarillo solo como fondo de acciones (texto negro, 13:1); verde WhatsApp #15803d con texto blanco (5:1).
- Navegación móvil: logo + carrito arriba; barra inferior Inicio | Catálogo | Buscar | Menú. WhatsApp flotante solo en la ficha de producto.
- Inicio: portada, explora por estilo (etiquetas), destacados, NUEVOS INGRESOS (hoy = los de id más alto; el JSON no trae fecha), cómo comprar, visítanos + confianza, formulario, pie.
- Pie, menú y barra inferior viven en un solo archivo: `assets/js/layout.js`.
- `assets/js/config.js` > `ENLACES`: maps, tiktok, facebook, instagram. Si uno está vacío, no se muestra (Maps, Facebook e Instagram están vacíos hasta que los envíes).
- Quitado por no tener respaldo: "Calidad/Estilo/Comodidad", "Compra segura", "Cambios fáciles", "Rápidos y seguros".
- Ajustes v2: solo se usa el nombre del producto (sin modelo ni marca en tarjetas, ficha, mensaje de WhatsApp ni Analytics; el buscador busca solo por nombre). Logo completo también en móvil. Portada más baja. Nuevos ingresos en banda gris. "Cómo comprar" ahora es una lista clara y compacta.
- Pendiente (Fase 2): nombres de producto en 2 líneas.

# Fase 2 — Catálogo
- Buscador solo por nombre; filtros por estilo (etiquetas), color y talla; botón "Disponibles"; orden: Destacados, Más recientes, A-Z, precio.
- Tarjetas: nombre hasta 2 líneas, precio, puntos de color y tallas con stock (Tallas 40 · 41 · 44).
- "Ver más productos (N)" en tandas de 12. Lo agotado va al final.
- Barra de filtros en celular: se acomoda en filas y el panel ocupa todo el ancho.
- Arreglado: el botón "Disponibles" faltaba en el HTML y el script fallaba al actualizar el contador.

# Fase 3 — Ficha y carrito
- Ficha: galería, color, talla, disponibilidad, Agregar al carrito, Consultar por WhatsApp, nota "El pedido se confirma por WhatsApp según disponibilidad", Compartir (WhatsApp, Facebook, copiar enlace; evento product_share) y "También te puede interesar" (mismo estilo; si no hay, misma categoría).
- Guía de tallas: se escribe en `assets/js/config.js` > GUIA_TALLAS. Vacía = el enlace no se muestra.
- Mensaje de WhatsApp de la ficha: solo nombre, color y talla (sin modelo/marca).
- Carrito: al registrar el pedido en el sistema se vacía (como el catálogo de WhatsApp) y muestra "¡Pedido enviado!" con el código. Si el pedido no se pudo registrar, el carrito se conserva.
- Corregido: rejilla de tarjetas en la ficha, carrito "vacío" que seguía mostrando la lista, aviso "Agregado" sobre la barra inferior, flecha "atrás" duplicada junto a la hamburguesa.

# Fase 4 — Confianza
- Páginas nuevas: como-comprar.html, envios.html, visitanos.html, cambios-devoluciones.html, contacto.html (con título, descripción y canonical propios; todas en sitemap.xml).
- Redes (asumidas): facebook.com/tiendavibraurbana, tiktok.com/@tiendavibraurbana, instagram.com/tiendavibraurbana. Se cambian en `assets/js/config.js` > ENLACES (y en el JSON-LD de index.html).
- Cambios y devoluciones: es un EJEMPLO BASICO (3 días, producto sin uso con etiquetas, falla de fábrica, cómo solicitarlo). Revisar plazos y condiciones antes de publicar; está marcado con un comentario en el HTML.
- Menú, pie y navegación de escritorio enlazan a las páginas nuevas. El botón "Cómo llegar" aparece solo cuando se pegue el enlace exacto de Google Maps en ENLACES.maps.
- Los números de WhatsApp de todas las páginas salen del JSON del sistema.

# Fases 5 y 6 — Compartir y Medición
- Páginas por producto: `producto/<nombre>-<id>/` generadas por GitHub Actions (ver GUIA-GITHUB-ACTIONS.md). Cada una con título, descripción, foto 1200x630 y datos estructurados (Product).
- Enlaces compartidos usan siempre el dominio oficial (SITIO en config.js) y la ruta amigable. 404.html redirige productos nuevos que aún no tienen su página.
- enlaces.html: generador de enlaces con utm (interno, noindex).
- Eventos: whatsapp_click (link_location, attendant), map_click, social_click, product_share. Ver GUIA-MEDICION.md.
