import { createContext } from 'react'

/**
 * How much the room's own lights are on: 0 in daylight, 1 at night (see sun.ts).
 * Provided by Lighting.tsx; lamps read it so they glow and light the room more as
 * it gets dark (FloorLamp.tsx).
 */
export const InteriorLightContext = createContext(0)
