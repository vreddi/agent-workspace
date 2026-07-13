import type { AmbientGrade, ShadowProjection } from '@worldkit/lighting'
import { flickerScale } from '@worldkit/lighting'
import { collectLights } from './lights.js'
import type { PlacedLight } from './lights.js'
import type { PropPlacement, TileMap } from './map.js'
import { parseHexColor } from './pixel-art.js'
import type { PixelArt } from './pixel-art.js'
import { TILE_SIZE } from './tileset.js'
import type { Tileset } from './tileset.js'

/** Indigo tint for cast shadows: cool, slightly purple night shade. */
const SHADOW_RGB: [number, number, number] = [0x1a, 0x14, 0x33]
/** CSS string form of {@link SHADOW_RGB}, for the static night DOM/blob shade. */
export const SHADOW_TINT = '#1a1433'

/** Lights fade in fully below this scene brightness. */
const LIGHTS_FULL_BELOW = 0.6
/** Fade band width: lights ramp from 0 at 0.6 to 1 at 0.3. */
const LIGHTS_FADE_SPAN = 0.3

function clamp(value: number, min: number, max: number): number {
  return value < min ? min : value > max ? max : value
}

/**
 * How strongly point lights are lit for a given scene brightness. Ramps from
 * 0 at/above {@link LIGHTS_FULL_BELOW} to 1 once brightness drops a further
 * {@link LIGHTS_FADE_SPAN} below it — so lamps carve pools out of dusk/night
 * and vanish by day. Pure; unit-tested.
 */
export function lightsOnAt(lightLevel: number): number {
  return clamp((LIGHTS_FULL_BELOW - lightLevel) / LIGHTS_FADE_SPAN, 0, 1)
}

export type WallShadowGeometry = {
  /** Left edge of the caster's art, in art pixels. */
  casterX: number
  /** The caster's ground line (bottom edge of its art), in art pixels. */
  casterGroundY: number
  /** Full height of the caster's silhouette, in art pixels. */
  casterHeight: number
  /** Ground line of the receiving wall's base, in art pixels. */
  wallGroundY: number
  skewX: number
  scaleY: number
}

/**
 * Where a caster's silhouette lands on a vertical face standing at
 * `wallGroundY`, or `null` when the shadow never reaches that wall.
 *
 * Sunlight travels along `(skewX, scaleY, -1)` per unit of height, so a
 * caster pixel at height `z` meets the wall plane after descending
 * `depth = (wallGroundY - casterGroundY) / scaleY` — on the wall it sits at
 * height `z - depth`, upright and un-skewed (the horizontal lean is the same
 * `skewX * depth` for every pixel). The silhouette therefore draws 1:1,
 * translated only; sun elevation decides how far up the wall it climbs.
 * Pure; unit-tested.
 */
export function wallShadowPlacement(
  geometry: WallShadowGeometry,
): { x: number; y: number } | null {
  const { casterX, casterGroundY, casterHeight, wallGroundY, skewX, scaleY } =
    geometry
  if (scaleY <= 0) return null
  const depth = (wallGroundY - casterGroundY) / scaleY
  // Walls behind (north of) the caster never receive its shadow.
  if (depth < 0) return null
  // The shadow falls short of the wall's base line.
  if (depth >= casterHeight) return null
  return {
    x: casterX + skewX * depth,
    y: wallGroundY + depth - casterHeight,
  }
}

/** Builds an `rgba()` string from a CSS hex color, multiplied by `alpha`. */
function hexWithAlpha(color: string, alpha: number): string {
  if (color.startsWith('#')) {
    const [r, g, b, a] = parseHexColor(color)
    return `rgba(${r}, ${g}, ${b}, ${clamp((a / 255) * alpha, 0, 1)})`
  }
  // Non-hex CSS colors can't carry an explicit alpha for a gradient stop;
  // best-effort passthrough (tileset light colors are authored as hex).
  return color
}

export type LightingLayerState = {
  ambient: AmbientGrade
  shadow: ShadowProjection | null
  /** 0..1 scene brightness; lights fade in below ~0.6. */
  lightLevel: number
  /** Animation frame counter (drives flame flicker). */
  frame: number
}

export type LightingRendererOptions = {
  map: TileMap
  tileset: Tileset
  /** Cast-shadow layer: composited above ground, below characters. */
  shadows: HTMLCanvasElement
  /** Ambient grade: `mix-blend-mode: multiply`, above the overhang. */
  ambient: HTMLCanvasElement
  /** Additive halos: `mix-blend-mode: screen`, above the ambient layer. */
  glow: HTMLCanvasElement
  /** Screen pixels per art pixel. Default 1. */
  pixelScale?: number
}

/**
 * Framework-agnostic Canvas2D lighting compositor — sibling of
 * {@link TilemapRenderer}. Paints three layers each `render()`:
 *
 * - **shadows** long indigo silhouettes cast forward from props onto the
 *   ground (skewed/squashed by the sun's {@link ShadowProjection}); where a
 *   shadow meets another prop's standing base it climbs that face upright
 *   instead of banding linearly across it (see {@link wallShadowPlacement}),
 * - **ambient** a flat `ambient.tint` fill through which lit lamps are
 *   punched with additive radial gradients (consumed as a multiply layer),
 * - **glow** soft additive halos around each lit lamp (consumed as a screen
 *   layer for bloom).
 *
 * Point lights fade in as `lightLevel` drops (see {@link lightsOnAt}).
 */
export class LightingRenderer {
  readonly cellSize: number
  readonly pixelScale: number

  private readonly map: TileMap
  private readonly tileset: Tileset
  private readonly shadows: HTMLCanvasElement
  private readonly ambient: HTMLCanvasElement
  private readonly glow: HTMLCanvasElement
  private readonly lights: PlacedLight[]
  private readonly silhouetteCache = new Map<PixelArt, HTMLCanvasElement>()
  private wallScratch: HTMLCanvasElement | null = null

  constructor(options: LightingRendererOptions) {
    this.map = options.map
    this.tileset = options.tileset
    this.shadows = options.shadows
    this.ambient = options.ambient
    this.glow = options.glow
    this.pixelScale = options.pixelScale ?? 1
    this.cellSize = TILE_SIZE * this.pixelScale
    this.lights = collectLights(options.map, options.tileset)

    const width = this.map.width * this.cellSize
    const height = this.map.height * this.cellSize
    for (const canvas of [this.shadows, this.ambient, this.glow]) {
      canvas.width = width
      canvas.height = height
    }
  }

  render(state: LightingLayerState): void {
    this.drawShadows(state.shadow, state.frame)
    this.drawAmbient(state)
    this.drawGlow(state)
  }

  private context(canvas: HTMLCanvasElement): CanvasRenderingContext2D {
    const ctx = canvas.getContext('2d')
    if (!ctx) {
      throw new Error('could not acquire a 2d canvas context')
    }
    ctx.imageSmoothingEnabled = false
    return ctx
  }

  private drawShadows(shadow: ShadowProjection | null, frame: number): void {
    const ctx = this.context(this.shadows)
    ctx.setTransform(1, 0, 0, 1, 0, 0)
    ctx.clearRect(0, 0, this.shadows.width, this.shadows.height)
    if (!shadow) return

    const { tileset, cellSize, pixelScale } = this
    ctx.globalAlpha = shadow.alpha
    // Nearer (lower) props cast over farther ones, matching the base renderer.
    const placements = [...this.map.props].sort((a, b) => a.y - b.y)
    for (const placement of placements) {
      const def = tileset.props[placement.prop]!
      const art = def.frames[frame % def.frames.length]!
      const silhouette = this.silhouette(art)
      const w = art.width
      const h = art.height
      const anchorX = placement.x * cellSize
      // Ground line = bottom edge of the prop's base = bottom of its art.
      const groundLineY = (placement.y + 1) * cellSize

      // Anchor the silhouette's base at the ground line, flip it downward
      // (vertical squash by scaleY), and lean it by the sun skew — pixels
      // higher up the prop (smaller local y) spill further out and down.
      ctx.setTransform(
        pixelScale,
        0,
        -shadow.skewX * pixelScale,
        -shadow.scaleY * pixelScale,
        anchorX + shadow.skewX * h * pixelScale,
        groundLineY + shadow.scaleY * h * pixelScale,
      )
      ctx.drawImage(silhouette, 0, 0, w, h)
    }
    ctx.setTransform(1, 0, 0, 1, 0, 0)
    ctx.globalAlpha = 1

    this.drawWallShadows(ctx, shadow, frame, placements)
  }

  /**
   * The ground pass treats the whole map as flat, so a skewed shadow band
   * sweeps linearly across house facades and trunks. Here every prop's
   * standing base becomes a shadow *receiver*: linear pass-through shadows
   * are erased from its face, and each shadow that actually reaches its wall
   * plane is re-drawn climbing upright (see {@link wallShadowPlacement}).
   */
  private drawWallShadows(
    ctx: CanvasRenderingContext2D,
    shadow: ShadowProjection,
    frame: number,
    placements: PropPlacement[],
  ): void {
    const { tileset, pixelScale } = this
    for (const receiver of placements) {
      const def = tileset.props[receiver.prop]!
      const art = def.frames[frame % def.frames.length]!
      const silhouette = this.silhouette(art)
      const baseHeight = def.baseRows * TILE_SIZE
      const baseX = receiver.x * TILE_SIZE
      const wallGroundY = (receiver.y + 1) * TILE_SIZE
      const baseTopY = wallGroundY - baseHeight

      // The face owns its pixels: strip the linear pass-through shadows.
      ctx.globalCompositeOperation = 'destination-out'
      ctx.globalAlpha = 1
      ctx.drawImage(
        silhouette,
        0,
        art.height - baseHeight,
        art.width,
        baseHeight,
        baseX * pixelScale,
        baseTopY * pixelScale,
        art.width * pixelScale,
        baseHeight * pixelScale,
      )

      const scratch = this.scratch(art.width, baseHeight)
      scratch.clearRect(0, 0, art.width, baseHeight)
      scratch.globalCompositeOperation = 'source-over'
      let hasWallShadow = false
      for (const caster of placements) {
        if (caster === receiver) continue
        const casterDef = tileset.props[caster.prop]!
        const casterArt = casterDef.frames[frame % casterDef.frames.length]!
        const placed = wallShadowPlacement({
          casterX: caster.x * TILE_SIZE,
          casterGroundY: (caster.y + 1) * TILE_SIZE,
          casterHeight: casterArt.height,
          wallGroundY,
          skewX: shadow.skewX,
          scaleY: shadow.scaleY,
        })
        if (!placed) continue
        if (
          placed.x + casterArt.width <= baseX ||
          placed.x >= baseX + art.width
        ) {
          continue
        }
        scratch.drawImage(
          this.silhouette(casterArt),
          Math.round(placed.x - baseX),
          Math.round(placed.y - baseTopY),
        )
        hasWallShadow = true
      }
      if (!hasWallShadow) continue

      // Keep only the pixels on the receiver's actual face, then composite.
      scratch.globalCompositeOperation = 'destination-in'
      scratch.drawImage(
        silhouette,
        0,
        art.height - baseHeight,
        art.width,
        baseHeight,
        0,
        0,
        art.width,
        baseHeight,
      )
      ctx.globalCompositeOperation = 'source-over'
      ctx.globalAlpha = shadow.alpha
      ctx.drawImage(
        scratch.canvas,
        0,
        0,
        art.width,
        baseHeight,
        baseX * pixelScale,
        baseTopY * pixelScale,
        art.width * pixelScale,
        baseHeight * pixelScale,
      )
    }
    ctx.globalCompositeOperation = 'source-over'
    ctx.globalAlpha = 1
  }

  /** Reusable scratch context for masking wall shadows, grown as needed. */
  private scratch(width: number, height: number): CanvasRenderingContext2D {
    let canvas = this.wallScratch
    if (!canvas || canvas.width < width || canvas.height < height) {
      canvas = document.createElement('canvas')
      canvas.width = Math.max(width, this.wallScratch?.width ?? 0)
      canvas.height = Math.max(height, this.wallScratch?.height ?? 0)
      this.wallScratch = canvas
    }
    return this.context(canvas)
  }

  private drawAmbient(state: LightingLayerState): void {
    const ctx = this.context(this.ambient)
    ctx.setTransform(1, 0, 0, 1, 0, 0)
    ctx.globalCompositeOperation = 'source-over'
    ctx.globalAlpha = 1
    ctx.clearRect(0, 0, this.ambient.width, this.ambient.height)
    ctx.fillStyle = state.ambient.tint
    ctx.fillRect(0, 0, this.ambient.width, this.ambient.height)

    const lightsOn = lightsOnAt(state.lightLevel)
    if (lightsOn <= 0) return

    // Additively brighten the tint where lamps burn, carving light pools.
    ctx.globalCompositeOperation = 'lighter'
    const { pixelScale } = this
    for (const light of this.lights) {
      const flicker = flickerScale(light, state.frame)
      const cx = light.x * pixelScale
      const cy = light.y * pixelScale
      const radius = Math.max(light.radius * flicker * pixelScale, 0.01)
      const gradient = ctx.createRadialGradient(cx, cy, 0, cx, cy, radius)
      gradient.addColorStop(
        0,
        hexWithAlpha(light.color, light.intensity * lightsOn),
      )
      gradient.addColorStop(1, hexWithAlpha(light.color, 0))
      ctx.fillStyle = gradient
      ctx.fillRect(cx - radius, cy - radius, radius * 2, radius * 2)
    }
    ctx.globalCompositeOperation = 'source-over'
  }

  private drawGlow(state: LightingLayerState): void {
    const ctx = this.context(this.glow)
    ctx.setTransform(1, 0, 0, 1, 0, 0)
    ctx.globalCompositeOperation = 'source-over'
    ctx.globalAlpha = 1
    ctx.clearRect(0, 0, this.glow.width, this.glow.height)

    const lightsOn = lightsOnAt(state.lightLevel)
    if (lightsOn <= 0) return

    const { pixelScale } = this
    for (const light of this.lights) {
      const flicker = flickerScale(light, state.frame)
      const cx = light.x * pixelScale
      const cy = light.y * pixelScale
      const radius = Math.max(0.8 * light.radius * flicker * pixelScale, 0.01)
      const alpha = 0.35 * light.intensity * lightsOn * flicker
      const gradient = ctx.createRadialGradient(cx, cy, 0, cx, cy, radius)
      gradient.addColorStop(0, hexWithAlpha(light.color, alpha))
      gradient.addColorStop(1, hexWithAlpha(light.color, 0))
      ctx.fillStyle = gradient
      ctx.fillRect(cx - radius, cy - radius, radius * 2, radius * 2)
    }
  }

  /** Rasterizes an indigo, alpha-preserving silhouette of the art, cached. */
  private silhouette(art: PixelArt): HTMLCanvasElement {
    const cached = this.silhouetteCache.get(art)
    if (cached) return cached
    const canvas = document.createElement('canvas')
    canvas.width = art.width
    canvas.height = art.height
    const ctx = this.context(canvas)
    const tinted = new Uint8ClampedArray(art.data.length)
    for (let i = 0; i < art.data.length; i += 4) {
      const alpha = art.data[i + 3]!
      if (alpha === 0) continue
      tinted[i] = SHADOW_RGB[0]
      tinted[i + 1] = SHADOW_RGB[1]
      tinted[i + 2] = SHADOW_RGB[2]
      tinted[i + 3] = alpha
    }
    ctx.putImageData(new ImageData(tinted, art.width, art.height), 0, 0)
    this.silhouetteCache.set(art, canvas)
    return canvas
  }
}
