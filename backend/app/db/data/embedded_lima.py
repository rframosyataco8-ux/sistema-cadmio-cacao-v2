"""Datos embebidos del Excel Lima Cadmio."""
from pathlib import Path
import json, zlib, base64

def load_embedded_data():
    base = Path(__file__).resolve().parent
    parts = []
    i = 0
    while True:
        p = base / f"lima_b64_{i}.txt"
        if not p.exists():
            break
        parts.append(p.read_text(encoding="ascii").strip())
        i += 1
    if not parts:
        raise FileNotFoundError("Faltan lima_b64_*.txt")
    raw = zlib.decompress(base64.b64decode("".join(parts)))
    return json.loads(raw.decode("utf-8"))
