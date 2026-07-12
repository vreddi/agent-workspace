import { groundAt, isInsideMap } from './map.js'
import type { TileMap } from './map.js'
import { TILE_SIZE } from './tileset.js'
import type { Tileset } from './tileset.js'
import type { PixelArt } from './pixel-art.js'

export type TilemapRendererOptions = {
  map: TileMap
  tileset: Tileset
  /** Canvas drawn below characters (ground + prop bases). */
  ground: HTMLCanvasElement
  /** Canvas drawn above characters (tree canopies, roofs). */
  overhang: HTMLCanvasElement
  /**
   * Screen pixels per art pixel. Default 1 — tile art is authored at 32px,
   * the same density as the 32x32 character sprites.
   */
  pixelScale?: number
}

const RIM_THICKNESS = 2 // art pixels

/**
 * Framework-agnostic Canvas2D renderer for a TileMap. Call `render(frame)`
 * whenever the animation frame advances (a low tick rate like 3-4 fps gives
 * the classic GBA shimmer).
 */
export class TilemapRenderer {
  readonly cellSize: number
  readonly pixelScale: number

  private readonly map: TileMap
  private readonly tileset: Tileset
  private readonly ground: HTMLCanvasElement
  private readonly overhang: HTMLCanvasElement
  private readonly rasterCache = new Map<PixelArt, HTMLCanvasElement>()

  constructor(options: TilemapRendererOptions) {
    this.map = options.map
    this.tileset = options.tileset
    this.ground = options.ground
    this.overhang = options.overhang
    this.pixelScale = options.pixelScale ?? 1
    this.cellSize = TILE_SIZE * this.pixelScale

    const width = this.map.width * this.cellSize
    const height = this.map.height * this.cellSize
    for (const canvas of [this.ground, this.overhang]) {
      canvas.width = width
      canvas.height = height
    }
  }

  render(frame = 0): void {
    const groundCtx = this.context(this.ground)
    const overhangCtx = this.context(this.overhang)
    groundCtx.clearRect(0, 0, this.ground.width, this.ground.height)
    overhangCtx.clearRect(0, 0, this.overhang.width, this.overhang.height)
    this.drawGround(groundCtx, frame)
    this.drawProps(groundCtx, overhangCtx, frame)
  }

  private context(canvas: HTMLCanvasElement): CanvasRenderingContext2D {
    const ctx = canvas.getContext('2d')
    if (!ctx) {
      throw new Error('could not acquire a 2d canvas context')
    }
    ctx.imageSmoothingEnabled = false
    return ctx
  }

  private drawGround(ctx: CanvasRenderingContext2D, frame: number): void {
    const { map, tileset, cellSize } = this
    for (let y = 0; y < map.height; y++) {
      for (let x = 0; x < map.width; x++) {
        const tile = tileset.tiles[groundAt(map, x, y)]!
        const art = tile.frames[frame % tile.frames.length]!
        ctx.drawImage(
          this.raster(art),
          x * cellSize,
          y * cellSize,
          cellSize,
          cellSize,
        )
        if (tile.rim) {
          this.drawRim(ctx, x, y, tile.terrain ?? tile.id, tile.rim)
        }
      }
    }
  }

  /** Light rim on edges bordering a different terrain (GBA shorelines). */
  private drawRim(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    terrain: string,
    color: string,
  ): void {
    const { map, tileset, cellSize, pixelScale } = this
    const differs = (nx: number, ny: number): boolean => {
      if (!isInsideMap(map, nx, ny)) return false
      const neighbor = tileset.tiles[groundAt(map, nx, ny)]!
      return (neighbor.terrain ?? neighbor.id) !== terrain
    }
    const px = x * cellSize
    const py = y * cellSize
    const rim = RIM_THICKNESS * pixelScale
    ctx.fillStyle = color
    if (differs(x, y - 1)) ctx.fillRect(px, py, cellSize, rim)
    if (differs(x, y + 1)) ctx.fillRect(px, py + cellSize - rim, cellSize, rim)
    if (differs(x - 1, y)) ctx.fillRect(px, py, rim, cellSize)
    if (differs(x + 1, y)) ctx.fillRect(px + cellSize - rim, py, rim, cellSize)
  }

  private drawProps(
    groundCtx: CanvasRenderingContext2D,
    overhangCtx: CanvasRenderingContext2D,
    frame: number,
  ): void {
    const { tileset, cellSize, pixelScale } = this
    // Lower props draw over higher ones, matching top-down depth.
    const placements = [...this.map.props].sort((a, b) => a.y - b.y)
    for (const placement of placements) {
      const def = tileset.props[placement.prop]!
      const art = def.frames[frame % def.frames.length]!
      const raster = this.raster(art)
      const overhangRows = def.tilesHigh - def.baseRows
      const drawX = placement.x * cellSize
      const topY = (placement.y + 1 - def.tilesHigh) * cellSize

      if (overhangRows > 0) {
        const srcH = overhangRows * TILE_SIZE
        overhangCtx.drawImage(
          raster,
          0,
          0,
          raster.width,
          srcH,
          drawX,
          topY,
          raster.width * pixelScale,
          srcH * pixelScale,
        )
      }
      const baseSrcY = overhangRows * TILE_SIZE
      const baseH = def.baseRows * TILE_SIZE
      groundCtx.drawImage(
        raster,
        0,
        baseSrcY,
        raster.width,
        baseH,
        drawX,
        topY + overhangRows * cellSize,
        raster.width * pixelScale,
        baseH * pixelScale,
      )
    }
  }

  /** Rasterizes pixel art to an offscreen canvas once, at native size. */
  private raster(art: PixelArt): HTMLCanvasElement {
    const cached = this.rasterCache.get(art)
    if (cached) return cached
    const canvas = document.createElement('canvas')
    canvas.width = art.width
    canvas.height = art.height
    const ctx = this.context(canvas)
    const image = new ImageData(
      new Uint8ClampedArray(art.data),
      art.width,
      art.height,
    )
    ctx.putImageData(image, 0, 0)
    this.rasterCache.set(art, canvas)
    return canvas
  }
}
