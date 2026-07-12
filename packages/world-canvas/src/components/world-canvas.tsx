import * as React from 'react'

import type { GridPosition } from '@worldkit/grid'
import type { AmbientGrade, ShadowProjection } from '@worldkit/lighting'
import { LightingRenderer, TILE_SIZE, TilemapRenderer } from '@worldkit/tilemap'
import type { TileMap, Tileset } from '@worldkit/tilemap'

/** Day/night grade to composite over the scene. */
export type WorldCanvasLighting = {
  ambient: AmbientGrade
  shadow: ShadowProjection | null
  lightLevel: number
}

export type WorldCanvasProps = {
  map: TileMap
  tileset: Tileset
  /** Integer stage scale. Cells are 32px at zoom 1. Default 2. */
  zoom?: number
  /** Animate water/flower tiles. Default true. */
  animated?: boolean
  /** Fired with the grid cell under a click on the stage. */
  onCellClick?: (position: GridPosition) => void
  /**
   * Optional day/night lighting. When set, three extra canvases composite
   * over the scene: cast shadows below the characters, an ambient multiply
   * grade above the overhang, and additive lamp glow on top. Omit to keep
   * the flat, always-day look.
   */
  lighting?: WorldCanvasLighting
  /**
   * Placed on the stage between the ground and overhang canvases. Position
   * children absolutely in world pixels (32px cells); give characters
   * `zIndex: 10 + cellY` and floating UI (bubbles) `zIndex >= 1000` so tree
   * canopies and roofs (zIndex 500) layer correctly.
   */
  children?: React.ReactNode
  className?: string
  style?: React.CSSProperties
}

const PIXEL_SCALE = 1 // 32px art, 1:1 with the 32px sprite frames
const ANIMATION_MS = 300

export const CELL_SIZE = TILE_SIZE * PIXEL_SCALE

/**
 * The GBA-style stage: a tile map rendered to canvas with a slot for
 * character sprites in between the ground and the overhang layer.
 */
export function WorldCanvas({
  map,
  tileset,
  zoom = 2,
  animated = true,
  onCellClick,
  lighting,
  children,
  className,
  style,
}: WorldCanvasProps) {
  const groundRef = React.useRef<HTMLCanvasElement>(null)
  const overhangRef = React.useRef<HTMLCanvasElement>(null)
  const shadowsRef = React.useRef<HTMLCanvasElement>(null)
  const ambientRef = React.useRef<HTMLCanvasElement>(null)
  const glowRef = React.useRef<HTMLCanvasElement>(null)
  const stageRef = React.useRef<HTMLDivElement>(null)

  const hasLighting = lighting != null
  // Latest lighting values, read by the animation interval without making it
  // re-subscribe on every hour tick.
  const lightingRef = React.useRef(lighting)
  lightingRef.current = lighting
  const lightingRendererRef = React.useRef<LightingRenderer | null>(null)
  const frameRef = React.useRef(0)

  const width = map.width * CELL_SIZE
  const height = map.height * CELL_SIZE

  React.useEffect(() => {
    const ground = groundRef.current
    const overhang = overhangRef.current
    if (!ground || !overhang) return
    const renderer = new TilemapRenderer({
      map,
      tileset,
      ground,
      overhang,
      pixelScale: PIXEL_SCALE,
    })
    renderer.render(0)

    const shadows = shadowsRef.current
    const ambient = ambientRef.current
    const glow = glowRef.current
    let lightingRenderer: LightingRenderer | null = null
    if (shadows && ambient && glow) {
      lightingRenderer = new LightingRenderer({
        map,
        tileset,
        shadows,
        ambient,
        glow,
        pixelScale: PIXEL_SCALE,
      })
      lightingRendererRef.current = lightingRenderer
      if (lightingRef.current) {
        lightingRenderer.render({ ...lightingRef.current, frame: 0 })
      }
    }
    frameRef.current = 0

    if (!animated) {
      return () => {
        lightingRendererRef.current = null
      }
    }
    let frame = 0
    const interval = window.setInterval(() => {
      frame += 1
      frameRef.current = frame
      renderer.render(frame)
      if (lightingRenderer && lightingRef.current) {
        lightingRenderer.render({ ...lightingRef.current, frame })
      }
    }, ANIMATION_MS)
    return () => {
      window.clearInterval(interval)
      lightingRendererRef.current = null
    }
  }, [map, tileset, animated, hasLighting])

  // Re-composite immediately when the lighting grade changes (hour ticks),
  // independent of the animation frame cadence.
  React.useEffect(() => {
    const lightingRenderer = lightingRendererRef.current
    if (!lightingRenderer || !lighting) return
    lightingRenderer.render({ ...lighting, frame: frameRef.current })
  }, [lighting])

  const handleClick = (event: React.MouseEvent<HTMLDivElement>): void => {
    if (!onCellClick || !stageRef.current) return
    const rect = stageRef.current.getBoundingClientRect()
    const x = Math.floor(((event.clientX - rect.left) / rect.width) * map.width)
    const y = Math.floor(
      ((event.clientY - rect.top) / rect.height) * map.height,
    )
    if (x < 0 || x >= map.width || y < 0 || y >= map.height) return
    onCellClick({ x, y, z: 0 })
  }

  const layerStyle: React.CSSProperties = {
    position: 'absolute',
    top: 0,
    left: 0,
    width,
    height,
    imageRendering: 'pixelated',
  }

  return (
    <div
      data-slot="world-canvas"
      className={className}
      style={{
        position: 'relative',
        width: width * zoom,
        height: height * zoom,
        overflow: 'hidden',
        ...style,
      }}
    >
      <div
        ref={stageRef}
        onClick={handleClick}
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width,
          height,
          transform: `scale(${zoom})`,
          transformOrigin: 'top left',
        }}
      >
        <canvas ref={groundRef} style={{ ...layerStyle, zIndex: 0 }} />
        {hasLighting ? (
          <canvas
            ref={shadowsRef}
            style={{ ...layerStyle, zIndex: 5, pointerEvents: 'none' }}
          />
        ) : null}
        {children}
        <canvas
          ref={overhangRef}
          style={{ ...layerStyle, zIndex: 500, pointerEvents: 'none' }}
        />
        {hasLighting ? (
          <>
            <canvas
              ref={ambientRef}
              style={{
                ...layerStyle,
                zIndex: 600,
                pointerEvents: 'none',
                mixBlendMode: 'multiply',
              }}
            />
            <canvas
              ref={glowRef}
              style={{
                ...layerStyle,
                zIndex: 610,
                pointerEvents: 'none',
                mixBlendMode: 'screen',
              }}
            />
          </>
        ) : null}
      </div>
    </div>
  )
}
