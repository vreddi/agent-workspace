// The pure task view-model logic now lives in @org/app-core (shared with the
// mobile app). This module re-exports it, specializing DisplayTask to the
// web's concrete task-row type so callers keep full access to `raw`.
import type { TaskListItem } from '@convex/tasks'
import type { DisplayTask as CoreDisplayTask } from '@org/app-core'

export {
  aiSuggestionFor,
  applyFilter,
  deriveDeadline,
  FILTER_IDS,
  firstName,
  fmtCountdown,
  fmtDateBadge,
  greetingFor,
  hashString,
  initialsFromName,
  pick,
  sortForToday,
  sourceFor,
  toDisplayAssignees,
  toDisplayTask,
  TONE_LIST,
  TONE_STYLES,
  toneFor,
} from '@org/app-core'
export type {
  DisplayAssignee,
  FilterId,
  SourceKind,
  Tone,
} from '@org/app-core'

/** A display task backed by the web app's fully-typed task-list row. */
export type DisplayTask = CoreDisplayTask<TaskListItem>
