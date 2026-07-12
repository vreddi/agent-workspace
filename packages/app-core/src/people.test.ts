import { describe, expect, it } from 'vitest'
import {
  firstName,
  greetingFor,
  greetingForHour,
  initialsFromName,
  toDisplayAssignees,
  TONE_LIST,
  toneFor,
} from './people'

describe('initialsFromName', () => {
  it('takes first + last initial, upper-cased', () => {
    expect(initialsFromName('Ada Lovelace')).toBe('AL')
    expect(initialsFromName('cher')).toBe('C')
    expect(initialsFromName('  Grace  Brewster  Hopper ')).toBe('GH')
  })

  it('uses the fallback when empty', () => {
    expect(initialsFromName(null)).toBe('Y')
    expect(initialsFromName('', '?')).toBe('?')
  })
})

describe('firstName', () => {
  it('returns the first token or a default', () => {
    expect(firstName('Ada Lovelace')).toBe('Ada')
    expect(firstName(null)).toBe('there')
  })
})

describe('toneFor', () => {
  it('is deterministic and within the palette', () => {
    expect(toneFor('user_123')).toBe(toneFor('user_123'))
    expect(TONE_LIST).toContain(toneFor('user_123'))
  })
})

describe('greetings', () => {
  it('greetingFor buckets by hour with a casual override', () => {
    expect(greetingFor(9, 'casual')).toBe('Hey')
    expect(greetingFor(2, 'time-of-day')).toBe('Still up')
    expect(greetingFor(9, 'time-of-day')).toBe('Good morning')
    expect(greetingFor(14, 'time-of-day')).toBe('Good afternoon')
    expect(greetingFor(20, 'time-of-day')).toBe('Good evening')
  })

  it('greetingForHour uses the mobile buckets', () => {
    expect(greetingForHour(2)).toBe('Up late')
    expect(greetingForHour(9)).toBe('Good morning')
    expect(greetingForHour(16)).toBe('Good afternoon')
    expect(greetingForHour(17)).toBe('Good evening')
  })
})

describe('toDisplayAssignees', () => {
  it('falls back to email for the name and derives initials + tone', () => {
    const [a] = toDisplayAssignees([
      { userId: 'u1', name: null, email: 'sam@x.com', imageUrl: null },
    ])
    expect(a!.name).toBe('sam@x.com')
    expect(a!.initials).toBe('S')
    expect(TONE_LIST).toContain(a!.tone)
  })
})
