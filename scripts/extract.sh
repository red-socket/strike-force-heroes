#!/usr/bin/env bash
# Regenerate extracted/ and public/assets/ from original/strike-force-heroes.swf.
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
SWF="$ROOT/original/strike-force-heroes.swf"
OUT="$ROOT/extracted"
FF="$ROOT/tools/ffdec-cli"
mkdir -p "$OUT"

# 1. Tag dump + clean decompiled AS3 (strip §§push / if(false) junk-code obfuscation first).
"$FF" -dumpSWF "$SWF" > "$OUT/tags.txt"
"$FF" -deobfuscate max "$SWF" "$OUT/sfh-deobf.swf"
rm -rf "$OUT/scripts"
"$FF" -config autoDeobfuscate=1 -export script "$OUT/scripts" "$OUT/sfh-deobf.swf"

# 2. Assets the runtime pipeline consumes (shapes/morphs/texts as SVG, sounds, fonts, bitmaps).
rm -rf "$OUT/assets"
"$FF" -format shape:svg,morphshape:svg,image:png_gif_jpeg,sound:mp3_wav,text:plain,font:ttf \
  -export image,sound,shape,morphshape,text,font,symbolClass "$OUT/assets" "$SWF"
"$FF" -format text:svg -export text "$OUT/assets/texts-svg" "$SWF"
# Optional (3.5 GB): every sprite frame as SVG, handy for eyeballing animations.
if [[ "${SPRITES:-0}" == 1 ]]; then
  "$FF" -format sprite:svg -export sprite "$OUT/assets" "$SWF"
fi

mkdir -p "$OUT/maps"
# 3. Map data + 1:1 collision bitmaps (extracted/maps), then runtime assets (public/assets/).
python3 "$ROOT/tools/extract_maps.py" "$SWF" "$OUT/assets/symbolClass/symbols.csv" "$OUT/maps/maps.json"
python3 "$ROOT/tools/render_maps.py" "$SWF" "$OUT/assets/symbolClass/symbols.csv" "$OUT/maps/walls" --no-art
python3 "$ROOT/tools/pipeline/build_assets.py"
python3 "$ROOT/tools/pipeline/gen_frame_scripts.py"
