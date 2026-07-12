import type { TimeOfDay } from '../../time.js'

/**
 * Verdant master palette — a Sea-of-Stars / Chained-Echoes painterly look.
 *
 * Every material is a named ramp shared across the whole theme so the scene
 * reads as one world instead of a bag of stamps. Two rules run through all of
 * them:
 *
 * - **Hue-shifted shadows.** Shadows never just darken. Foliage and stone
 *   shade toward purple/indigo; water shades toward deep teal. Highlights
 *   shift warm (yellow/orange).
 * - **Golden-hour day, indigo night.** Day ramps carry warm sun; night ramps
 *   collapse toward `#2c3555` indigo and desaturate, so the warm window and
 *   lamp light can pop against the cool dark.
 *
 * Shades within a ramp are ordered lightest → darkest.
 */

type Shades = Record<string, string>
export type ByTime = Record<TimeOfDay, Shades>

/** Grass and low foliage. Shadow leans teal-purple. */
export const GRASS = {
  day: {
    hi: '#c8dd82', // sun-caught blade tip
    lt: '#a4bf5e',
    base: '#8bad55',
    mid: '#7fa04c',
    sh: '#5c7f46',
    deep: '#47624b',
    shadow: '#39504e', // teal-purple ground shade
  },
  night: {
    hi: '#5e7862',
    lt: '#4d6753',
    base: '#425a49',
    mid: '#3a5142',
    sh: '#314539',
    deep: '#283a34',
    shadow: '#20303a',
  },
} satisfies ByTime

/**
 * Packed-earth dirt for paths. One warm cohesive dirt: `lt`/`mid` sit within
 * ±5-6% value of `base` so the lane never checkers, and `deep` is only a
 * moderate pebble shade (never a harsh dark).
 */
export const DIRT = {
  day: {
    hi: '#e2c99c',
    lt: '#d4b488',
    base: '#c9a878',
    mid: '#bf9d6c',
    sh: '#96795a',
    deep: '#a98a60',
  },
  night: {
    hi: '#675b50',
    lt: '#574d44',
    base: '#4e453d',
    mid: '#453d36',
    sh: '#37302a',
    deep: '#3d362f',
  },
} satisfies ByTime

/**
 * Plaza cobbles — warm gray-tan stones on a soft mortar bed. The edge shade
 * (`sh`) sits only a value or two under the stone body so stones read laid and
 * rounded, never rubble with near-black outlines. `lt` is the occasional
 * lighter highlight stone.
 */
export const COBBLE = {
  day: {
    hi: '#c8ba9e', // warm crown
    lt: '#c2b49a', // highlight stone
    base: '#b0a08a', // stone body
    mid: '#a3937d', // secondary stone
    sh: '#9a8a76', // stone edge — only 1-2 values under body
    deep: '#8a7c68', // base shadow
    mortar: '#6e6254',
  },
  night: {
    hi: '#5c5b52',
    lt: '#575649',
    base: '#4c4b42',
    mid: '#454438',
    sh: '#3d3c34',
    deep: '#34332c',
    mortar: '#2a2924',
  },
} satisfies ByTime

/**
 * Standing water. A rich teal body that pools to deep teal toward tile
 * centers, cool ripple highlights and bright sparkle. `dark` doubles as the
 * dark-teal shoreline rim (never a pale/white edge).
 */
export const WATER = {
  day: {
    hi: '#9ce0d2',
    lt: '#7cc4b8', // ripple highlight
    mid: '#4a9d94', // base body
    deep: '#2e6f6a', // deep-water pooling
    dark: '#2a5a55', // trough + shoreline rim
    sparkle: '#d8f0e8',
  },
  night: {
    hi: '#4a7c80',
    lt: '#3d7078',
    mid: '#285358', // indigo-teal base body
    deep: '#1e3a44', // deep-water pooling
    dark: '#16303a', // trough + shoreline rim
    sparkle: '#b8d8d4', // faint moonlit sparkle
  },
} satisfies ByTime

/** Bare wood — trunks, posts, doors, crates. */
export const WOOD = {
  day: {
    hi: '#a8734a',
    lt: '#8a5a38',
    mid: '#6e4128',
    sh: '#4d2c1f',
    deep: '#38201a',
  },
  night: {
    hi: '#5c4436',
    lt: '#4a3529',
    mid: '#3b2a20',
    sh: '#2c1f18',
    deep: '#20150f',
  },
} satisfies ByTime

/** House walls — warm plaster by day, moonlit indigo by night. */
export const PLASTER = {
  day: {
    hi: '#f5ecd6',
    lt: '#e8d7b8',
    mid: '#d4bf9c',
    sh: '#bca480',
    deep: '#9c876a',
  },
  night: {
    hi: '#9a94a0',
    lt: '#847e8e',
    mid: '#6d6879',
    sh: '#575366',
    deep: '#454154',
  },
} satisfies ByTime

/** Dark timber framing beams — indigo-shifted at night. */
export const TIMBER = {
  day: { lt: '#6e5038', base: '#5c4230', sh: '#3a2a20' },
  night: { lt: '#42364a', base: '#352a3a', sh: '#261d2b' },
} satisfies ByTime

/** Foundation stonework. Shadow leans indigo. */
export const STONE = {
  day: {
    hi: '#c0b8ae',
    lt: '#a49b92',
    mid: '#847b74',
    sh: '#655e58',
    deep: '#4a4540',
  },
  night: {
    hi: '#565766',
    lt: '#474856',
    mid: '#3a3b48',
    sh: '#2e2f3a',
    deep: '#24242e',
  },
} satisfies ByTime

type Roof = Record<'ridge' | 'light' | 'mid' | 'shadow', string>
type RoofByTime = Record<TimeOfDay, Roof>

/** Warm straw thatch. */
export const ROOF_THATCH = {
  day: {
    ridge: '#f0d488',
    light: '#d9b062',
    mid: '#b8904a',
    shadow: '#8a6836',
  },
  night: {
    ridge: '#6f6552',
    light: '#585040',
    mid: '#463f33',
    shadow: '#332f26',
  },
} satisfies RoofByTime

/** Blue-green slate shingle. */
export const ROOF_SLATE = {
  day: {
    ridge: '#8fbcb2',
    light: '#5c9b96',
    mid: '#3f7a78',
    shadow: '#2b5a5c',
  },
  night: {
    ridge: '#4d6570',
    light: '#3b4f5a',
    mid: '#2d3f4a',
    shadow: '#222f3a',
  },
} satisfies RoofByTime

/** Plum shingle. */
export const ROOF_PLUM = {
  day: {
    ridge: '#b57694',
    light: '#8a4f6e',
    mid: '#6b3b54',
    shadow: '#4d2a3e',
  },
  night: {
    ridge: '#584560',
    light: '#453450',
    mid: '#362a3e',
    shadow: '#281d2e',
  },
} satisfies RoofByTime

/** Window glazing. Cool reflective by day, amber-lit with bloom by night. */
export const GLASS = {
  day: {
    pane: '#9db6b8', // cool sky reflection
    bright: '#c9dbd8',
    frame: '#c9a860', // unlit brass
  },
  night: {
    pane: '#f2ac55', // amber lamplight
    bright: '#ffd28a',
    frame: '#f2b45f',
    bloomOuter: '#ffb45e2e', // wall glow, outer
    bloomInner: '#ffc87857', // wall glow, inner
  },
} satisfies ByTime

/** Baked contact shadow — soft translucent purple, never black. */
export const CONTACT: Record<TimeOfDay, string> = {
  day: '#3a2e5230',
  night: '#18142e46',
}

/** Chimney and campfire smoke. */
export const SMOKE = {
  day: { thick: '#e0dacb6a', thin: '#ece7d848' },
  night: { thick: '#c4bfb45c', thin: '#d4cfc23c' },
} satisfies ByTime

/**
 * Big-tree foliage. Three greens plus a purple-indigo shadow core and a warm
 * rim light on the sun side — the signature painterly canopy.
 */
export const OAK = {
  day: {
    rim: '#c8dd82', // warm sun rim
    hi: '#9ec25a',
    lt: '#7fa04c',
    mid: '#5c7f46',
    sh: '#47624b',
    core: '#354f4e',
    deepcore: '#2f3d52', // purple-indigo shadow core
  },
  night: {
    rim: '#5c7458',
    hi: '#48624a',
    lt: '#3c5340',
    mid: '#314536',
    sh: '#283a30',
    core: '#20303a',
    deepcore: '#1c2740',
  },
} satisfies ByTime

/** Conifer needles. */
export const PINE = {
  day: {
    hi: '#5f7f50',
    lt: '#4a684c',
    mid: '#3b5640',
    dark: '#2f4534',
    core: '#26333f',
  },
  night: {
    hi: '#43593e',
    lt: '#35493a',
    mid: '#293c30',
    dark: '#1f2f27',
    core: '#1a2430',
  },
} satisfies ByTime

/** Round shrub — rides the grass ramp with a rounder crown. */
export const BUSH = {
  day: {
    hi: '#a4bf5e',
    lt: '#7fa04c',
    mid: '#5c7f46',
    dark: '#47624b',
    core: '#33484a',
  },
  night: {
    hi: '#4d6753',
    lt: '#3c5340',
    mid: '#314539',
    dark: '#283a34',
    core: '#1e2c30',
  },
} satisfies ByTime

/** Flower accents — lavender and cream blooms scattered in meadows. */
export const FLOWER = {
  day: {
    petal: '#b79bd4',
    center: '#e0b060',
    cream: '#f2ecc9',
    stem: '#5f7347',
  },
  night: {
    petal: '#a289bd',
    center: '#d9a561',
    cream: '#ddd6b4',
    stem: '#3c5340',
  },
} satisfies ByTime

/** Toadstool cluster — warm red caps, cream stalks. */
export const MUSHROOM = {
  day: {
    cap: '#c96a5a',
    hi: '#dc8a6a',
    stalk: '#e8dcbc',
    spot: '#f2e8ce',
    shade: '#a08059',
  },
  night: {
    cap: '#a8544a',
    hi: '#bd6a5a',
    stalk: '#c9bda0',
    spot: '#ddd0b0',
    shade: '#7a6250',
  },
} satisfies ByTime

/** Market-stall awning stripes and crates. */
export const MARKET = {
  day: {
    stripeA: '#c9564a',
    stripeB: '#f2e6cc',
    crate: '#8a5a38',
    crateLt: '#a8734a',
  },
  night: {
    stripeA: '#7a4048',
    stripeB: '#847e8e',
    crate: '#3b2a20',
    crateLt: '#4a3529',
  },
} satisfies ByTime

/** Iron for lamp posts, well fittings, sign brackets. */
export const IRON = {
  day: { base: '#3a3340', lt: '#4d4553', sh: '#28232e' },
  night: { base: '#2a2632', lt: '#38333f', sh: '#1c1922' },
} satisfies ByTime
