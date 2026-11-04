# Room Designer

An interactive 3D **room configurator** that runs in the browser. Arrange furniture, pick sizes and styles, recolour pieces, change wall paint and floor material, then save and restore your designs.

Built with React, TypeScript, Vite, Three.js, React Three Fiber and Drei. Every 3D object and texture is generated in code, so the app has no model or image downloads.

## Features

- **Five rooms, each its own 3D scene:**
  - **Living Room** (7 × 6 m): sofa, armchair, coffee table, TV unit, plant, floor lamp.
  - **Bedroom** (5 × 4 m, modern luxury): king bed with upholstered headboard, two bedside tables with lamps, sliding wardrobe, dressing table with mirror, accent chair, two plants, curtained window, oak slat accent wall and cream carpet.
  - **Dining Room** (4.5 × 4 m): rectangular or round dining table, six dining chairs (upholstered or spindle back), sideboard, plant, and a black pendant light over the table.
  - **Kitchen** (4 × 3.5 m): built-in units along the back wall (stone worktop, sink under the window, hob and extractor, splashback, wall units with an under-cabinet light), plus a movable island, three bar stools and a fridge (fridge-freezer or American style).
  - **Bathroom** (3 × 2.5 m): freestanding bath or walk-in shower, wall-hung vanity with basin(s) and mirror, towel rail, built-in toilet, tiled walls and a terrazzo floor.

  Pick a room in the **room bar** at the bottom of the 3D view, or press `1`–`5`. The view fades briefly and shows that room. Only the selected room is drawn, which keeps the app fast. Each room keeps its own furniture, finishes, lighting and undo history, and furniture never moves between rooms: a bed can only be in the Bedroom, a sofa only in the Living Room.

- **Select** furniture by clicking it in the 3D view or in the Objects list. The selected piece gets a blue 3D outline (parts hidden behind other things show in a darker blue).
- **Edit walls and the floor in 3D:** click a wall and a small picker opens right there: paint or tiles, six colours, and "Use on all walls". Each wall can have its own finish, so you can make one feature wall. Click the floor to pick its material the same way. The right-hand panel has the full options, including a custom colour and "Match the rest of the room".
- **Rotate ring:** the selected piece shows a blue ring with a handle in front. Drag the handle around to turn it in 15° steps (hold `Shift` for 1°). The ring is drawn on top, so furniture in the way can't hide it.
- **Move** furniture by:
  - dragging it across the floor
  - using the position sliders
  - using the arrow keys

  It always stays inside the walls.

- **Rotate** with the 45° buttons, the slider, or `R` / `Shift+R`.
- **Overlap warnings:** pieces that overlap each other, or a built-in unit such as the kitchen units or the toilet, get a red outline, a ⚠ in the Objects list, and a message in the panel (for example "Overlaps kitchen units").
- **Customise** each piece:
  - furniture options, such as sofa size, table shape, chair style, TV size, plant size and lamp shade
  - named colour swatches or a custom colour
- **Room finishes:**
  - walls in **paint** or glossy ceramic **tiles**, in six colour presets or a custom colour
  - seven floor materials: oak, walnut, whitewashed ash, polished concrete, stone tiles, white marble and terrazzo
- **Undo / Redo / Reset** covers furniture and finishes of the selected room. Reset itself can be undone.
- **Perspective and Plan** (top-down) views.
- **Time of day and sun:** click the clock button (☀ 2:30 PM) above the 3D view. Pick a preset (Sunrise, Morning, Midday, Golden hour, Dusk, Night) or drag the time slider from 5 AM to 9 PM, and turn the room to change which way its windows face. The sun moves from east to west and only shines in through the windows when it's on that side; a low sun is warm and orange, and the sky in the windows changes colour. As it gets dark the ceiling lights, lamps and bulbs come on, the room's own lights light it, and the backdrop turns night blue. Each room keeps its own time and orientation, and every change can be undone.
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

| Date       | Change                                                           | Draw calls  | Triangles |
| ---------- | ---------------------------------------------------------------- | ----------- | --------- |
| 2026-11-04 | Phase 0 baseline                                                 | ~466        | ~166k     |
| 2026-11-04 | Phase 1: post-processing, ceilings, shadows drawn once per frame | ~560        | ~181k     |
| 2026-11-04 | Phase 1, with a polished concrete floor (reflection)             | ~640        | ~198k     |
| 2026-11-04 | Phase 2: only the selected room is drawn                         | ~300        | ~91k      |
| 2026-11-04 | Phase 3, Dining Room (furnished)                                 | ~325        | ~81k      |
| 2026-11-04 | Phase 3, Kitchen (furnished, the heaviest room)                  | ~500        | ~76k      |
| 2026-11-04 | Phase 3, Bathroom (furnished, tiled walls)                       | ~320        | ~110k     |
| 2026-11-04 | Phase 4, by day (Living / Kitchen, the heaviest)                 | ~315 / ~510 |           |
| 2026-11-04 | Phase 4, at night (room lights on; about 60 more in every room)  | ~375 / ~570 |           |
| 2026-11-04 | Phase 5, something selected (outline redraws the scene's depth)  | ~410 / ~670 |           |

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

| Action             | How                                                                                                       |
| ------------------ | --------------------------------------------------------------------------------------------------------- |
| Rotate camera      | Left-drag empty space (Perspective view)                                                                  |
| Pan                | Right-drag (Perspective) or drag empty space (Plan)                                                       |
| Zoom               | Mouse wheel                                                                                               |
| Time of day        | Clock button above the 3D view, or the **Light** row under Finishes. Sliders and presets can be undone    |
| Switch room        | Click it in the room bar, or press `1`–`5`. With the bar focused, `←` / `→` move between rooms            |
| Select             | Click a piece, or its row in **Objects**                                                                  |
| Paint a wall       | Click the wall: pick paint/tiles and a colour in the picker that opens there                              |
| Change the floor   | Click the floor (if something is selected, the first click just deselects it)                             |
| Rotate by dragging | Drag the round handle on the blue ring (15° steps, `Shift` for 1°)                                        |
| Deselect           | Click empty floor, press `Esc`, or click ✕                                                                |
| Move               | Drag the piece, use the Position sliders, or arrow keys: 5 cm per press, 25 cm with `Shift`               |
| Rotate             | ⟲ / ⟳ buttons, slider, or `R` / `Shift+R`                                                                 |
| Furniture options  | Size / Style / Shape list in the right panel                                                              |
| Walls and floor    | Deselect everything (or click **Finishes** on the left), then use the **Room** panel                      |
| Undo / Redo        | Toolbar buttons, `Ctrl+Z` / `Ctrl+Y` (`Ctrl+Shift+Z` also redoes)                                         |
| Reset              | **Reset** puts furniture and finishes back to the start (undoable). **Reset view** moves only the camera. |
| Save / Load        | **Save / Load** opens the Designs window                                                                  |

A whole drag, slider movement or held-down arrow key counts as **one** undo step.

### About saving

- **Saved in this browser:** designs are stored in your browser's `localStorage`, so they exist only in that browser on that computer. Clearing site data removes them.
- **Export file / Import file:** use these to back up a design, move it to another computer, or share it. Imported files are checked first: unknown furniture is skipped, and anything outside the room is moved back inside.
- **All rooms are always saved together:** saves, the autosave and exported files hold the whole house. Older saves and files still load. Rooms they don't contain (for example the Dining Room, Kitchen and Bathroom in a save from before those rooms existed) start from their default design. A one-room file from the very first version becomes the Living Room. A Dining Room, Kitchen or Bathroom saved while it only had its starter plant is given the new furniture automatically, and keeps its paint and floor.

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
    RoomBar.tsx            Glass room bar at the bottom of the 3D view (icons, keyboard)
    SurfacePopover.tsx     Quick wall / floor picker that opens where you click in 3D
    WallPanel.tsx          Right-hand panel for a selected wall
    TimeOfDayPanel.tsx     Clock, presets, time slider and room orientation
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
    DevStats.tsx           Performance readout shown with ?perf in the URL (also window.roomDesigner3d for debugging)
    PostEffects.tsx        Ambient occlusion, bloom, tone mapping, vignette, antialiasing
    sun.ts                 Time of day: sun position, light colours and strengths, presets
    selection.ts           Selection ids for walls ("wall:back") and the floor ("floor")
    interiorLight.ts       Shares how "on" the room lights are (0 day … 1 night) with lamps
    Ceiling.tsx            Ceiling with cove light line and downlights
    FurnitureLayer.tsx     Draws furniture; click-to-select, drag-to-move, outlines
    RoomShell.tsx          Builds any room from its house.ts entry: floor, ceiling, 4 walls with windows/doors/skirting
    Cutaway.tsx            Hides walls (and the ceiling) that are between the camera and the room;
                           hidden walls still block the sun (shadow-only layer)
    walls.ts               Wall maths: placing walls, cutting openings, skirting runs, checks for bad openings
    rooms/decor.tsx        Built-in decor per room: rug, carpet, oak slat wall, curtains,
                           dining pendant, kitchen units, toilet
                           and the shared wall with the connecting door
    house.ts               Room registry: every room's size, windows, doors, lights, camera, default design
    CameraRig.tsx          Perspective / Plan cameras and mouse controls
    Lighting.tsx           Sun, fill and night room lights from sun.ts; shadows once per frame; environment
    finishes.ts            Wall colour presets and floor material options
    textures.ts            Procedural textures: floor colour/normal/roughness maps, fabric weave
    materials.ts           Shared materials
    roomConfig.ts          Ceiling height and wall thickness shared by all rooms
    parts.tsx              Reusable Block / Cylinder helpers
    furniture/
      catalog.ts           Furniture types, options, swatches, default layout,
                           "stay inside the room" and overlap checks
      FurnitureModel.tsx   Picks the 3D model for a furniture type
      useTintedMaterial.ts Per-piece copy of a material so recolouring is independent
      Sofa.tsx … Door.tsx  One procedural model per object (Living Room)
      Bed.tsx, BedsideTable.tsx, Wardrobe.tsx,
      DressingTable.tsx, AccentChair.tsx   Bedroom models
      DiningTable.tsx, DiningChair.tsx, Sideboard.tsx   Dining Room models
      KitchenIsland.tsx, BarStool.tsx, Fridge.tsx       Kitchen models
      Bathtub.tsx, Vanity.tsx, TowelRail.tsx            Bathroom models
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
- Furniture can't be moved from one room to the other, by design: each room keeps its own pieces.
- Doors between rooms are closed. Each room is a separate scene, so there's nothing to see through them.
- Built-in units (kitchen units, toilet, dining pendant) can't be moved or restyled. The pendant stays put if you move the dining table.
- Selecting something costs extra drawing while it's selected: the outline redraws the scene's depth (about 95 more draw calls in the Living Room, 165 in the Kitchen).
- The start camera doesn't adapt to a tall, narrow 3D view (a mid-size window with both panels open), so part of the room can be cropped. Zoom out or use Plan view.
- Ambient occlusion runs at full resolution. N8AO's faster half-resolution mode crashes with Three.js 0.187 (its multi-texture render target isn't compatible), so it stays off until N8AO is updated.
- Floor reflections aren't blurred. Drei's reflection blur creates two GPU images it never frees, so softness comes from a lower reflection resolution instead.
- At night each room has two real ceiling lights (plus the living-room floor lamp). The other lamps, the bedside lamps and the pendant only glow, because every extra light makes every material slower to draw.
- The sun model is a simple textbook one for a mid-latitude summer day (sunrise about 4:35, sunset about 19:25). It isn't tied to a real date or place.
- Post-processing adds about 160 KB (gzipped) to the download. It's in its own `effects` file, so the browser caches it separately.

<!-- Last updated: 2026-11-04 11:56 UTC -->
