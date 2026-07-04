import { cronJobs } from 'convex/server'
import { internal } from './_generated/api'

const crons = cronJobs()

// Hourly sweep; each goal is actually re-reminded at most once per
// REMINDER_COOLDOWN_MS (see goalReminders.ts), so this lands ~daily per goal
// while still reacting within an hour when a deadline enters its window.
crons.interval(
  'goal deadline reminders',
  { hours: 1 },
  internal.goalReminders.remindDueGoals,
  {},
)

export default crons
