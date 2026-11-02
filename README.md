# Room Designer

An interactive 3D **room configurator** that runs in the browser. Arrange furniture, pick sizes and styles, recolour pieces, change wall paint and floor material, then save and restore your designs.

Built with React, TypeScript, Vite, Three.js, React Three Fiber and Drei. Every 3D object and texture is generated in code, so the app has no model or image downloads.

## Features

- **Select** furniture by clicking it in the 3D view or in the Objects list.
- **Move** furniture by dragging it across the floor or with the position sliders. It always stays inside the walls.
- **Rotate** with the 45° buttons, the slider, or `R` / `Shift+R`.
- **Customise** each piece:
  - furniture options, such as sofa size, table shape, chair style, TV size, plant size and lamp shade
  - colour swatches or a custom colour
- **Room finishes:**
  - six wall paint presets or a custom colour
  - five floor materials: oak, walnut, whitewashed ash, polished concrete and stone tiles
- **Undo / Redo / Reset** covers furniture and finishes. Reset itself can be undone.
- **Perspective and Plan** (top-down) views.
- **Save and restore:**
  - named saves in the browser
  - an automatic save, so a page reload keeps your room
  - `.json` export and import for backups and sharing

## Requirements

- [Node.js](https://nodejs.org/) 20.19+ or 22.12+ (npm comes with it)

Check your versions with:

```bash
node -v
npm -v
```

## Setup and run

```bash
git clone <your-repo-url>
cd ThreeJS_Room_Designer
npm install        # downloads dependencies into node_modules/ (first time only)
npm run dev        # starts the development server
```

Open **http://localhost:5173** in your browser. Press `Ctrl + C` in the terminal to stop the server.

### Other scripts

| Command           | What it does                                                   |
| ----------------- | -------------------------------------------------------------- |
| `npm run build`   | Type-checks with TypeScript, then creates an optimised build in `dist/` |
| `npm run preview` | Serves the `dist/` build locally so you can test it            |

## How to use it

| Action            | How                                                                   |
| ----------------- | --------------------------------------------------------------------- |
| Rotate camera     | Left-drag empty space (Perspective view)                              |
| Pan               | Right-drag (Perspective) or drag empty space (Plan)                   |
| Zoom              | Mouse wheel                                                           |
| Select            | Click a piece, or its row in **Objects**                              |
| Deselect          | Click empty floor, press `Esc`, or click ✕                            |
| Move              | Drag the selected piece, or use the Position sliders                  |
| Rotate            | ⟲ / ⟳ buttons, slider, or `R` / `Shift+R`                             |
| Furniture options | Size / Style / Shape list in the right panel                          |
| Walls and floor   | Deselect everything (or click **Finishes** on the left), then use the **Room** panel |
| Undo / Redo       | Toolbar buttons, `Ctrl+Z` / `Ctrl+Y` (`Ctrl+Shift+Z` also redoes)     |
| Reset             | **Reset** puts furniture and finishes back to the start (undoable). **Reset view** moves only the camera. |
| Save / Load       | **Save / Load** opens the Designs window                              |

### About saving

- **Saved in this browser:** designs are stored in your browser's `localStorage`, so they exist only in that browser on that computer. Clearing site data removes them.
- **Export file / Import file:** use these to back up a design, move it to another computer, or share it. Imported files are checked first: unknown furniture is skipped, and anything outside the room is moved back inside.

## Project structure

```
src/
  App.tsx                 Page layout, toolbar, keyboard shortcuts, autosave
  index.css               All UI styling
  components/
    Sidebar.tsx           Room stats, finishes summary, objects list
    PropertiesPanel.tsx   Furniture options/colour/rotation/position, or room finishes
    DesignsDialog.tsx     Save / load / export / import window
    ViewToggle.tsx        Perspective / Plan switch
  state/
    design.ts             The RoomDesign data type + validation of saved/imported data
    useDesignHistory.ts   Current design + undo/redo history
    storage.ts            localStorage saves, autosave, JSON export/import
  scene/
    Scene.tsx             The 3D canvas
    FurnitureLayer.tsx    Draws furniture; click-to-select and drag-to-move
    Room.tsx              Floor, walls (with openings), skirting, rug, cutaway walls
    finishes.ts           Wall colour presets and floor material options
    textures.ts           Procedural floor textures (planks, concrete, tiles)
    CameraRig.tsx         Perspective / Plan cameras and mouse controls
    Lighting.tsx          Lights, shadows, environment reflections
    materials.ts          Shared materials
    roomConfig.ts         Room size and window/door positions
    parts.tsx             Reusable Block / Cylinder helpers
    furniture/
      catalog.ts          Furniture types, options (variants), swatches, default layout
      FurnitureModel.tsx  Picks the 3D model for a furniture type
      *.tsx               One procedural model per object
```

## Known limitations

- Furniture can overlap, because there is no collision detection between pieces yet.
- The window and door are fixed parts of the walls.
- Saved designs live in one browser. Use Export to keep a permanent copy.
