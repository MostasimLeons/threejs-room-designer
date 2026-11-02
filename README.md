# Room Designer

An interactive 3D **room configurator** that runs in the browser. Arrange furniture, pick sizes and styles, recolour pieces, change wall paint and floor material, then save and restore your designs.

Built with React, TypeScript, Vite, Three.js, React Three Fiber and Drei. Every 3D object and texture is generated in code, so the app has no model or image downloads.

## Features

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
- **Undo / Redo / Reset** covers furniture and finishes. Reset itself can be undone.
- **Perspective and Plan** (top-down) views.
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

| Command             | What it does                                                            |
| ------------------- | ----------------------------------------------------------------------- |
| `npm run dev`       | Starts the development server with instant reload                       |
| `npm run typecheck` | Checks the TypeScript types without building                            |
| `npm run build`     | Type-checks, then creates an optimised production build in `dist/`      |
| `npm run preview`   | Serves the `dist/` build locally so you can test it                     |

## Dependencies

| Package                       | Purpose                                                    |
| ----------------------------- | ---------------------------------------------------------- |
| `react`, `react-dom`          | User interface                                             |
| `three`                       | 3D engine (WebGL)                                          |
| `@react-three/fiber`          | Lets you write Three.js scenes as React components         |
| `@react-three/drei`           | Ready-made helpers: camera controls, rounded boxes, lines, lighting environment |
| `vite`, `@vitejs/plugin-react` | Development server and build tool (dev only)              |
| `typescript`, `@types/*`      | Type checking (dev only)                                   |

Exact versions are in `package.json`. `package-lock.json` pins them so every install is identical.

## How to use it

| Action            | How                                                                   |
| ----------------- | --------------------------------------------------------------------- |
| Rotate camera     | Left-drag empty space (Perspective view)                              |
| Pan               | Right-drag (Perspective) or drag empty space (Plan)                   |
| Zoom              | Mouse wheel                                                           |
| Select            | Click a piece, or its row in **Objects**                              |
| Deselect          | Click empty floor, press `Esc`, or click ✕                            |
| Move              | Drag the piece, use the Position sliders, or arrow keys: 5 cm per press, 25 cm with `Shift` |
| Rotate            | ⟲ / ⟳ buttons, slider, or `R` / `Shift+R`                             |
| Furniture options | Size / Style / Shape list in the right panel                          |
| Walls and floor   | Deselect everything (or click **Finishes** on the left), then use the **Room** panel |
| Undo / Redo       | Toolbar buttons, `Ctrl+Z` / `Ctrl+Y` (`Ctrl+Shift+Z` also redoes)     |
| Reset             | **Reset** puts furniture and finishes back to the start (undoable). **Reset view** moves only the camera. |
| Save / Load       | **Save / Load** opens the Designs window                              |

A whole drag, slider movement or held-down arrow key counts as **one** undo step.

### About saving

- **Saved in this browser:** designs are stored in your browser's `localStorage`, so they exist only in that browser on that computer. Clearing site data removes them.
- **Export file / Import file:** use these to back up a design, move it to another computer, or share it. Imported files are checked first: unknown furniture is skipped, and anything outside the room is moved back inside.

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
    FurnitureLayer.tsx     Draws furniture; click-to-select, drag-to-move, outlines
    Room.tsx               Floor, walls (with openings), skirting, rug, cutaway walls
    CameraRig.tsx          Perspective / Plan cameras and mouse controls
    Lighting.tsx           Lights, shadows, environment reflections
    finishes.ts            Wall colour presets and floor material options
    textures.ts            Procedural floor textures (planks, concrete, tiles)
    materials.ts           Shared materials
    roomConfig.ts          Room size and window/door positions
    parts.tsx              Reusable Block / Cylinder helpers
    furniture/
      catalog.ts           Furniture types, options, swatches, default layout,
                           "stay inside the room" and overlap checks
      FurnitureModel.tsx   Picks the 3D model for a furniture type
      useTintedMaterial.ts Per-piece copy of a material so recolouring is independent
      Sofa.tsx … Door.tsx  One procedural model per object
```

## Troubleshooting

| Problem | Fix |
| --- | --- |
| "The 3D view couldn't start" message | Your browser or GPU may not support WebGL. Update the browser or enable hardware acceleration. |
| `npm run dev` fails with a Node version error | Install Node 20.19+ or 22.12+. |
| Port 5173 is busy | Vite automatically picks the next free port. Use the URL it prints. |
| Saved designs disappeared | They live in the browser's storage, so clearing site data removes them. Keep exported `.json` files as backups. |

**Known harmless warning:** the browser console shows `THREE.Clock: This module has been deprecated`. It comes from inside React Three Fiber 9.8.2, the latest version at the time of writing, not from this project's code. It goes away when the library is updated.

## Known limitations

- Overlapping furniture is flagged but not blocked. You decide where things go.
- The window and door are fixed parts of the walls.
- There is no Add or Delete for furniture yet: the room always has the six starting pieces.

<!-- Last updated: 2026-11-02 12:11 UTC -->
