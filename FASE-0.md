# Fase 0 — Base (sin cambio de diseño)

## Qué cambió en la web
- Logo e isotipo con fondo transparente (`logo-t`, `isotipo-t`): ya no se ve un recuadro negro sobre el fondo #111.
- Fuente de títulos: Archivo -> Montserrat (texto sigue en Inter). Solo 2 familias.
- Dominio: `CNAME`, canonical, og:url, JSON-LD, sitemap.xml y robots.txt apuntan a https://tiendavibraurbana.com
- Eventos GA4 renombrados (ver tabla). Hay que volver a marcar como evento clave `generate_lead` si aún no lo está.
- `data.js` oculta productos con `visible_web` = false/0 (campo nuevo y opcional del sistema).
- WhatsApp: sigue leyéndose solo de `meta.whatsapp_numero` y `meta.whatsapp_alternativo` del JSON. No hay números en los .html.

| Antes | Ahora |
|---|---|
| filtro_catalogo | filter_used |
| busqueda_sin_resultados | search_no_results |
| consulta_producto | product_inquiry |
| formulario_contacto | contact_form_submit |
| pedido_no_registrado | lead_not_registered |
| pedido_sin_stock | out_of_stock_attempt |

## Pendiente del lado del sistema (CI4)
1. `app/Config/CatalogoWeb.php`: `$origin` debe incluir `https://tiendavibraurbana.com` (y `https://vibraurbana.github.io` mientras convivan).
2. CORS de `catalogo.json` admite UN solo origen por cabecera. Para varios dominios, en `public/.htaccess`:
```
<IfModule mod_headers.c>
  SetEnvIfNoCase Origin "^https://(tiendavibraurbana\.com|www\.tiendavibraurbana\.com|vibraurbana\.github\.io)$" CORS_OK=$0
  <FilesMatch "^catalogo\.json$">
    Header set Access-Control-Allow-Origin "%{CORS_OK}e" env=CORS_OK
    Header append Vary "Origin"
  </FilesMatch>
</IfModule>
```
3. Al generar `catalogo.json`, agregar en `meta`: `whatsapp_numero` (el que atiende en ese momento: editable en el sistema, útil cuando se turnan en el live) y `whatsapp_alternativo`.
4. Agregar por producto `visible_web` (true/false).

## Orden para activar el dominio
1. GitHub > Settings > Pages > Custom domain = tiendavibraurbana.com (guardar).
2. Recién después, en el DNS: 4 registros A (185.199.108.153, .109.153, .110.153, .111.153) y un CNAME `www` -> vibraurbana.github.io.
3. Cuando GitHub lo permita (puede tardar hasta 24 h), activar Enforce HTTPS.
