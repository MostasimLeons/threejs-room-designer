# Room Designer

An interactive 3D **room configurator** that runs in the browser. Arrange furniture, pick sizes and styles, recolour pieces, change wall paint and floor material, then save and restore your designs.

Built with React, TypeScript, Vite, Three.js, React Three Fiber and Drei. Rooms, textures and most furniture are generated in code. Thirteen furniture options use real 3D models (CC0, from [Poly Haven](https://polyhaven.com)), optimised to 2.5 MB in total; see **3D models** below.

## Features

- **Six rooms, each its own 3D scene:**
  - **Living Room** (7 × 6 m): sofa, armchair, coffee table, TV unit, plant, floor lamp.
  - **Bedroom** (5 × 4 m, modern luxury): king bed with upholstered headboard, two bedside tables with lamps, sliding wardrobe, dressing table with mirror, accent chair, two plants, curtained window, oak slat accent wall and cream carpet.
  - **Dining Room** (4.5 × 4 m): rectangular or round dining table, six dining chairs (upholstered or spindle back), sideboard, plant, and a black pendant light over the table.
  - **Kitchen** (4 × 3.5 m): built-in units along the back wall (stone worktop, sink under the window, hob and extractor, splashback, wall units with an under-cabinet light), plus a movable island, three bar stools and a fridge (fridge-freezer or American style).
  - **Bathroom** (3 × 2.5 m): freestanding bath or walk-in shower, wall-hung vanity with basin(s) and mirror, towel rail, built-in toilet, tiled walls and a terrazzo floor.
  - **Office** (4.5 × 4 m): a work desk under a wide window with an ergonomic office chair tucked in, a PC tower and a drawer unit under the desk, a 27″ monitor, keyboard and mouse and a desk lamp on it, a bookshelf, a plant, a floor lamp, a framed print and a wall clock. Sage walls, oak floor.

  Pick a room in the **room bar** at the bottom of the 3D view, or press `1`–`6`. The view fades briefly and shows that room. Only the selected room is drawn, which keeps the app fast. Each room keeps its own furniture, finishes, lighting and undo history. Pieces only go in rooms where they belong: a bed only in the Bedroom, a sofa only in the Living Room, while a plant or a chair can move around (see **Move to another room** below).

- **Add furniture:** **+ Add** in the Objects list opens a catalog of every piece that belongs in the room, grouped by category (Seating, Tables & desks, Beds, Storage, Office, Lighting, Plants & decor, Kitchen, Bathroom) with chips to show one category. Each piece has a small 3D picture (drawn in your browser the first time the catalog opens). Click one and it's placed at a free spot and selected, ready to drag into place. If the default option has no room, the first option that fits is used instead (for example a round dining table in a busy kitchen), and the message says so.
- **43 kinds of furniture** (Phase 10 added nine and several new options; Phase 11 added three that hang on a wall; Phase 15 added two that go under a desk; Phase 16 added two for the Office; Phase 17 added seven for on and around the desk):
  - Seating: sofa, **corner sofa** (chaise left or right), armchair, accent chair, **ottoman** (round pouf or leather footstool), dining chair (now also **leather**), bar stool, **desk chair** (swivel or upholstered), **bench** (upholstered or wooden)
  - Tables & desks: coffee table (now also **square, carved top**), **side table** (round or wooden cube), **desk** (120 or 100 cm), dining table (now also **long, 220 cm for eight**), bedside table, dressing table
  - Beds: king, queen, **double** and **single**
  - Storage: TV unit, wardrobe, sideboard, **bookshelf** (open shelves or 200 cm wall shelving), **chest of drawers** (low, or tall steel frame)
  - Bathroom: bath or shower, vanity, towel rail, **bathroom cabinet** (tall or low)
  - Office: **office desk** (straight 160 × 80, compact 120 × 70, or a sit-stand desk you can raise to 125 cm with the Size card), **office chair** (ergonomic with headrest, or task chair), **drawer unit** (on castors, 58 cm tall, or desk height with a file drawer) and **PC tower** (mid tower or small form factor). In the Office, Bedroom and Living Room. The Office also takes the desk and desk chair, bookshelf, plants, floor lamps, side tables, accent chairs, wall art, wall shelves and mirrors.
  - On a desk or table: **monitor** (24″, 27″, ultrawide 34″ or two 24″), **laptop** (open or on a stand), **keyboard and mouse** (full size or compact), **desk lamp** (arm or dome; it lights the desk in the evening) and **desk accessories** (an organiser with a pen pot, notepad and phone, or a small plant). The PC tower can stand on a desk too.
  - Storage: **filing cabinet** (2 or 3 drawers)
  - On the wall: **wall art** (portrait, landscape or a set of three prints), **mirror** (round or tall), **wall shelf** (floating, or two shelves on brackets), **wall clock** (Ø 30 or 40 cm)

  Pieces that suit several rooms can go in each of them (a bench in the Bedroom, Dining Room, Kitchen or Living Room); a bed or bath still only goes in its own room.

- **Delete, duplicate and move between rooms:** the **Actions** card in the right panel (or `Delete` / `Backspace` and `Ctrl+D`). A copy is put at a free spot next to the original. **Move to another room** lists the other rooms where the piece belongs; it's removed here and added there (one undo step in each room).
- **Snap to walls:** dragging a piece close to a wall (within 12 cm) puts it flush against it, or into the corner. Hold `Alt` while dragging to place it freely.
- **Measurements:** the selected piece shows its size (W × D) and dashed lines with the distance in cm to the nearest side wall and the nearest back or front wall.
- **Save image:** the camera button in the top bar downloads a sharp PNG of the 3D view, about 4K on its long side (the same view as on screen, without the selection outline).
- **Share link:** **Copy share link** in the Designs window copies a link that opens a copy of the whole house (about 1–3 K characters). The design is packed into the link itself, after `#`, so nothing is uploaded. Whoever opens it is asked first (**Open it** / **Keep mine**), and opening it can be undone.
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
- **On desks and tables** (every room): monitors, laptops, keyboards, desk lamps, desk accessories and the PC tower stand on the office desk, desk, dining table, coffee table, side table or kitchen island.
  - Added from the catalog, they go straight onto a desk or table with room for them: a monitor or lamp at the back, a keyboard at the front. Drag one onto another top to move it there; it stays within the top's edges.
  - They stand at the height of the top, so they rise with a sit-stand desk raised in the Size card. Moving or turning the desk or table carries them along; deleting it deletes them too (one undo brings everything back). A desk moved to another room takes them with it.
  - They only clash with other things on the same top, never with floor furniture. A monitor or lamp left on the floor is flagged: "Needs a desk or table".
  - A desk or table with something on it leaves off its own decoration (the desk's laptop and cup, the dining table's vases, the coffee table's books).
- **Tucking under desks and tables** (every room): desks and dining tables have knee space (up to 12 cm below their top). A chair may be pushed in as far as its seat goes, with its back left outside (a swivel chair as far as its armrests). A drawer unit, PC tower, pouf, bench or bar stool may go fully under if it's lower than the knee space. These don't count as overlaps. A chair turned the wrong way, a piece too tall for the space, or two pieces in the same spot under one desk still get the warning.
- **Custom sizes:** every piece has a **Size** card with its width, depth and height (a diameter for round pieces), dragged or typed in any unit like the room sizes. Each option has limits: about half to twice its standard size, and real-life limits for desks (60–240 cm wide, 60–90 cm high), dining tables, chairs, drawer units and PCs. **Back to the standard size** undoes it; picking another option starts from that option's size. A custom size is used everywhere: keeping it inside the walls and snapping, overlaps and tucking under, the outline and measurements, the product card ("custom size") and the shopping list (its own line). Desks, tables, beds, storage and wall pieces are rebuilt at the new width and depth, so legs and handles keep their thickness; other pieces (and real 3D models) are stretched, which shows at extreme sizes. Saved in every format (version 6 and up; older files load at standard sizes).
- **Customise** each piece:
  - furniture options, such as sofa size, table shape, chair style, TV size, plant size and lamp shade
  - named colour swatches or a custom colour
  - a **second finish for the legs, frame, base or handles** on 15 pieces (oak, walnut, white, black metal, brass, chrome, depending on the piece). **Standard** keeps the look the piece always had. Options that use a real 3D model keep their own finish.
- **Product card:** the selected piece shows a short description, what it's made of, its size (width × depth × height, or Ø for round pieces) and an **example price**.
- **Shopping list:** the list button in the top bar shows every piece in this room or the whole house, identical pieces combined with a quantity, and the total. **Download CSV** (opens in Excel, Numbers or Google Sheets) or **Print or save as PDF**. The prices are made-up examples in US dollars for trying out the quote (they're in `src/scene/furniture/products.ts`, one per option, ready to be replaced by a real price list).
- **Pieces on the wall:** art, mirrors and shelves always hang flush on the nearest wall, facing into the room, at a fixed height. Drag them along a wall, or towards another wall to move them there. They don't clash with floor furniture (a print above the sofa is fine) or built-in units, only with each other and with windows and doors. They hide with their wall when it's cut away for the view.
- **Lamps at night:** floor lamps and now bedside lamps light their surroundings from dusk (bedside lamps only glow on Low quality).
- **Room layout editor:** with nothing selected, the **Room size** card in the right panel changes the room's inside width and depth (1.5–20 m), ceiling height (2.1–4.5 m) and wall thickness (8–30 cm), and lists its windows and doors.
  - Sizes are measured wall to wall inside the room; thicker walls grow outward, so the floor area doesn't change.
  - Click a window or door (in 3D, in the Objects list or in the card) to set its distance from the wall's left corner (facing the wall from inside), move it to another wall, change its width and sill or top height, or remove it. **+ Window** / **+ Door** add one on the wall with the most free space.
  - Windows and doors stay inside their wall and 15 cm apart (neighbours are pushed aside); doors start at the floor; windows stay under the ceiling. If a wall gets too short for all of them, the last ones are dropped.
  - Everything follows the room: furniture is moved back inside a smaller room (and flagged if it now overlaps), pieces on the wall stay on a wall, the kitchen units run along the whole back wall with the sink under the window, the toilet keeps its place by its corner, rugs, the slat wall, curtains, downlights, lights, shadows and camera views adapt.
  - Every change is one undo step (a slider drag included), and the layout is saved with the room: autosave, named saves, exported files (now version 5; older files still load, with 12 cm walls) and share links. **Back to the standard size and openings** restores the room's own layout.
- **Real-life measurements:**
  - **Units** (bottom of the left panel): metres, centimetres, or feet and inches (shown as 12′ 6″, to the nearest half inch). Kept in this browser. Every length in the app follows it: room stats, the Room size card, window and door sizes, furniture sizes (W × D × H) and the measurements shown while dragging.
  - **Exact values:** every length in the Room size card and the window / door panel can be typed as well as dragged. Any unit is understood whatever the setting: `3.5`, `350 cm`, `2500 mm`, `1,5 m`, `12'6"`, `12 ft 6 in`. A bare number is in the chosen unit. Enter applies, `Esc` cancels; anything that isn't a length is outlined in red and ignored. Values outside the limits are brought within them.
  - **Dimensions in the room:** the ruler button next to the clock shows or hides the room's measurements in the 3D view and the plan: inside width and depth outside the walls, ceiling height in a back corner, and each window's and door's width. A selected window or door also shows, in blue, its distance to both corners of its wall. Hidden during a tour and in showcase; not included in AR models. On by default.
- **Room finishes:**
  - walls in **paint**, glossy ceramic **tiles**, patterned **wallpaper** or painted wooden **panelling**, in six colour presets or a custom colour
  - seven floor materials: oak, walnut, whitewashed ash, polished concrete, stone tiles, white marble and terrazzo
- **Undo / Redo / Reset** covers furniture and finishes of the selected room. Reset itself can be undone.
- **Perspective and Plan** (top-down) views.
- **Camera views:** in Perspective, pick **Overview** (outside and above, as before), **Eye level** (standing inside the room, like a photo: ceiling, lights and all four walls) or **Corner** (from a front corner across the room). The camera glides smoothly to the chosen view and keeps it when you switch rooms. On tall, narrow screens the overview steps back so the whole room fits.
- **Showcase mode:** the **Showcase** button hides the editing panels for a clean, full-screen view with just the camera views, the time of day and the room bar. Nothing can be changed by accident. `Esc` or **Exit showcase** goes back.
- **Intro screen** on the first visit: **Start designing** or **Take a tour** (the guided tour of every room). Add `?intro` to the address to see it again.
- **Guided tour:** in showcase mode, **Tour all rooms** or **Tour this room**. Each room gets three slow camera moves of 5 seconds: a gentle orbit of the overview, a push-in from the corner and a pan at eye level, with a caption (room, size, number of pieces). Play/pause, previous/next, **End tour**; `Esc` ends it. The moves are worked out from each room's own size, so a resized room gets a matching tour.
- **Video:** the video button in the top bar records a **turntable** (one slow 12-second circle around the room), a **tour of this room** (15 s) or a **tour of every room** (about 1.3 minutes). The 3D view is recorded as it plays, at about 1080p with the quality level held steady, plus the ambient sound if it's on, and saved as MP4 where the browser can make it (Chrome, Edge, Safari) or WebM (Firefox). Keep the tab in front while it records.
- **Before / after:** **Compare** (top bar, or in showcase) wipes between the room now and a "Before": its **starting design**, a **saved design**, or a picture taken earlier with **Use this view as Before**. Both pictures come from the same camera and time of day; drag the divider or use the arrow keys, and **Download side by side** saves both as one PNG. Your design and its undo history aren't touched.
- **Ambient sound:** the speaker button next to the clock (off when the page opens; browsers only allow sound after a click). Made live in the browser, nothing to download: a soft room tone always, outdoor air and the occasional bird by day (more around sunrise and sunset), crickets at night. It follows the room's time of day and dips as the view fades between rooms. The volume is remembered.
- **View in AR:** **View in AR** (selected piece, at real size) or **View the room in AR** (the whole room as a 1:20 table-top model). On an iPhone or iPad it opens AR Quick Look; on an Android phone with AR support, a WebXR view where you point at the floor and tap to place it. Anywhere, the model can be downloaded as **.glb** (most 3D apps) or **.usdz** (Apple). Phones only allow AR on a secure (https) site.
- **Room thumbnails:** once you've visited a room, its button in the room bar shows a small picture of it (taken as you leave; kept in this browser). Narrow layouts keep the icons.
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
  - share links (see above)
- **3D quality: Auto, High, Medium, Low** (bottom of the left panel). Auto picks a level for the device (High on desktops, Medium on phones, tablets and modest computers, Low on very weak ones) and steps down if drawing gets slow while you move around. Medium uses smaller shadows, cheaper soft corner shadows, smaller floor reflections and caps screen sharpness at 1.5×. Low turns off corner shadows, floor reflections and glow, and only the sun casts shadows. The choice is kept in this browser.
- **Shadows are only redrawn when something changes** (a piece moves, the time of day changes, a model finishes loading, a wall hides). Orbiting and zooming reuse them, which takes about a third off the drawing time while you move the camera.
- **Responsive** layout for desktop, tablet and phone:
  - on phones, tapping a piece slides its settings up as a sheet over the bottom of the 3D view (✕ closes it), so you don't have to scroll down to edit it
  - touch help text (tap, drag, pinch, two fingers to pan)
  - "+ Add" scrolls the catalog into view
- **Loading screen** while the app's code downloads.

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

| Command             | What it does                                                                                                                                                              |
| ------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `npm run dev`       | Starts the development server with instant reload                                                                                                                         |
| `npm run typecheck` | Checks the TypeScript types without building                                                                                                                              |
| `npm run build`     | Type-checks, then creates an optimised production build in `dist/`                                                                                                        |
| `npm run preview`   | Serves the `dist/` build locally so you can test it                                                                                                                       |
| `npm test`          | Runs the unit tests once (`npm run test:watch` re-runs them as you edit)                                                                                                  |
| `npm run lint`      | Checks the code for likely bugs with Oxlint                                                                                                                               |
| `npm run format`    | Formats all files with Prettier (`format:check` only reports)                                                                                                             |
| `npm run check`     | Lint + format check + type check + tests. Run this before committing. GitHub runs it too (plus the build) on every push and pull request (`.github/workflows/check.yml`). |
| `npm run models`    | Rebuilds the web-ready 3D models in `public/models/` from the originals in `assets-src/` (`-- --inspect` lists their materials)                                           |

### Checking performance

Add `?perf` to the address, for example **http://localhost:5173/?perf**. A small readout appears in the bottom-left corner of the 3D view:

| Line                            | Meaning                                                                                                    |
| ------------------------------- | ---------------------------------------------------------------------------------------------------------- |
| frames                          | Frames drawn so far. The view only redraws when something changes, so this stands still while you're idle. |
| draw calls / triangles          | GPU work for the last frame, including shadow passes. Lower is faster.                                     |
| geometries / textures / shaders | What's loaded on the GPU. These should not keep growing while you edit.                                    |

It also works with `npm run preview`, which gives more realistic numbers than the dev server.

Measured in the Living Room with the default layout (draw calls and triangles depend on window size):

| Date       | Change                                                                                                 | Draw calls  | Triangles     |
| ---------- | ------------------------------------------------------------------------------------------------------ | ----------- | ------------- |
| 2026-11-04 | Phase 0 baseline                                                                                       | ~466        | ~166k         |
| 2026-11-04 | Phase 1: post-processing, ceilings, shadows drawn once per frame                                       | ~560        | ~181k         |
| 2026-11-04 | Phase 1, with a polished concrete floor (reflection)                                                   | ~640        | ~198k         |
| 2026-11-04 | Phase 2: only the selected room is drawn                                                               | ~300        | ~91k          |
| 2026-11-04 | Phase 3, Dining Room (furnished)                                                                       | ~325        | ~81k          |
| 2026-11-04 | Phase 3, Kitchen (furnished, the heaviest room)                                                        | ~500        | ~76k          |
| 2026-11-04 | Phase 3, Bathroom (furnished, tiled walls)                                                             | ~320        | ~110k         |
| 2026-11-04 | Phase 4, by day (Living / Kitchen, the heaviest)                                                       | ~315 / ~510 |               |
| 2026-11-04 | Phase 4, at night (room lights on; about 60 more in every room)                                        | ~375 / ~570 |               |
| 2026-11-04 | Phase 5, something selected (outline redraws the scene's depth)                                        | ~410 / ~670 |               |
| 2026-11-04 | Phase 6, overview with nothing selected (steady frame)                                                 | ~330 / ~530 |               |
| 2026-11-04 | Phase 6, eye level (only part of the room is in view)                                                  | ~280 / ~350 |               |
| 2026-11-04 | Phase 7, real models (fewer draw calls; more triangles, mostly the plants)                             | ~220 / ~445 | ~135k / ~122k |
| 2026-11-04 | Phase 8, nothing selected: same as Phase 7 measured in the same window (280 = 280, narrow tall window) | unchanged   | unchanged     |
| 2026-11-05 | Phase 9, while orbiting (shadows reused; same window as Phase 8's 280)                                 | ~225        | ~135k         |

Since Phase 9 the two shadow passes only run in frames where something that casts a shadow changed, so camera moves don't pay for them. Without the shadow changes from Phases 1 and 9, a reflective floor would add about 460 draw calls instead of about 85.

**GPU time per frame (Phase 9)**, measured with the browser's GPU timer on an NVIDIA RTX 3060, Living Room overview in a small window (about 400 × 850 pixels at 1×), steady frames:

| Setting                                    | GPU time per frame |
| ------------------------------------------ | ------------------ |
| High, shadows redrawn every frame (before) | ~4.2 ms            |
| High, shadows reused (now)                 | ~2.5–3.2 ms        |
| Medium                                     | ~2.7 ms            |
| Low                                        | ~1.2 ms            |

Bigger windows and sharper screens cost more (the work grows with the number of pixels), which is where Medium and Low help most.

## 3D models

Thirteen furniture options use real models (six were added in Phase 10). Everything else is still built in code, and the code-built version shows while a model downloads (or if one ever fails to load).

| In the app                                                                     | Model (CC0, Poly Haven)                    | File                                | Colour swatch |
| ------------------------------------------------------------------------------ | ------------------------------------------ | ----------------------------------- | ------------- |
| Indoor plant, large                                                            | Potted Plant 01 (Rico Cilliers)            | `plant-large.glb`, 468 KB           | pot           |
| Indoor plant, small                                                            | Potted Plant 02 (Rico Cilliers)            | `plant-small.glb`, 332 KB           | pot           |
| Coffee table, rectangle                                                        | Modern Coffee Table 01 (Amin)              | `coffee-table-rectangle.glb`, 92 KB | own finish    |
| Coffee table, round                                                            | Coffee Table Round 01 (Ulan Cabanilla)     | `coffee-table-round.glb`, 102 KB    | own finish    |
| Sideboard, 160 / 200 cm                                                        | Modern Wooden Cabinet (Patrik Pangerl)     | `sideboard.glb`, 303 KB             | wood          |
| Armchair, lounge                                                               | Modern Arm Chair 01 (Vibrant Nordic)       | `armchair-lounge.glb`, 150 KB       | cushions      |
| Accent chair, mid-century lounge (new option)                                  | Mid Century Lounge Chair (Kuutti Siitonen) | `accent-chair-lounge.glb`, 128 KB   | own finish    |
| Dining chair, leather (Phase 10)                                               | Dining Chair 02 (James Ray Cock)           | `dining-chair-leather.glb`, 133 KB  | own finish    |
| Side table, wooden cube (Phase 10)                                             | Side Table 01 (James Ray Cock)             | `side-table.glb`, 95 KB             | own finish    |
| Coffee table, square carved top (Phase 10)                                     | Modern Coffee Table 02 (Amin)              | `coffee-table-square.glb`, 341 KB   | own finish    |
| Chest of drawers, tall steel frame (Phase 10)                                  | Drawer Cabinet (Ulan Cabanilla)            | `chest-tall.glb`, 174 KB            | own finish    |
| Bookshelf, wall shelving (Phase 10; real size 235 × 72 cm, fitted to 200 × 45) | Steel Frame Shelves 03 (Ulan Cabanilla)    | `shelving-wide.glb`, 183 KB         | own finish    |
| Ottoman, leather footstool (Phase 10)                                          | Ottoman 01 (Caspian Fortune)               | `ottoman.glb`, 108 KB               | own finish    |

CC0 means free for any use with no credit required; the authors are listed anyway.

**How the files are made:** the originals (1K-texture glTF, 19.5 MB) live in `assets-src/models/`, which isn't committed. `npm run models` (`scripts/optimize-models.mjs`) removes duplicate data, simplifies heavy meshes (the plants went from 176k and 70k triangles to 21k and 17k), resizes textures to 512 px WebP, compresses the geometry with meshopt, and writes `public/models/*.glb`. For colourable materials it also makes the texture a light greyscale, so the swatch colour shows through with the grain intact. Models whose single texture covers several materials (for example a stone top and a wooden frame) keep their own finish, and the panel says so instead of showing swatches.

**Adding a model:** put the original in `assets-src/models/<id>/`, add it to `MODELS` in `scripts/optimize-models.mjs`, run `npm run models`, then map it to a furniture option in `src/scene/furniture/models.ts`. The app sizes it to the option's footprint automatically.

The Phase 10 models each have one texture for every part (the leather and the wooden or metal frame), so they keep their own finish; recolouring them would paint the legs too.

**Why the rest is still code-built:** Poly Haven has no modern sofa, bed, wardrobe, TV unit, kitchen or bathroom pieces; its versions are antique or ornate and would clash with the rooms. The 100 MB Cinema 4D scene in `../Model_Furn` wasn't used: it bundles a chair and sofa with rocks and a tree, and its Megascans-style assets may not be licensed for publishing on a website.

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

| Action             | How                                                                                                                             |
| ------------------ | ------------------------------------------------------------------------------------------------------------------------------- |
| Rotate camera      | Left-drag empty space (Perspective view)                                                                                        |
| Pan                | Right-drag (Perspective) or drag empty space (Plan)                                                                             |
| Zoom               | Mouse wheel                                                                                                                     |
| Time of day        | Clock button above the 3D view, or the **Light** row under Finishes. Sliders and presets can be undone                          |
| Switch room        | Click it in the room bar, or press `1`–`6`. With the bar focused, `←` / `→` move between rooms                                  |
| Select             | Click a piece, or its row in **Objects**                                                                                        |
| Add furniture      | **+ Add** in Objects, then click a piece in the catalog                                                                         |
| Delete / Duplicate | **Actions** in the right panel, or `Delete` (`Backspace`) / `Ctrl+D`                                                            |
| Move to a room     | **Move to another room** in Actions (only rooms where the piece belongs)                                                        |
| Place freely       | Hold `Alt` while dragging (otherwise pieces snap flush to a wall within 12 cm)                                                  |
| Save image         | Camera button in the top bar: downloads a PNG                                                                                   |
| Share              | **Save / Load** → **Copy share link**                                                                                           |
| Shopping list      | List button in the top bar: this room or the whole house; Download CSV or Print                                                 |
| Legs / frame       | The finish card under Colour in the right panel (Standard keeps the original look)                                              |
| Room size          | Deselect everything: **Room size** card in the right panel (width, depth, ceiling height, wall thickness); drag or type         |
| Units              | **Units** at the bottom of the left panel: m, cm or ft & in                                                                     |
| Measurements       | Ruler button next to the clock shows / hides the room's dimensions                                                              |
| Windows and doors  | Click one in 3D or in the Objects list; **+ Window** / **+ Door** in the Room size card                                         |
| Guided tour        | **Showcase** → **Tour all rooms** / **Tour this room**; `Esc` ends it                                                           |
| Video              | Video button in the top bar: turntable or tour                                                                                  |
| Before / after     | **Compare** in the top bar or in showcase                                                                                       |
| Ambient sound      | Speaker button next to the clock                                                                                                |
| AR                 | **View in AR** under Actions (a piece) or in the Room card (the whole room)                                                     |
| Paint a wall       | Click the wall: pick paint/tiles and a colour in the picker that opens there                                                    |
| Change the floor   | Click the floor (if something is selected, the first click just deselects it)                                                   |
| Rotate by dragging | Drag the round handle on the blue ring (15° steps, `Shift` for 1°)                                                              |
| Deselect           | Click empty floor, press `Esc`, or click ✕                                                                                      |
| Move               | Drag the piece, use the Position sliders, or arrow keys: 5 cm per press, 25 cm with `Shift`                                     |
| Rotate             | ⟲ / ⟳ buttons, slider, or `R` / `Shift+R`                                                                                       |
| Furniture options  | Size / Style / Shape list in the right panel                                                                                    |
| Furniture size     | **Size** card in the right panel: width, depth, height; drag or type; **Back to the standard size**                             |
| Walls and floor    | Deselect everything (or click **Finishes** on the left), then use the **Room** panel                                            |
| Undo / Redo        | Toolbar buttons, `Ctrl+Z` / `Ctrl+Y` (`Ctrl+Shift+Z` also redoes)                                                               |
| Reset              | **Reset** puts furniture and finishes back to the start (undoable). **Reset view** moves only the camera, back to the overview. |
| Camera views       | **Overview / Eye level / Corner** above the 3D view (Perspective only)                                                          |
| Showcase           | **Showcase** in the top bar; `Esc` to leave                                                                                     |
| 3D quality         | **3D quality** at the bottom of the left panel: Auto, High, Medium or Low                                                       |
| Save / Load        | **Save / Load** opens the Designs window                                                                                        |

A whole drag, slider movement or held-down arrow key counts as **one** undo step.

### About saving

- **Saved in this browser:** designs are stored in your browser's `localStorage`, so they exist only in that browser on that computer. Clearing site data removes them.
- **Export file / Import file:** use these to back up a design, move it to another computer, or share it. Imported files are checked first: unknown furniture is skipped, and anything outside the room is moved back inside.
- **All rooms are always saved together:** saves, the autosave and exported files hold the whole house. Older saves and files still load. Rooms they don't contain (for example the Office in a save from before it existed, or the Dining Room, Kitchen and Bathroom in even older ones) start from their default design. Exported files are now version 8 (pieces on desks and tables; older files load unchanged). A one-room file from the very first version becomes the Living Room. A Dining Room, Kitchen or Bathroom saved while it only had its starter plant is given the new furniture automatically, and keeps its paint and floor.

## Project structure

```
public/models/             Web-ready 3D models (GLB), made by `npm run models`
assets-src/models/         Original downloaded models (not committed; see 3D models)
scripts/
  optimize-models.mjs      Turns the originals into the web-ready models
src/
  main.tsx                 Entry point: mounts <App /> into index.html
  App.tsx                  Page layout and app state (design, selection, view)
  index.css                All UI styling (design tokens at the top)
  components/              2D interface
    Toolbar.tsx            Undo / Redo / Reset / Save buttons
    Sidebar.tsx            Room stats, finishes summary, objects list
    PropertiesPanel.tsx    Selected furniture: options, colour, rotation, position
    RoomPanel.tsx          Nothing selected: wall paint and floor material
    RoomBar.tsx            Glass room bar at the bottom of the 3D view (icons, thumbnails, keyboard)
    CameraViewPicker.tsx   Overview / Eye level / Corner
    IntroScreen.tsx        First-visit welcome screen
    SurfacePopover.tsx     Quick wall / floor picker that opens where you click in 3D
    WallPanel.tsx          Right-hand panel for a selected wall
    TimeOfDayPanel.tsx     Clock, presets, time slider and room orientation
    ColorPicker.tsx        Swatch grid + custom colour (used by both panels)
    DesignsDialog.tsx      Save / load / export / import / share-link window
    QualityControl.tsx     The 3D quality setting (left panel)
    UnitControl.tsx        The length unit setting (left panel)
    ShoppingListDialog.tsx Shopping list / quote window (CSV, print)
    LayoutEditor.tsx       Room size card and the window / door panel
    TourPlayer.tsx         Guided tour caption and controls
    RecordDialog.tsx       Choose what to record as a video
    CompareView.tsx        Before / after chooser and wipe slider
    SoundControl.tsx       Speaker button and volume
    ArDialog.tsx           View in AR and model downloads
    CatalogDrawer.tsx      "Add furniture" catalog for the current room
    ViewToggle.tsx         Perspective / Plan switch
    ErrorBoundary.tsx      Friendly message if the 3D view fails (e.g. no WebGL)
    icons.tsx              Small SVG icons
  hooks/
    useKeyboardShortcuts.ts  All keyboard shortcuts
  state/                   Data and logic, no 3D code
    design.ts              RoomDesign type + validation of saved/imported data
    useDesignHistory.ts    Current design + undo/redo history
    storage.ts             localStorage saves, autosave, JSON export/import
    share.ts               Share links: the house compressed into the link's #design= part
    shoppingList.ts        Shopping list lines, totals and the CSV file
    viewerPrefs.ts         Per-browser extras (not part of a design): intro seen, room thumbnails, unit, dimensions on/off
  utils/                   Small general-purpose helpers
    math.ts                clamp, angle helpers
    units.ts               Length units: showing and reading m / cm / ft & in
    id.ts                  Unique ids (works on http:// too)
    download.ts            File download helpers (JSON, pictures)
  scene/                   Everything inside the 3D canvas
    Scene.tsx              The <Canvas> (renders only when something changes)
    DevStats.tsx           Performance readout shown with ?perf in the URL (also window.roomDesigner3d for debugging)
    PostEffects.tsx        Ambient occlusion, bloom, tone mapping, vignette, antialiasing
    quality.ts             Quality levels (High / Medium / Low), Auto's starting guess and step-down rule
    AutoQuality.tsx        Measures frame times while the view moves; steps quality down when slow
    shadowUpdates.ts       Fingerprint of everything that affects shadows (redraw only when it changes)
    sun.ts                 Time of day: sun position, light colours and strengths, presets
    cameraViews.ts         Each room's camera views, and fitting the overview to narrow screens
    RoomThumbnails.tsx     Takes the small room pictures for the room bar
    SceneScreenshot.tsx    Save image: renders the view at about 4K and copies it
    CatalogThumbnailRenderer.tsx  Draws the catalog's furniture pictures in a small hidden canvas
    selection.ts           Selection ids for walls ("wall:back") and the floor ("floor")
    interiorLight.ts       Shares how "on" the room lights are (0 day … 1 night) with lamps
    Ceiling.tsx            Ceiling with cove light line and downlights
    FurnitureLayer.tsx     Draws furniture; click-to-select, drag-to-move (snaps to walls), outlines, measurements
    RoomDimensions.tsx     Dimension lines and labels for the room, its windows and doors
    RoomShell.tsx          Builds any room from its house.ts entry: floor, ceiling, 4 walls with windows/doors/skirting
    Cutaway.tsx            Hides walls (and the ceiling) that are between the camera and the room;
                           hidden walls still block the sun (shadow-only layer)
    walls.ts               Wall maths: placing walls, cutting openings, skirting runs, checks for bad openings
    rooms/decor.tsx        Built-in decor per room: rug, carpet, oak slat wall, curtains,
                           dining pendant, kitchen units, toilet
                           and the shared wall with the connecting door
    house.ts               Room registry: every room's size, windows, doors, lights, camera, default design; resolveRoom applies a room's own layout
    layout.ts              Layout editor rules: size limits, keeping windows and doors valid, add / move / remove
    roomContext.ts         The room as laid out, shared with everything in the 3D view
    tour.ts                Tour and turntable camera moves (shot lists), worked out from each room
    TourCamera.tsx         Drives the camera through a tour shot
    arExport.ts            Preparing a piece or the room (1:20) for AR; what the device supports
    arFiles.ts             GLB and USDZ export (loaded only when View in AR is used)
    ArSource.tsx           Hands a copy of a piece or the room to View in AR
  audio/
    ambience.ts            The ambient sound (Web Audio): layers and how they follow the time of day
    sound.ts               The one shared sound player (also used by video recording)
  ar/
    webxrViewer.ts         Android AR view (WebXR): point at the floor, tap to place
  utils/video.ts           Recording the 3D view as a video (format choice, MediaRecorder)
    CameraRig.tsx          Perspective / Plan cameras and mouse controls
    Lighting.tsx           Sun, fill and night room lights from sun.ts; shadows once per frame; environment
    finishes.ts            Wall colour presets and floor material options
    textures.ts            Procedural textures: floor colour/normal/roughness maps, fabric weave
    materials.ts           Shared materials
    roomConfig.ts          Ceiling height and wall thickness shared by all rooms
    parts.tsx              Reusable Block / Cylinder helpers
    furniture/
      catalog.ts           Furniture types, options, swatches, default layout,
                           "stay inside the room", overlap checks and tucking under desks
      placement.ts         Free spot for new pieces, snapping to walls, gaps to the walls
      frames.ts            Second finishes (legs, frames, handles) and their materials
      products.ts          Descriptions, heights and example prices for the product card and shopping list
      sizes.ts             Custom sizes: standard size, limits, tidying a size before it's stored
      footprintContext.ts  Lets models build themselves at a custom width and depth
      UnderDesk.tsx        Drawer unit and PC tower (Phase 15)
      Office.tsx           Office desk and office chair (Phase 16)
      DeskItems.tsx        Monitor, laptop, keyboard, desk lamp, accessories, wall clock, filing cabinet (Phase 17)
      surfaces.ts          Pieces standing on desks and tables: height, edges, moving with the desk, free spots
      WallDecor.tsx        Wall art, mirrors and wall shelves
      FurnitureModel.tsx   Picks the 3D model for a furniture type (real model if there is one)
      models.ts            Which options use a real model, and how it's sized to the footprint
      GltfModel.tsx        Loads a model, recolours it, falls back to the code-built one
      useTintedMaterial.ts Per-piece copy of a material so recolouring is independent
      Sofa.tsx … Door.tsx  One procedural model per object (Living Room)
      Bed.tsx, BedsideTable.tsx, Wardrobe.tsx,
      DressingTable.tsx, AccentChair.tsx   Bedroom models
      DiningTable.tsx, DiningChair.tsx, Sideboard.tsx   Dining Room models
      KitchenIsland.tsx, BarStool.tsx, Fridge.tsx       Kitchen models
      Bathtub.tsx, Vanity.tsx, TowelRail.tsx            Bathroom models
      CornerSofa.tsx, Seating.tsx (ottoman, desk chair, bench),
      TablesAndStorage.tsx (side table, desk, bookshelf, chest of drawers,
      bathroom cabinet)                                 Phase 10 models
```

Tests sit next to the code they check, as `*.test.ts` files. They cover undo/redo, reading saves and imported files, browser storage, the furniture maths (staying inside the walls, overlaps, default layouts, free spots, wall snapping), share links, measurements (units, typed lengths, size limits, wall thickness, corner distances), custom furniture sizes (limits, saving, undo, the shopping list, tucking under desks and tables), and pieces on desks and tables (height, edges, moving and deleting with the desk, overlaps, saving).

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
- The corner sofa's footprint is the whole rectangle around its L, so a piece in the empty corner in front of the seats counts as overlapping it.
- Choosing a bigger option for a piece after placing it can make it overlap its neighbours (it's then flagged, as before); adding from the catalog avoids this by picking an option that fits.
- Rooms are rectangles: no L-shapes or angled walls.
- AR was not tested on a real phone: the exports (GLB, USDZ) are tested, but AR Quick Look and the Android WebXR view need the app on a secure (https) site and a phone. Room models are large for phones (about 2–4 MB as GLB, up to about 13 MB as USDZ, which stores textures uncompressed).
- Desktop browsers only download the AR model; there's no QR code to open it on a phone, because share links (1–3 thousand characters) are too long for a scannable QR code. Copy the share link and open it on the phone instead.
- The video records only the 3D view: the tour captions and controls aren't in it. Recording needs the tab in front (browsers pause drawing in background tabs).
- Doors between rooms don't stay in sync: moving the Living Room's "Door to bedroom" doesn't move the Bedroom's (each room is its own scene).
- The camera doesn't move while you resize a room; pick a camera view again (or Reset view) to frame the new size.
- Pieces on a wall can't be placed at a chosen height; each type hangs at a fixed height (art and mirrors at eye level).
- The "Print or save as PDF" button uses the browser's print window; its print layout was not checked in an automated test.
- Prices in the shopping list are examples, not real shop prices.
- Moving a piece to another room is two undo steps, one in each room (each room has its own history).
- Catalog pictures are drawn again on each visit (they aren't stored), which takes a second or two the first time the catalog opens.
- Share links hold the design, not the room pictures or camera position. Very heavily edited houses make longer links (still well within browser limits).
- Doors between rooms are closed. Each room is a separate scene, so there's nothing to see through them.
- Built-in units (kitchen units, toilet, dining pendant) follow the room's size but can't be moved or restyled. The pendant stays put if you move the dining table.
- Selecting something costs extra drawing while it's selected: the outline redraws the scene's depth (about 95 more draw calls in the Living Room, 165 in the Kitchen).
- Phase 9 was tested on a desktop graphics card and in the browser's phone emulation, not yet on real phones or tablets. Touch gestures (dragging furniture with a finger, pinch zoom) still need checking on a real device.
- Auto quality only steps down during a visit, never back up, so the picture doesn't keep changing. Pick High yourself to go back.
- Ambient occlusion runs at full resolution. N8AO's faster half-resolution mode crashes with Three.js 0.187 (its multi-texture render target isn't compatible), so it stays off until N8AO is updated.
- Floor reflections aren't blurred. Drei's reflection blur creates two GPU images it never frees, so softness comes from a lower reflection resolution instead.
- At night each room has two real ceiling lights (plus the living-room floor lamp). The other lamps, the bedside lamps and the pendant only glow, because every extra light makes every material slower to draw.
- The sun model is a simple textbook one for a mid-latitude summer day (sunrise about 4:35, sunset about 19:25). It isn't tied to a real date or place.
- Post-processing adds about 160 KB (gzipped) to the download. It's in its own `effects` file, so the browser caches it separately.
- The smooth camera (camera-controls) adds about 13 KB (gzipped). Since Phase 6 the build puts React in the same file as React Three Fiber.
- The model loader adds about 21 KB (gzipped) to that file. The models themselves (2.5 MB) download in the background about a second after the app starts.
- In the Dining Room's eye-level view the pendant light hangs right in your line of sight; the Corner view is clearer.
- The first frames after switching rooms can cost more (the readout may briefly show a higher number); steady frames are in the table above.

<!-- Last updated: 2026-11-04 12:34 UTC -->
