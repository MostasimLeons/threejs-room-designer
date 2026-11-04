# Room Designer

An interactive 3D **room configurator** that runs in the browser. Arrange furniture, pick sizes and styles, recolour pieces, change wall paint and floor material, then save and restore your designs.

Built with React, TypeScript, Vite, Three.js, React Three Fiber and Drei. Every 3D object and texture is generated in code, so the app has no model or image downloads.

## Features

- **Two connected rooms in one house:**
  - **Living Room** (7 × 6 m): sofa, armchair, coffee table, TV unit, plant, floor lamp.
  - **Bedroom** (5 × 4 m, modern luxury): king bed with upholstered headboard, two bedside tables with lamps, sliding wardrobe, dressing table with mirror, accent chair, two plants, curtained window, oak slat accent wall and cream carpet.

  The rooms share a wall with an open connecting door. Use the **Living Room | Bedroom** switch above the 3D view to choose which room you see and edit. Each room has its own furniture, finishes and undo history.

- **Select** furniture by clicking it in the 3D view or in the Objects list.
- **Move** furniture by:
  - dragging it across the floor
  - using the position sliders
  - using the arrow keys

  It always stays inside the walls.

- **Rotate** with the 45° buttons, the slider, or `R` / `Shift+R`.
- **Overlap warnings:** pieces that overlap get a red outline, a ⚠ in the Objects list, and a message in the panel.
- **Customise** each piece:
  - furniture options, such as sofa size, table shape, chair style, TV size, plant size and lamp shade
  - named colour swatches or a custom colour
- **Room finishes:**
  - six wall paint presets or a custom colour
  - five floor materials: oak, walnut, whitewashed ash, polished concrete and stone tiles
- **Undo / Redo / Reset** covers furniture and finishes of the selected room. Reset itself can be undone.
- **Perspective and Plan** (top-down) views.
- **Realistic rendering**, all generated in code with no image downloads:
  - soft contact shadows where things meet (ambient occlusion)
  - a gentle glow around lamps, ceiling lights and the daylight in windows (bloom)
  - colour-accurate "Neutral" tone mapping, so paint and fabric look like their swatches
  - surface detail on floors (plank seams, grout, concrete) and on fabrics, rugs and curtains
  - polished concrete and stone tiles reflect the room
  - a ceiling with a glowing cove line and downlights. It's hidden while the camera is above the room and appears when you orbit down below 2.8 m.
- **Save and restore:**
  - named saves in the browser
  - an automatic save, so a page reload keeps your room
  - `.json` export and import for backups and sharing
- **Responsive** layout for desktop, tablet and phone.

## Requirements

- [Node.js](https://nodejs.org/) **20.19+ or 22.12+** (npm comes with it). This is required by Vite 8.
- A browser with WebGL 2, such as a current Chrome, Edge, Firefox or Safari.

Check your versions:

```bash
node -v
npm -v
```

## Setup and run

```bash
git clone https://github.com/MostasimLeons/threejs-room-designer.git
cd threejs-room-designer
npm install        # downloads dependencies into node_modules/ (first time only)
npm run dev        # starts the development server
```

Open **http://localhost:5173** in your browser. Press `Ctrl + C` in the terminal to stop the server.

### Scripts

| Command             | What it does                                                             |
| ------------------- | ------------------------------------------------------------------------ |
| `npm run dev`       | Starts the development server with instant reload                        |
| `npm run typecheck` | Checks the TypeScript types without building                             |
| `npm run build`     | Type-checks, then creates an optimised production build in `dist/`       |
| `npm run preview`   | Serves the `dist/` build locally so you can test it                      |
| `npm test`          | Runs the unit tests once (`npm run test:watch` re-runs them as you edit) |
| `npm run lint`      | Checks the code for likely bugs with Oxlint                              |
| `npm run format`    | Formats all files with Prettier (`format:check` only reports)            |
| `npm run check`     | Lint + format check + type check + tests. Run this before committing.    |

### Checking performance

Add `?perf` to the address, for example **http://localhost:5173/?perf**. A small readout appears in the bottom-left corner of the 3D view:

| Line                            | Meaning                                                                                                    |
| ------------------------------- | ---------------------------------------------------------------------------------------------------------- |
| frames                          | Frames drawn so far. The view only redraws when something changes, so this stands still while you're idle. |
| draw calls / triangles          | GPU work for the last frame, including shadow passes. Lower is faster.                                     |
| geometries / textures / shaders | What's loaded on the GPU. These should not keep growing while you edit.                                    |

It also works with `npm run preview`, which gives more realistic numbers than the dev server.

Measured in the Living Room with the default layout (draw calls and triangles depend on window size):

| Date       | Change                                                           | Draw calls | Triangles |
| ---------- | ---------------------------------------------------------------- | ---------- | --------- |
| 2026-11-04 | Phase 0 baseline                                                 | ~466       | ~166k     |
| 2026-11-04 | Phase 1: post-processing, ceilings, shadows drawn once per frame | ~560       | ~181k     |
| 2026-11-04 | Phase 1, with a polished concrete floor (reflection)             | ~640       | ~198k     |

The two shadow passes are still most of the cost. Without the once-per-frame shadow change, a reflective floor would add about 460 draw calls instead of about 85.

## Dependencies

| Package                                         | Purpose                                                                                                        |
| ----------------------------------------------- | -------------------------------------------------------------------------------------------------------------- |
| `react`, `react-dom`                            | User interface                                                                                                 |
| `three`                                         | 3D engine (WebGL)                                                                                              |
| `@react-three/fiber`                            | Lets you write Three.js scenes as React components                                                             |
| `@react-three/drei`                             | Ready-made helpers: camera controls, rounded boxes, lines, lighting environment, floor reflections             |
| `@react-three/postprocessing`, `postprocessing` | Image effects: ambient occlusion (N8AO), bloom, tone mapping, vignette, antialiasing (SMAA)                    |
| `vite`, `@vitejs/plugin-react`                  | Development server and build tool (dev only)                                                                   |
| `typescript`, `@types/*`                        | Type checking (dev only)                                                                                       |
| `vitest`                                        | Unit tests (dev only)                                                                                          |
| `oxlint`                                        | Linter (dev only). Used instead of ESLint because ESLint's TypeScript parser doesn't support TypeScript 7 yet. |
| `prettier`                                      | Code formatter (dev only)                                                                                      |

Exact versions are in `package.json`. `package-lock.json` pins them so every install is identical.

## How to use it

| Action            | How                                                                                                       |
| ----------------- | --------------------------------------------------------------------------------------------------------- |
| Rotate camera     | Left-drag empty space (Perspective view)                                                                  |
| Pan               | Right-drag (Perspective) or drag empty space (Plan)                                                       |
| Zoom              | Mouse wheel                                                                                               |
| Select            | Click a piece, or its row in **Objects**                                                                  |
| Deselect          | Click empty floor, press `Esc`, or click ✕                                                                |
| Move              | Drag the piece, use the Position sliders, or arrow keys: 5 cm per press, 25 cm with `Shift`               |
| Rotate            | ⟲ / ⟳ buttons, slider, or `R` / `Shift+R`                                                                 |
| Furniture options | Size / Style / Shape list in the right panel                                                              |
| Walls and floor   | Deselect everything (or click **Finishes** on the left), then use the **Room** panel                      |
| Undo / Redo       | Toolbar buttons, `Ctrl+Z` / `Ctrl+Y` (`Ctrl+Shift+Z` also redoes)                                         |
| Reset             | **Reset** puts furniture and finishes back to the start (undoable). **Reset view** moves only the camera. |
| Save / Load       | **Save / Load** opens the Designs window                                                                  |

A whole drag, slider movement or held-down arrow key counts as **one** undo step.

### About saving

- **Saved in this browser:** designs are stored in your browser's `localStorage`, so they exist only in that browser on that computer. Clearing site data removes them.
- **Export file / Import file:** use these to back up a design, move it to another computer, or share it. Imported files are checked first: unknown furniture is skipped, and anything outside the room is moved back inside.
- **Both rooms are always saved together:** saves, the autosave and exported files hold the whole house. Saves and files made before the Bedroom existed still load: they become the Living Room, and the Bedroom starts from its default layout.

## Project structure

```
src/
  main.tsx                 Entry point: mounts <App /> into index.html
  App.tsx                  Page layout and app state (design, selection, view)
  index.css                All UI styling (design tokens at the top)
  components/              2D interface
    Toolbar.tsx            Undo / Redo / Reset / Save buttons
    Sidebar.tsx            Room stats, finishes summary, objects list
    PropertiesPanel.tsx    Selected furniture: options, colour, rotation, position
    RoomPanel.tsx          Nothing selected: wall paint and floor material
    RoomSelector.tsx       Living Room / Bedroom switch
    ColorPicker.tsx        Swatch grid + custom colour (used by both panels)
    DesignsDialog.tsx      Save / load / export / import window
    ViewToggle.tsx         Perspective / Plan switch
    ErrorBoundary.tsx      Friendly message if the 3D view fails (e.g. no WebGL)
    icons.tsx              Small SVG icons
  hooks/
    useKeyboardShortcuts.ts  All keyboard shortcuts
  state/                   Data and logic, no 3D code
    design.ts              RoomDesign type + validation of saved/imported data
    useDesignHistory.ts    Current design + undo/redo history
    storage.ts             localStorage saves, autosave, JSON export/import
  utils/                   Small general-purpose helpers
    math.ts                clamp, angle helpers
    id.ts                  Unique ids (works on http:// too)
    download.ts            File download helper
  scene/                   Everything inside the 3D canvas
    Scene.tsx              The <Canvas> (renders only when something changes)
    DevStats.tsx           Performance readout shown with ?perf in the URL
    PostEffects.tsx        Ambient occlusion, bloom, tone mapping, vignette, antialiasing
    Ceiling.tsx            Ceiling with cove light line and downlights
    FurnitureLayer.tsx     Draws furniture; click-to-select, drag-to-move, outlines
    Room.tsx               Living Room: floor, walls (with openings), skirting, rug, cutaway walls
    Bedroom.tsx            Bedroom shell (floor, walls, curtained window, slat wall, carpet)
                           and the shared wall with the connecting door
    house.ts               House layout: room sizes and positions, shared wall, door, bedroom window
    CameraRig.tsx          Perspective / Plan cameras and mouse controls
    Lighting.tsx           Lights, shadows (drawn once per frame), procedural environment
    finishes.ts            Wall colour presets and floor material options
    textures.ts            Procedural textures: floor colour/normal/roughness maps, fabric weave
    materials.ts           Shared materials
    roomConfig.ts          Room size and window/door positions
    parts.tsx              Reusable Block / Cylinder helpers
    furniture/
      catalog.ts           Furniture types, options, swatches, default layout,
                           "stay inside the room" and overlap checks
      FurnitureModel.tsx   Picks the 3D model for a furniture type
      useTintedMaterial.ts Per-piece copy of a material so recolouring is independent
      Sofa.tsx … Door.tsx  One procedural model per object (Living Room)
      Bed.tsx, BedsideTable.tsx, Wardrobe.tsx,
      DressingTable.tsx, AccentChair.tsx   Bedroom models
```

Tests sit next to the code they check, as `*.test.ts` files. They cover undo/redo, reading saves and imported files, browser storage, and the furniture maths (staying inside the walls, overlaps, default layouts).

Tool settings: `.oxlintrc.json` (lint rules), `.prettierrc.json` (formatting), `vitest.config.ts` (tests).

## Troubleshooting

| Problem                                       | Fix                                                                                                             |
| --------------------------------------------- | --------------------------------------------------------------------------------------------------------------- |
| "The 3D view couldn't start" message          | Your browser or GPU may not support WebGL. Update the browser or enable hardware acceleration.                  |
| `npm run dev` fails with a Node version error | Install Node 20.19+ or 22.12+.                                                                                  |
| Port 5173 is busy                             | Vite automatically picks the next free port. Use the URL it prints.                                             |
| Saved designs disappeared                     | They live in the browser's storage, so clearing site data removes them. Keep exported `.json` files as backups. |

**Known harmless warning:** the browser console shows `THREE.Clock: This module has been deprecated`. It comes from inside React Three Fiber 9.8.2, the latest version at the time of writing, not from this project's code. It goes away when the library is updated.

## Known limitations

- Overlapping furniture is flagged but not blocked. You decide where things go.
- The window and door are fixed parts of the walls.
- There is no Add or Delete for furniture yet: each room always has its starting pieces.
- Furniture can't be moved from one room to the other.
- Ambient occlusion runs at full resolution. N8AO's faster half-resolution mode crashes with Three.js 0.187 (its multi-texture render target isn't compatible), so it stays off until N8AO is updated.
- Floor reflections aren't blurred. Drei's reflection blur creates two GPU images it never frees, so softness comes from a lower reflection resolution instead.
- The ceiling lights and lamp shades only glow; they don't light the room. Real lights for them come with the time-of-day work (Phase 3).
- Post-processing adds about 160 KB (gzipped) to the download. It's in its own `effects` file, so the browser caches it separately.

<!-- Last updated: 2026-11-04 10:46 UTC -->
