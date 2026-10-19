# Strike Force Heroes

A re-implementation of the Flash game *Strike Force Heroes* in TypeScript, running in the browser with
[PixiJS](https://pixijs.com/) and [planck.js](https://piqnt.com/planck.js/), built with Vite.

The game logic is a faithful port of the original ActionScript 3; the original art, animation timelines,
sounds and fonts are converted from the SWF into `public/assets/`.

## Run

```bash
npm install
npm run dev        # http://127.0.0.1:5173/
```

`npm run build` produces a static build in `dist/`.

Controls: WASD / arrow keys to move, W / Space to jump, mouse to aim and shoot, R to reload,
Q / Shift / mouse wheel to swap weapons, E / Ctrl for killstreaks, Esc / P to pause.

## Rebuilding the assets from the SWF

`public/assets/` is generated. To regenerate it you need the original `strike-force-heroes.swf` in
`original/`, plus [JPEXS FFDec](https://github.com/jindrapetrik/jpexs-decompiler) (in `tools/ffdec`, run with a
Java 21 runtime in `tools/jre`), `rsvg-convert`, Python 3 and Pillow:

```bash
scripts/extract.sh
```

## Layout

| Path | Contents |
|---|---|
| `src/swf/` | Flash timeline runtime on PixiJS (MovieClips, shapes, morphs, text, buttons, masks, filters) |
| `src/flash/` | Flash API compatibility (AS3 number semantics, BitmapData, sound, SharedObject, input helpers) |
| `src/game/` | The game, ported class by class from the original ActionScript |
| `tools/pipeline/` | SWF parser and asset build (atlases, sounds, fonts, timelines, frame scripts) |
| `tools/*.py` | Map data extraction and collision-bitmap rendering |
| `reference/` | Page for playing the original SWF with Ruffle, for comparison |
| `public/assets/` | Generated runtime assets |
