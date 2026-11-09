#!/usr/bin/env python3
"""
Espejo de fotos: copia las fotos del catalogo al propio sitio (GitHub Pages) para no gastar
ancho de banda del servidor del sistema.

Por cada foto genera DOS versiones en WebP (liviano):
  - grande  (max. 1000 px): ficha del producto
  - mediana (max.  480 px): tarjetas, listados, estante, miniaturas
y las deja en  uploads/productos/<nombre>.webp  y  uploads/productos/m/<nombre>.webp.

- Descarga SOLO las fotos que aun no tiene (las demas salen de la cache entre corridas).
- espejo.json (v2) dice que fotos ya estan copiadas: la web usa la copia local si esta en esa
  lista y, si no (producto recien creado), la del servidor.
- Una foto que falle se omite (la web usara la del servidor); nunca rompe la publicacion.
- Las rutas que ya existan en el repo (carpeta uploads/ subida a mano) se aprovechan como origen:
  no se vuelven a descargar.
"""
import io, json, shutil
from concurrent.futures import ThreadPoolExecutor
from pathlib import Path, PurePosixPath

LADO_G, LADO_M = 1000, 480
CALIDAD_G, CALIDAD_M = 80, 76


def rutas_del_catalogo(cat):
    rutas = set()
    for p in cat.get("productos", []):
        for c in p.get("colores", []):
            for r in c.get("imagenes", []) or []:
                rutas.add(r)
            if c.get("imagen_principal"):
                rutas.add(c["imagen_principal"])
    # solo rutas relativas del sistema (las URL absolutas no se tocan)
    return sorted({r.lstrip("/") for r in rutas if r and not r.lower().startswith(("http://", "https://"))})


def nombres(ruta):
    """ruta del sistema -> (ruta grande, ruta mediana) del espejo."""
    pp = PurePosixPath(ruta)
    return str(pp.with_suffix(".webp")), str(pp.parent / "m" / (pp.stem + ".webp"))


def a_webp(img, lado, calidad):
    from PIL import Image
    copia = img.copy()
    copia.thumbnail((lado, lado))
    if copia.mode in ("RGBA", "LA", "P"):
        copia = copia.convert("RGBA")
    else:
        copia = copia.convert("RGB")
    buf = io.BytesIO()
    copia.save(buf, "WEBP", quality=calidad, method=4)
    return buf.getvalue()


def sincronizar(cat, base, out, cache, descargar, raiz=None):
    """Copia las fotos al sitio. Devuelve {ruta_original: {"g":..., "m":...}}."""
    from PIL import Image, ImageOps
    cache, out = Path(cache), Path(out)
    rutas = rutas_del_catalogo(cat)
    pendientes = [r for r in rutas if not all((cache / n).is_file() for n in nombres(r))]
    print(f"Espejo: {len(rutas)} fotos en el catalogo, {len(rutas) - len(pendientes)} ya en cache, {len(pendientes)} por procesar")

    def procesar(ruta):
        try:
            local = Path(raiz) / ruta if raiz else None
            datos = local.read_bytes() if local is not None and local.is_file() else descargar(f"{base}/{ruta}")
            img = ImageOps.exif_transpose(Image.open(io.BytesIO(datos)))
            g, m = nombres(ruta)
            for nombre, lado, cal in ((g, LADO_G, CALIDAD_G), (m, LADO_M, CALIDAD_M)):
                destino = cache / nombre
                destino.parent.mkdir(parents=True, exist_ok=True)
                destino.write_bytes(a_webp(img, lado, cal))
        except Exception as e:
            print(f"  aviso: no se copio {ruta} ({e.__class__.__name__}); se usara la del servidor")

    if pendientes and base:
        with ThreadPoolExecutor(max_workers=6) as ex:
            list(ex.map(procesar, pendientes))

    mapa = {r: dict(zip(("g", "m"), nombres(r))) for r in rutas if all((cache / n).is_file() for n in nombres(r))}

    # limpia de la cache lo que ya no esta en el catalogo
    vigentes = {n for v in mapa.values() for n in v.values()}
    if cache.is_dir():
        for f in cache.rglob("*"):
            if f.is_file() and f.relative_to(cache).as_posix() not in vigentes:
                f.unlink()

    total = 0
    for n in sorted(vigentes):
        destino = out / n
        destino.parent.mkdir(parents=True, exist_ok=True)
        shutil.copyfile(cache / n, destino)
        total += destino.stat().st_size
    (out / "espejo.json").write_text(json.dumps({"v": 2, "imagenes": mapa}, ensure_ascii=False), encoding="utf-8")
    print(f"Espejo: {len(mapa)} fotos publicadas en el sitio ({total / 1048576:.1f} MB en total)")
    return mapa
