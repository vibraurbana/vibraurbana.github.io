# Estante Virtual LIVE (web)

- `catalogo.json` trae una clave nueva `estante` (null si no hay LIVE publicado): `{ id, titulo, fecha, publicado_en, items: [{ numero, producto_id, color_id }] }`. Solo numeros y ids: foto, precio y stock salen de `productos` (una sola fuente).
- `estante.html` + `assets/js/render-estante.js` + `assets/css/estante.css`: portada LIVE, filtros por estilo (etiquetas), orden, busqueda por numero y tarjetas con circulo numerado.
- El circulo se dibuja con CSS (`.est-num`); los colores por numero estan en `assets/js/estante-num.js` y son los MISMOS que usa el sistema (Estante LIVE > Preparar). Si cambias uno, cambialo en los dos.
- Mientras haya estante publicado aparecen solos: enlace "Estante Virtual" (menu escritorio y movil, fila amarilla con LIVE), boton "Estante" en la barra inferior y el banner de la portada. Sin estante publicado todo desaparece y `estante.html` muestra "No hay un LIVE activo".
- Ficha de producto abierta desde el estante (`producto.html?id=..&n=..&color=..`): circulo con el numero, etiqueta NUEVO, precio amarillo, "Categoria", "Tambien te puede interesar" con los demas modelos del estante y banner final. El numero solo se muestra si de verdad corresponde a ese producto en el estante publicado.
- Se actualiza solo con el cron del sistema (cada 10 min): publicar o finalizar un LIVE se refleja en ese plazo.
