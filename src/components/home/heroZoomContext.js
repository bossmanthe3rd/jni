import { createContext } from 'react'

/*
 * What the hero needs to know while it is the near end of the camera move
 * into Why Flipo's (HeroWhyZoom). Outside the move -- phones, reduced motion
 * -- `staged` is false and the rest is null, and the hero behaves as it
 * always has.
 *
 *   fore        1 -> 0 as the move starts: the copy, packs and lamp fade out
 *               of the way of the camera.
 *   camera      the camera's current scale, so the hero's monitor can keep its
 *               outlines as heavy as the hero's own ink while it is small.
 *   monitorRef  the hero's monitor, which the move measures to start from.
 */
export const HeroZoomContext = createContext({ staged: false, fore: null, camera: null, monitorRef: null })
