#!/usr/bin/env bash
# Process a photograph into the responsive WebP trio the site expects.
#
#   scripts/images.sh <source-image> <slug> [output-dir]
#
# Writes <slug>-768.webp, <slug>-1280.webp and <slug>.webp, matching the naming
# already used by main_sanctuary / sanctuary-bungalows / offering-temazcal. The
# gallery's srcset entries assume exactly these three files.
#
# Uses ffmpeg with libwebp, which is a SYSTEM tool — deliberately not an npm
# dependency, so package.json stays at zero runtime dependencies and the build
# needs nothing extra.
#
#   scripts/images.sh ~/photos/ceremony-fire.jpg ceremony-fire
#   -> static/images/gallery/ceremony-fire{-768,-1280,}.webp
set -euo pipefail

SRC=${1:?usage: images.sh <source-image> <slug> [output-dir]}
SLUG=${2:?usage: images.sh <source-image> <slug> [output-dir]}
OUT=${3:-static/images/gallery}

command -v ffmpeg >/dev/null || { echo "ffmpeg not found" >&2; exit 1; }
ffmpeg -hide_banner -encoders 2>/dev/null | grep -q libwebp || {
  echo "this ffmpeg has no libwebp encoder" >&2; exit 1
}

mkdir -p "$OUT"

# -2 keeps the height even and preserves the aspect ratio.
ffmpeg -y -loglevel error -i "$SRC" -vf scale=768:-2  -c:v libwebp -quality 82 "$OUT/$SLUG-768.webp"
ffmpeg -y -loglevel error -i "$SRC" -vf scale=1280:-2 -c:v libwebp -quality 82 "$OUT/$SLUG-1280.webp"
ffmpeg -y -loglevel error -i "$SRC"                   -c:v libwebp -quality 88 "$OUT/$SLUG.webp"

echo "wrote:"
for f in "$OUT/$SLUG-768.webp" "$OUT/$SLUG-1280.webp" "$OUT/$SLUG.webp"; do
  printf '  %-56s %8s  %s\n' "$f" "$(du -h "$f" | cut -f1)" \
    "$(ffprobe -v error -select_streams v:0 -show_entries stream=width,height -of csv=p=0 "$f")"
done

cat <<EOF

Add to the plates array in src/lib/components/GallerySection.svelte:

  {
    slug: '$SLUG',
    src: '/images/gallery/$SLUG.webp',
    srcset:
      '/images/gallery/$SLUG-768.webp 768w, /images/gallery/$SLUG-1280.webp 1280w, /images/gallery/$SLUG.webp $(ffprobe -v error -select_streams v:0 -show_entries stream=width -of csv=p=0 "$OUT/$SLUG.webp")w',
    width: $(ffprobe -v error -select_streams v:0 -show_entries stream=width -of csv=p=0 "$OUT/$SLUG.webp"),
    height: $(ffprobe -v error -select_streams v:0 -show_entries stream=height -of csv=p=0 "$OUT/$SLUG.webp"),
    alt: 'DESCRIBE what the image shows, for screen readers',
    title: 'TITLE',
    caption: 'CAPTION',
    hue: 'clay',
  },
EOF
