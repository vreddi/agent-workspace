import { describe, expect, it } from 'vitest'
import { goalTypeValue, parseTypeValue, type TypeSelection } from './goals'

describe('goalTypeValue / parseTypeValue round-trip', () => {
  const cases: Array<{
    input: { typeSlug: string | null; customTypeId: string | null }
    value: string
    selection: TypeSelection
  }> = [
    {
      input: { typeSlug: null, customTypeId: null },
      value: '',
      selection: { kind: 'none' },
    },
    {
      input: { typeSlug: 'fitness', customTypeId: null },
      value: 'sys:fitness',
      selection: { kind: 'system', slug: 'fitness' },
    },
    {
      input: { typeSlug: null, customTypeId: 'gt_9' },
      value: 'custom:gt_9',
      selection: { kind: 'custom', id: 'gt_9' },
    },
  ]

  it('encodes goal types to select values', () => {
    for (const c of cases) expect(goalTypeValue(c.input)).toBe(c.value)
  })

  it('parses select values back to selections', () => {
    for (const c of cases) expect(parseTypeValue(c.value)).toEqual(c.selection)
  })

  it('prefers the system slug when both are present', () => {
    expect(goalTypeValue({ typeSlug: 'fitness', customTypeId: 'gt_9' })).toBe(
      'sys:fitness',
    )
  })
})
