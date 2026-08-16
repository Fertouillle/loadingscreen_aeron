"""Resize + recompress the loading screen background images to a sane web size."""
import os
from PIL import Image

SRC_DIR = os.path.join(os.path.dirname(__file__), "..", "assets", "img", "backgrounds")
MAX_WIDTH = 1920
JPEG_QUALITY = 78

for name in sorted(os.listdir(SRC_DIR)):
    if not name.lower().endswith(".png"):
        continue
    src_path = os.path.join(SRC_DIR, name)
    img = Image.open(src_path).convert("RGB")

    if img.width > MAX_WIDTH:
        ratio = MAX_WIDTH / img.width
        img = img.resize((MAX_WIDTH, int(img.height * ratio)), Image.LANCZOS)

    out_name = os.path.splitext(name)[0] + ".jpg"
    out_path = os.path.join(SRC_DIR, out_name)
    img.save(out_path, "JPEG", quality=JPEG_QUALITY, optimize=True)

    before = os.path.getsize(src_path) / 1024 / 1024
    after = os.path.getsize(out_path) / 1024 / 1024
    print(f"{name}: {before:.1f} MB -> {out_name}: {after:.1f} MB")

    os.remove(src_path)
