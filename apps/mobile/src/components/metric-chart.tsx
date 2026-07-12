/**
 * Compact metric sparkline drawn with react-native-svg — the mobile analogue
 * of the web recharts line, shrunk to fit inside a MetricCard. It measures its
 * own width (onLayout) and draws a trend polyline over the metric's readings,
 * with an optional dashed target line.
 *
 * Degrades gracefully: 0 readings render a bare baseline, 1 reading a single
 * dot, so a freshly created metric still looks intentional instead of empty.
 */
import { useState } from 'react'
import { StyleSheet, View } from 'react-native'
import Svg, { Circle, Line, Path } from 'react-native-svg'
import { useTheme } from '@/theme/theme-context'

export type SparkPoint = { at: number; value: number }

const PAD_Y = 6

export function Sparkline({
  points,
  targetValue,
  reachedTarget = false,
  height = 48,
}: {
  points: SparkPoint[]
  targetValue: number | null
  reachedTarget?: boolean
  height?: number
}) {
  const { palette } = useTheme()
  const [width, setWidth] = useState(0)

  const stroke = reachedTarget ? palette.accent : palette.accentInk
  const baselineColor = palette.divider
  const targetColor = palette.ink4

  return (
    <View
      style={[styles.wrap, { height }]}
      onLayout={(e) => setWidth(e.nativeEvent.layout.width)}
    >
      {width > 0 ? (
        <Svg width={width} height={height}>
          <SparkContent
            points={points}
            targetValue={targetValue}
            width={width}
            height={height}
            stroke={stroke}
            baselineColor={baselineColor}
            targetColor={targetColor}
          />
        </Svg>
      ) : null}
    </View>
  )
}

function SparkContent({
  points,
  targetValue,
  width,
  height,
  stroke,
  baselineColor,
  targetColor,
}: {
  points: SparkPoint[]
  targetValue: number | null
  width: number
  height: number
  stroke: string
  baselineColor: string
  targetColor: string
}) {
  const midY = height / 2

  // Nothing to trend yet: a faint baseline keeps the card's rhythm.
  if (points.length === 0) {
    return (
      <Line
        x1={0}
        y1={midY}
        x2={width}
        y2={midY}
        stroke={baselineColor}
        strokeWidth={1}
      />
    )
  }

  // Y domain spans the readings and the target, padded so the line sits off
  // the frame. A flat series (hi === lo) pins to the vertical middle.
  const values = points.map((p) => p.value)
  if (targetValue !== null) values.push(targetValue)
  const lo = Math.min(...values)
  const hi = Math.max(...values)
  const span = hi - lo
  const yOf = (v: number): number => {
    if (span === 0) return midY
    const frac = (v - lo) / span
    return height - PAD_Y - frac * (height - PAD_Y * 2)
  }

  // X by time so uneven logging cadence reads truthfully; a single reading
  // (or all-same-time) collapses to a centered dot.
  const minAt = points[0]!.at
  const maxAt = points[points.length - 1]!.at
  const atSpan = maxAt - minAt
  const xOf = (at: number): number => {
    if (atSpan === 0) return width / 2
    return ((at - minAt) / atSpan) * width
  }

  const targetY = targetValue !== null ? yOf(targetValue) : null

  if (points.length === 1) {
    const p = points[0]!
    return (
      <>
        {targetY !== null ? (
          <Line
            x1={0}
            y1={targetY}
            x2={width}
            y2={targetY}
            stroke={targetColor}
            strokeWidth={1}
            strokeDasharray="3 3"
          />
        ) : null}
        <Circle cx={xOf(p.at)} cy={yOf(p.value)} r={3} fill={stroke} />
      </>
    )
  }

  let d = ''
  points.forEach((p, i) => {
    const x = xOf(p.at)
    const y = yOf(p.value)
    d += `${i === 0 ? 'M' : 'L'}${x.toFixed(2)} ${y.toFixed(2)} `
  })

  const last = points[points.length - 1]!

  return (
    <>
      {targetY !== null ? (
        <Line
          x1={0}
          y1={targetY}
          x2={width}
          y2={targetY}
          stroke={targetColor}
          strokeWidth={1}
          strokeDasharray="3 3"
        />
      ) : null}
      <Path
        d={d.trim()}
        stroke={stroke}
        strokeWidth={2}
        fill="none"
        strokeLinejoin="round"
        strokeLinecap="round"
      />
      <Circle cx={xOf(last.at)} cy={yOf(last.value)} r={2.5} fill={stroke} />
    </>
  )
}

const styles = StyleSheet.create({
  wrap: {
    width: '100%',
    justifyContent: 'center',
  },
})
