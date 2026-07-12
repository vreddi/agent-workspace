/**
 * Shared config for the estimate unit picker (minutes / hours / days) used by
 * the new-task and edit-task screens. Estimates are stored as minutes; these
 * helpers drive the ChipRowGroup + StepperRow pair that lets a person enter the
 * estimate in whichever unit is natural. A "day" is the same 24h span as a cost
 * day, matching @org/app-core.
 */
import type { EstimateUnit } from '@org/app-core'

export const ESTIMATE_UNIT_CHIPS: { label: string; value: EstimateUnit }[] = [
  { label: 'Minutes', value: 'minutes' },
  { label: 'Hours', value: 'hours' },
  { label: 'Days', value: 'days' },
]

/** Stepper increment per unit. */
export const UNIT_STEP: Record<EstimateUnit, number> = {
  minutes: 15,
  hours: 1,
  days: 0.5,
}

/** Short suffix rendered after the stepper value. */
export const UNIT_SUFFIX: Record<EstimateUnit, string> = {
  minutes: 'min',
  hours: 'h',
  days: 'd',
}

const UNIT_MINUTES: Record<EstimateUnit, number> = {
  minutes: 1,
  hours: 60,
  days: 24 * 60,
}

/** Stored minutes shown in the chosen unit, rounded to two decimals so the
 * stepper never displays float noise like "1.3333 d". */
export function estimateInUnit(minutes: number, unit: EstimateUnit): number {
  return Math.round((minutes / UNIT_MINUTES[unit]) * 100) / 100
}
