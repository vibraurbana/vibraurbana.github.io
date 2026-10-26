# Guía de medición (Fase 6)

Tu ID de Google Analytics 4 ya está en `assets/js/config.js` (GA_MEASUREMENT_ID). En localhost los eventos solo se ven en la consola.

## 1. Enlaces con origen
Abre `https://tiendavibraurbana.com/enlaces.html` (herramienta interna, no sale en Google ni en el menú). Elige producto y red (TikTok, Facebook, Instagram, Marketplace, WhatsApp) y copia el enlace o el texto listo para publicar. Termina en `?utm_source=tiktok&utm_medium=social&utm_campaign=...`. Usa SIEMPRE esos enlaces en tus publicaciones; sin utm, Google no sabe de dónde vino la visita (queda "directo").
Nota: TikTok solo permite enlace clicable en el perfil con cuenta Business o 1.000 seguidores; Marketplace puede limitar enlaces externos (prueba con un anuncio).

## 2. Eventos que registra la web
| Evento | Cuándo | Parámetros |
|---|---|---|
| view_item | ve una ficha de producto | producto, precio |
| add_to_cart / remove_from_cart / view_cart | carrito | producto |
| begin_checkout | toca "Enviar por WhatsApp" en el carrito | valor |
| generate_lead | el pedido se registró en el sistema | valor, origen |
| lead_not_registered / out_of_stock_attempt | el pedido no pudo registrarse / sin stock | - |
| product_inquiry | consulta por WhatsApp un producto | producto |
| whatsapp_click | cualquier enlace a WhatsApp | link_location, attendant (principal/alternativo), page_path |
| map_click | toca "Cómo llegar" | link_location, page_path |
| social_click | toca TikTok/Facebook/Instagram | network, link_location |
| product_share | comparte un producto | method (whatsapp/facebook/copiar) |
| search / search_no_results | busca en el catálogo | término |
| filter_used | usa un filtro | filtro |
| select_item | toca una tarjeta de producto | lista (home, similares, catálogo) |
No se usa `purchase`: la web no vende, recibe pedidos. Las ventas reales siguen en tu sistema.

## 3. Configurar Google Analytics (10 minutos, una vez)
1. Admin > Events > marca como **evento clave**: `generate_lead` y `whatsapp_click`.
2. Admin > Custom definitions > Create custom dimension (alcance: Event): `link_location`, `attendant`, `network`, `method`. (Tarda hasta 24 h en aparecer.)
3. Admin > DebugView para probar: abre la web, toca un botón y verifica que llega el evento (extensión "Google Analytics Debugger" de Chrome).

## 4. El informe que importa (Explore > Funnel exploration)
Pasos: `view_item` > `add_to_cart` > `begin_checkout` > `generate_lead`. Desglose: "Session source / medium".
Responde: "TikTok trae 80 visitas, ¿cuántas llegan a WhatsApp?, ¿y Marketplace?".
Complemento (Reports > Acquisition > Traffic acquisition): sesiones y eventos clave por fuente.

## 5. Cruce con el sistema (cada semana)
La web envía a tu sistema el **origen** de cada pedido registrado. Compara por fuente:
| Fuente | Visitas (GA) | generate_lead (GA) | Pedidos en el sistema | Ventas concretadas |
Si el sistema tiene más ventas que GA en una fuente, esa red vende por fuera de la web (mensajes directos); si tiene menos, hay pedidos que no se concretan. Esa diferencia es lo que muestra si la web ayuda a vender.
