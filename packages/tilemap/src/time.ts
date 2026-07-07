/**
 * The two lighting moods the built-in tileset ships in. `night` is the
 * signature look — lit windows, glowing lanterns, fireflies; `day` swaps
 * in a sunlit palette with the lights off.
 */
export type TimeOfDay = 'day' | 'night';

/** Local daytime runs 07:00–18:59; everything else is night. */
export function timeOfDayAt(date: Date): TimeOfDay {
  const hour = date.getHours();
  return hour >= 7 && hour < 19 ? 'day' : 'night';
}
