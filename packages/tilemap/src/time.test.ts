import { describe, expect, it } from 'vitest';
import { timeOfDayAt } from './time.js';

const at = (hour: number) => new Date(2026, 6, 7, hour, 30);

describe('timeOfDayAt', () => {
  it('treats 07:00-18:59 as day', () => {
    expect(timeOfDayAt(at(7))).toBe('day');
    expect(timeOfDayAt(at(12))).toBe('day');
    expect(timeOfDayAt(at(18))).toBe('day');
  });

  it('treats evening and small hours as night', () => {
    expect(timeOfDayAt(at(19))).toBe('night');
    expect(timeOfDayAt(at(23))).toBe('night');
    expect(timeOfDayAt(at(0))).toBe('night');
    expect(timeOfDayAt(at(6))).toBe('night');
  });
});
