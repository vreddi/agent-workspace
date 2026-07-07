import * as React from 'react';

import { timeOfDayAt } from '@worldkit/tilemap';
import type { TimeOfDay } from '@worldkit/tilemap';

/**
 * The viewer's local time of day, for picking a tileset lighting mood.
 * Returns `null` until mounted (the server doesn't know the viewer's
 * clock, so SSR must not guess), then re-checks each minute so a page
 * left open crosses dawn and dusk on its own.
 */
export function useTimeOfDay(): TimeOfDay | null {
  const [time, setTime] = React.useState<TimeOfDay | null>(null);
  React.useEffect(() => {
    const update = () => setTime(timeOfDayAt(new Date()));
    update();
    const interval = window.setInterval(update, 60_000);
    return () => window.clearInterval(interval);
  }, []);
  return time;
}
