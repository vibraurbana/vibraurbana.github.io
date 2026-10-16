"""Descarga catalogo.json y todas sus imagenes desde el servidor remoto
a este repo (data/catalogo.json y uploads/productos/), para usar el modo local.
Ejecutar desde la raiz del repo:  python tools/descargar_catalogo.py
"""
import json, os, urllib.request

BASE = "https://cajasfuertescm.com/kidmodastore/public"

os.makedirs("data", exist_ok=True)
with urllib.request.urlopen(f"{BASE}/catalogo.json") as r:
    datos = json.loads(r.read().decode("utf-8"))
with open("data/catalogo.json", "w", encoding="utf-8") as f:
    json.dump(datos, f, ensure_ascii=False, indent=2)

rutas = {i for p in datos["productos"] for c in p["colores"] for i in c.get("imagenes", [])}
for p in datos["productos"]:
    for c in p["colores"]:
        if c.get("imagen_principal"):
            rutas.add(c["imagen_principal"])

fallos = 0
for ruta in sorted(rutas):
    if os.path.exists(ruta):
        continue
    os.makedirs(os.path.dirname(ruta), exist_ok=True)
    try:
        urllib.request.urlretrieve(f"{BASE}/{ruta}", ruta)
    except Exception as e:
        fallos += 1
        print("FALLO", ruta, e)
print(f"{len(rutas) - fallos} imagenes listas, {fallos} con error.")
