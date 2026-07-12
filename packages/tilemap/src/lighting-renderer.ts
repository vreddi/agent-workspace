import type { AmbientGrade, ShadowProjection } from '@worldkit/lighting'
import { flickerScale } from '@worldkit/lighting'
import { collectLights } from './lights.js'
import type { PlacedLight } from './lights.js'
import type { TileMap } from './map.js'
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
 *   ground (skewed/squashed by the sun's {@link ShadowProjection}),
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

  private drawShadows(
    shadow: ShadowProjection | null,
    frame: number,
  ): void {
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
