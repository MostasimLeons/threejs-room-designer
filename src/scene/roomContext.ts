import { createContext, useContext } from 'react'
import { ROOMS, type RoomInfo } from './house'

/**
 * The room on screen, with its current layout applied (resolveRoom in house.ts):
 * size, ceiling height, windows and doors, built-in units, lights and cameras.
 * Everything inside the 3D canvas reads it from here, so a resized room updates
 * every part together.
 */
export const RoomInfoContext = createContext<RoomInfo>(ROOMS.living)

export const useRoomInfo = () => useContext(RoomInfoContext)
