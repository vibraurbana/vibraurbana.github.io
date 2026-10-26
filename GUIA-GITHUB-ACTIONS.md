# Guía: publicar con GitHub Actions (Fase 5)

## Qué es GitHub Actions
Un "robot" gratuito de GitHub. Tú le dejas una receta (`.github/workflows/publicar.yml`) y él la ejecuta en un servidor de GitHub cuando ocurre algo: subes cambios, pasan 3 horas o tocas un botón.
Nuestra receta hace 4 cosas: (1) lee el `catalogo.json` real de tu sistema, (2) crea una página por producto con su nombre, precio y foto para la vista previa, (3) arma el `sitemap.xml`, (4) publica todo en tu dominio.

## Por qué hace falta
GitHub Pages solo sirve archivos ya hechos. Las vistas previas de WhatsApp, Facebook y TikTok no ejecutan JavaScript, así que `producto.html?id=4` siempre mostraría el mismo título y foto. Con una página real por producto, cada enlace se ve con su foto y precio.

## Qué se genera (no se sube a tu repositorio)
- `producto/<nombre>-<id>/index.html` (una por producto)
- `og/<id>.jpg` (imagen 1200x630, ~50-100 KB, para la vista previa)
- `sitemap.xml` actualizado
Todo se crea en cada ejecución y se publica directo; tu repositorio no crece.

## Configuración (una sola vez)
1. **El repositorio debe ser público** (o tener plan de pago). Mira abajo "Precio".
2. Sube los archivos de este zip a la raíz del repositorio (incluida la carpeta oculta `.github`).
   ```
   git add .
   git commit -m "Nuevo diseño, paginas de producto y medicion"
   git push origin main
   ```
   Si trabajas desde la web de GitHub: Add file > Upload files (arrastra también `.github/workflows/publicar.yml`; si no deja subir carpetas ocultas, usa Add file > Create new file y escribe la ruta `.github/workflows/publicar.yml`).
3. En GitHub: **Settings > Pages > Build and deployment > Source: "GitHub Actions"**. (Antes decía "Deploy from a branch".)
   El dominio personalizado `tiendavibraurbana.com` ya configurado se mantiene.
4. Ve a la pestaña **Actions**. Verás "Publicar sitio" ejecutándose (1-3 minutos). Debe terminar en verde.
5. Abre `https://tiendavibraurbana.com/producto/` + el nombre de un producto, o mira `sitemap.xml`.

## Uso diario
- **Se actualiza solo** cada 3 horas y cada vez que subes cambios.
- **Actualizar ya** (por ejemplo, tras subir 10 productos antes de un live): Actions > Publicar sitio > **Run workflow**.
- Mientras un producto nuevo no tenga su página (máximo ~3 horas), su enlace igual funciona: se redirige a la ficha (sin foto personalizada en la vista previa).

## Probar en tu computadora
```
pip install pillow
python tools/generar_paginas.py --out _site
python -m http.server 8000 --directory _site
```
Abre http://localhost:8000. Para probar sin internet: `--json data/catalogo.json --sin-imagenes`.

## Si algo falla
- **Actions en rojo > "ERROR: el catalogo no trae productos"** o error de red: el sitio publicado NO se pisa, sigue la versión anterior. Revisa que `catalogo.json` abra en el navegador.
- **La vista previa no cambia en WhatsApp/Facebook:** tienen caché. Para forzar: Facebook "Sharing Debugger" (developers.facebook.com/tools/debug) > Scrape Again, o agrega `&v=2` al enlace.
- **Programación detenida:** GitHub desactiva las ejecuciones programadas de repositorios públicos sin actividad por ~60 días. Si pasa, Actions > Publicar sitio > Enable workflow (o cualquier cambio al repositorio lo reactiva).

## Opcional: que tu sistema lo dispare al guardar productos
Crea un token en GitHub (Settings > Developer settings > Fine-grained tokens, solo este repositorio, permiso "Contents: Read and write") y desde el sistema (PHP/CI4) llama:
```
curl -X POST https://api.github.com/repos/USUARIO/REPOSITORIO/dispatches \
  -H "Accept: application/vnd.github+json" \
  -H "Authorization: Bearer TU_TOKEN" \
  -d '{"event_type":"catalogo-actualizado"}'
```
El token es secreto: guárdalo en el `.env` del sistema, nunca en la web.

## Precio (verificado en la documentación de GitHub, octubre 2026)
- **Repositorio público: gratis**, sin límite de minutos con los servidores estándar de GitHub.
- Repositorio privado: GitHub Free incluye 2.000 minutos/mes (Pro: 3.000); pasado ese tope se detiene o se cobra, según tu límite de gasto (por defecto 0 USD = se detiene, no cobra). Además, **GitHub Pages en repositorios privados exige plan de pago (Pro/Team)**.
- Nuestro uso: ~1-3 minutos por ejecución x ~8 al día = ~240-720 min/mes.
- **"¿Y si se llena de páginas?"** Actions no cobra por página. Lo único que crece es el tiempo de cada ejecución (por descargar las fotos): 80 productos ~1-2 min; 1.000 productos quizá ~10-15 min. En repositorio público sigue siendo gratis.
- Límites de GitHub Pages: sitio publicado máx. 1 GB (nuestras páginas pesan ~5 KB + ~80 KB de imagen por producto: 1.000 productos ~ 85 MB), tráfico "suave" de 100 GB/mes, y cada publicación debe terminar en menos de 10 minutos. El límite de 10 publicaciones por hora no aplica a un flujo con Actions.
- GitHub anunció cambios de precios de Actions para 2026 (rebaja de servidores y un cargo a servidores propios, luego pospuesto); en repositorios públicos con servidores estándar seguirá gratis. Confírmalo en docs.github.com/billing si cambia.
