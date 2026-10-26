#!/usr/bin/env python3
"""
Genera el sitio publicable de VIBRA URBANA:
  - una pagina por producto:  producto/<nombre>-<id>/index.html  (titulo, descripcion y foto
    propios para WhatsApp / Facebook / TikTok / Google)
  - una imagen de vista previa 1200x630 por producto:  og/<id>.jpg
  - sitemap.xml con todas las paginas
Lee el catalogo.json REAL del sistema (la URL sale de assets/js/config.js) o uno local.

Uso:
  python tools/generar_paginas.py --out _site
  python tools/generar_paginas.py --json data/catalogo.json --out _site     (pruebas locales)
Requiere: Python 3.9+ y Pillow (pip install pillow).
Si no puede leer el catalogo, TERMINA CON ERROR: asi el sitio ya publicado no se pisa con uno vacio.
"""
import argparse, html, io, json, re, shutil, sys, time, unicodedata, urllib.request
from concurrent.futures import ThreadPoolExecutor
from pathlib import Path

RAIZ = Path(__file__).resolve().parent.parent
EXCLUIR = {".git", ".github", "tools", "data", "_site", "node_modules", "__pycache__", ".gitignore"}
PAGINAS = ["", "catalogo.html", "como-comprar.html", "envios.html", "visitanos.html",
           "cambios-devoluciones.html", "contacto.html"]
UA = {"User-Agent": "Mozilla/5.0 (VibraUrbana-SiteBuilder)"}


def leer_config():
    txt = (RAIZ / "assets/js/config.js").read_text(encoding="utf-8")
    base = re.search(r'^export const CATALOGO_BASE_URL = "([^"]*)";', txt, re.M)
    sitio = re.search(r'^export const SITIO = "([^"]*)";', txt, re.M)
    return (base.group(1).rstrip("/") if base else ""), (sitio.group(1).rstrip("/") if sitio else "")


def slug(texto):  # IDENTICA a slug() de assets/js/slug.js
    s = unicodedata.normalize("NFD", str(texto or "").lower())
    s = "".join(c for c in s if not unicodedata.combining(c))
    s = re.sub(r"[^a-z0-9]+", "-", s).strip("-")[:60].rstrip("-")
    return s or "producto"


def descargar(url, intentos=3, espera=3):
    for i in range(intentos):
        try:
            with urllib.request.urlopen(urllib.request.Request(url, headers=UA), timeout=30) as r:
                return r.read()
        except Exception as e:
            if i == intentos - 1:
                raise
            time.sleep(espera * (i + 1))


def cargar_catalogo(origen, base):
    if origen:
        if re.match(r"https?://", origen):
            datos = descargar(origen)
        else:
            datos = Path(origen).read_bytes()
    elif base:
        datos = descargar(base + "/catalogo.json")
    else:
        datos = (RAIZ / "data/catalogo.json").read_bytes()
    cat = json.loads(datos)
    cat["productos"] = [p for p in cat.get("productos", [])
                        if p.get("activo") is not False and p.get("visible_web") not in (False, 0, "0")]
    if not cat["productos"]:
        sys.exit("ERROR: el catalogo no trae productos; no se publica nada.")
    return cat


def variantes(p):
    return [v for c in p.get("colores", []) for v in c.get("variantes", [])]


def stock(p):
    return sum(max(0, int(v.get("stock") or 0)) for v in variantes(p))


def precio_min(p):
    precios = [float(v["precio"]) for v in variantes(p) if v.get("precio") is not None]
    return min(precios) if precios else None


def tallas_con_stock(p):
    ts = {str(v["talla"]) for v in variantes(p) if int(v.get("stock") or 0) > 0 and v.get("talla")}
    def clave(t):
        try: return (0, float(t))
        except ValueError: return (1, ["XXS", "XS", "S", "M", "L", "XL", "XXL", "XXXL"].index(t.upper()) if t.upper() in ["XXS", "XS", "S", "M", "L", "XL", "XXL", "XXXL"] else 99)
    return sorted(ts, key=clave)


def imagen_principal(p):
    cs = p.get("colores", [])
    for c in sorted(cs, key=lambda c: 0 if any(int(v.get("stock") or 0) > 0 for v in c.get("variantes", [])) else 1):
        if c.get("imagen_principal"):
            return c["imagen_principal"]
    return ""


def url_imagen(ruta, base):
    if not ruta: return ""
    if re.match(r"https?://", ruta): return ruta
    return f"{base}/{ruta.lstrip('/')}" if base else ""


def hacer_og(url, destino):
    """Descarga la foto y la deja en 1200x630 (liviana: WhatsApp descarta imagenes muy pesadas)."""
    from PIL import Image
    try:
        img = Image.open(io.BytesIO(descargar(url))).convert("RGB")
    except Exception as e:
        print(f"  aviso: sin imagen ({e.__class__.__name__}) {url}")
        return False
    lienzo = Image.new("RGB", (1200, 630), (245, 246, 248))
    img.thumbnail((1100, 580))
    lienzo.paste(img, ((1200 - img.width) // 2, (630 - img.height) // 2))
    destino.parent.mkdir(parents=True, exist_ok=True)
    lienzo.save(destino, "JPEG", quality=82, optimize=True)
    return True


def esc(t):
    return html.escape(str(t), quote=True)


def pagina_producto(plantilla, p, sitio, moneda, con_og):
    nombre = p["nombre"]
    ruta = f"producto/{slug(nombre)}-{p['id']}/"
    url = f"{sitio}/{ruta}"
    precio = precio_min(p)
    tallas = tallas_con_stock(p)
    hay = stock(p) > 0
    partes = [f"{nombre}" + (f" a {moneda} {precio:,.0f}".replace(",", ".") if precio else "")]
    if tallas: partes.append("Tallas " + (tallas[0] if len(tallas) == 1 else f"{tallas[0]}–{tallas[-1]}"))
    partes.append("Consulta por WhatsApp. Comercial Cañoto, Local #163, Santa Cruz de la Sierra.")
    desc = ". ".join(partes)
    titulo = f"{nombre}" + (f" — {moneda} {precio:,.0f}".replace(",", ".") if precio else "") + " | VIBRA URBANA"
    img = f"{sitio}/og/{p['id']}.jpg" if con_og else f"{sitio}/assets/img/og-cover.jpg"
    ld = {"@context": "https://schema.org", "@type": "Product", "name": nombre, "image": [img],
          "description": desc, "brand": {"@type": "Brand", "name": "VIBRA URBANA"},
          "offers": {"@type": "Offer", "url": url, "priceCurrency": "BOB",
                     "availability": "https://schema.org/" + ("InStock" if hay else "OutOfStock"),
                     **({"price": f"{precio:.0f}"} if precio else {})}}
    cab = f"""<base href="/">
<link rel="canonical" href="{url}">
<meta property="og:type" content="product">
<meta property="og:url" content="{url}">
<meta property="og:title" content="{esc(titulo)}">
<meta property="og:description" content="{esc(desc)}">
<meta property="og:image" content="{img}">
<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="630">
<meta name="twitter:card" content="summary_large_image">
<script type="application/ld+json">{json.dumps(ld, ensure_ascii=False)}</script>
<script>window.PRODUCTO_ID = {int(p['id'])};</script>
"""
    s = plantilla
    s = re.sub(r"<title>.*?</title>", f"<title>{esc(titulo)}</title>", s, count=1, flags=re.S)
    s = re.sub(r'<meta name="description" content="[^"]*">', f'<meta name="description" content="{esc(desc)}">', s, count=1)
    s = re.sub(r'<meta property="og:image" content="[^"]*">\s*', "", s, count=1)
    s = s.replace('<meta charset="UTF-8">', '<meta charset="UTF-8">\n' + cab, 1)
    return ruta, s


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--json", help="URL o ruta del catalogo.json (por defecto: el de config.js)")
    ap.add_argument("--out", default="_site")
    ap.add_argument("--sin-imagenes", action="store_true", help="no descargar fotos (pruebas)")
    a = ap.parse_args()

    base, sitio = leer_config()
    if not sitio: sys.exit("ERROR: falta SITIO en assets/js/config.js")
    out = (RAIZ / a.out).resolve()
    if out.exists(): shutil.rmtree(out)
    shutil.copytree(RAIZ, out, ignore=lambda d, n: [x for x in n if x in EXCLUIR or x.endswith(".md")])

    cat = cargar_catalogo(a.json, base)
    moneda = cat.get("meta", {}).get("moneda", "Bs")
    prods = cat["productos"]
    print(f"{len(prods)} productos visibles")

    plantilla = (RAIZ / "producto.html").read_text(encoding="utf-8")

    def og(p):
        url = url_imagen(imagen_principal(p), base)
        return p["id"], bool(url and not a.sin_imagenes and hacer_og(url, out / "og" / f"{p['id']}.jpg"))
    with ThreadPoolExecutor(max_workers=8) as ex:
        con_og = dict(ex.map(og, prods))

    urls = [f"{sitio}/{u}" for u in PAGINAS]
    for p in prods:
        ruta, contenido = pagina_producto(plantilla, p, sitio, moneda, con_og.get(p["id"], False))
        destino = out / ruta / "index.html"
        destino.parent.mkdir(parents=True, exist_ok=True)
        destino.write_text(contenido, encoding="utf-8")
        urls.append(f"{sitio}/{ruta}")

    (out / "sitemap.xml").write_text(
        '<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n'
        + "".join(f"  <url><loc>{u}</loc></url>\n" for u in urls) + "</urlset>\n", encoding="utf-8")
    print(f"OK: {len(prods)} paginas de producto, {sum(con_og.values())} imagenes de vista previa -> {out}")


if __name__ == "__main__":
    main()
