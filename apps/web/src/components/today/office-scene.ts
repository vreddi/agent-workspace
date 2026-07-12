import type { SpriteSheet } from '@worldkit/sprite-actor'
import { makeVerdantTileset, type Legend, parseMap } from '@worldkit/tilemap'
import type { TimeOfDay } from '@worldkit/tilemap'
import type { Resident, VillageScene } from '@worldkit/world-canvas'

const LEGEND: Legend = {
  '.': { kind: 'tile', tile: 'grass' },
  ',': { kind: 'tile', tile: 'meadow' },
  '"': { kind: 'tile', tile: 'tall-grass' },
  '*': { kind: 'tile', tile: 'flowers' },
  '#': { kind: 'tile', tile: 'path' },
  c: { kind: 'tile', tile: 'cobble' },
  Y: { kind: 'prop', prop: 'pine' },
  b: { kind: 'prop', prop: 'bush' },
  r: { kind: 'prop', prop: 'rock' },
  L: { kind: 'prop', prop: 'lamp-post' },
  P: { kind: 'prop', prop: 'house-thatch' },
  O: { kind: 'prop', prop: 'house-slate' },
  D: { kind: 'prop', prop: 'house-plum' },
  '1': { kind: 'marker', marker: 'desk-1', ground: 'path' },
  '2': { kind: 'marker', marker: 'desk-2', ground: 'path' },
  '3': { kind: 'marker', marker: 'desk-3', ground: 'path' },
}

// A shallow verdant clearing: three cottages on one lamp-lit lane, sized to
// sit inside a hero card (18×10 cells = 576×320 at zoom 1) without dwarfing
// the page. Pines wall the left/right/top so the forest reads as continuing
// past the frame; the cottages (4 tall, drawn from their row-6 anchors up to
// row 3) sit clear of the top treeline.
const ROWS = [
  'YYYYYYYYYYYYYYYYYY',
  'Y................Y',
  'Y....,......*....Y',
  'Y................Y',
  'Y..............b.Y',
  'Y................Y',
  'Y.P.....O.....D..Y',
  'Y..1.....2.....3.Y',
  'YL##############LY',
  'Y..*.."".r..,..b.Y',
]

// Tile/prop ids are identical across lighting moods, so one parsed map
// serves both.
const officeMap = parseMap(ROWS, LEGEND, makeVerdantTileset('night'))

const DESK_MARKERS = ['desk-1', 'desk-2', 'desk-3'] as const

/** How many agents the office map can currently house. */
export const OFFICE_CAPACITY = DESK_MARKERS.length

export type OfficeAgent = {
  id: string
  name: string
  sheet: SpriteSheet
  personality: string | null
}

/**
 * The start-page scene: one resident per agent (first `OFFICE_CAPACITY`),
 * with dialogue drawn from the agent's personality, lit for the viewer's
 * time of day.
 */
export function buildOfficeScene(
  agents: OfficeAgent[],
  time: TimeOfDay,
): VillageScene {
  const residents: Resident[] = agents
    .slice(0, OFFICE_CAPACITY)
    .map((agent, i) => ({
      id: agent.id,
      name: agent.name,
      sheet: agent.sheet,
      home: officeMap.markers[DESK_MARKERS[i]!]!,
      lines: agent.personality
        ? [`Hi, I'm ${agent.name}.`, agent.personality]
        : [`Hi, I'm ${agent.name}.`, "I'll start picking up your tasks soon."],
    }))
  return {
    name: `office-${time}`,
    map: officeMap,
    tileset: makeVerdantTileset(time),
    residents,
  }
}
