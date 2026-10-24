"""Fail if dist/mmm-budget-optimizer.zip differs from skills/mmm-budget-optimizer/."""

import hashlib
import sys
import zipfile
from pathlib import Path

root = Path(__file__).resolve().parent.parent
skill = root / "skills"
folder = {
    str(p.relative_to(skill)): hashlib.sha256(p.read_bytes()).hexdigest()
    for p in (skill / "mmm-budget-optimizer").rglob("*")
    if p.is_file() and "__pycache__" not in p.parts
}
with zipfile.ZipFile(root / "dist" / "mmm-budget-optimizer.zip") as z:
    zipped = {n: hashlib.sha256(z.read(n)).hexdigest() for n in z.namelist() if not n.endswith("/")}
if folder != zipped:
    for name in sorted(set(folder) | set(zipped)):
        if folder.get(name) != zipped.get(name):
            print(f"differs: {name}")
    sys.exit("dist zip is stale: rebuild with `cd skills && zip -qr -X ../dist/mmm-budget-optimizer.zip mmm-budget-optimizer`")
print(f"zip matches skill folder ({len(folder)} files)")
