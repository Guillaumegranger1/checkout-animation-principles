#!/usr/bin/env bash
set -euo pipefail
# Build APNG or animated WebP from SVG frames in src/assets/svg-sequence
# Usage:
#   bash scripts/make-sequence-apng.sh apng   # writes public/images/check.apng
#   bash scripts/make-sequence-apng.sh webp   # writes public/images/check.webp
#
# Requirements (macOS):
#   brew install librsvg ffmpeg webp
#   # librsvg provides rsvg-convert (fast SVG->PNG)
#
# If you prefer ImageMagick: brew install imagemagick && set USE_IMAGEMAGICK=1

MODE="${1:-apng}" # apng|webp
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
SRC_DIR="$ROOT/src/assets/svg-sequence"
OUT_DIR="$ROOT/public/images"
TMP_DIR="$ROOT/tmp/sequence-png"
FPS="${FPS:-60}"
SIZE="${SIZE:-75}"   # target square size in px

mkdir -p "$TMP_DIR" "$OUT_DIR"
rm -f "$TMP_DIR"/*.png

echo "Rasterizing SVG frames to $TMP_DIR …"
shopt -s nullglob
frames=("$SRC_DIR"/*.svg)
if [[ ${#frames[@]} -eq 0 ]]; then
  echo "No SVG frames found in $SRC_DIR"; exit 1
fi

idx=0
for f in "${frames[@]}"; do
  printf -v name "frame_%04d.png" "$idx"
  if [[ -n "${USE_IMAGEMAGICK:-}" ]]; then
    # Fallback: ImageMagick (slower, but ubiquitous)
    magick -background none -density 384 "$f" -resize ${SIZE}x${SIZE} "$TMP_DIR/$name"
  else
    # Fast: librsvg
    rsvg-convert -w "$SIZE" -h "$SIZE" -a "$f" -o "$TMP_DIR/$name"
  fi
  idx=$((idx+1))
done
echo "Rasterized $idx frames."

# Optional: compress PNG frames to reduce APNG/WebP size if pngquant is available
if command -v pngquant >/dev/null 2>&1; then
  echo "Optimizing PNG frames with pngquant …"
  pngquant --force --ext .png --speed 1 --quality 65-95 "$TMP_DIR"/*.png >/dev/null 2>&1 || true
fi

if [[ "$MODE" == "apng" ]]; then
  OUT="$OUT_DIR/check.apng"
  echo "Packing APNG → $OUT"
  # -plays 1: play once; -framerate sets frame rate
  ffmpeg -y -framerate "$FPS" -i "$TMP_DIR/frame_%04d.png" -plays 1 -f apng "$OUT"
  echo "APNG written: $OUT"
elif [[ "$MODE" == "webp" ]]; then
  OUT="$OUT_DIR/check.webp"
  echo "Packing animated WebP → $OUT"
  # Workaround for environments where img2webp is blocked (e.g., Lockdown Mode):
  # Prefer ffmpeg by default. To force img2webp, set USE_IMG2WEBP=1.
  if [[ "${USE_IMG2WEBP:-0}" == "1" ]]; then
    if command -v img2webp >/dev/null 2>&1; then
      # img2webp uses -d (ms per frame). 1000/FPS ≈ 17 for 60fps.
      img2webp -loop 0 -d $((1000 / FPS)) "$TMP_DIR"/frame_*.png -o "$OUT"
    else
      echo "img2webp not found; falling back to ffmpeg."
      ffmpeg -y -framerate "$FPS" -i "$TMP_DIR/frame_%04d.png" -loop 0 -plays 0 -c libwebp -lossless 1 "$OUT"
    fi
  else
    # Default path: use ffmpeg’s webp muxer (works in restricted environments)
    ffmpeg -y -framerate "$FPS" -i "$TMP_DIR/frame_%04d.png" -loop 0 -plays 0 -c libwebp -lossless 1 "$OUT"
  fi
  echo "WebP written: $OUT"
else
  echo "Unknown mode: $MODE (use 'apng' or 'webp')"; exit 1
fi

echo "Done."


