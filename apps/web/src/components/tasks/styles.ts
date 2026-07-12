// Styles for the task detail page. Rendered inside `.today-root`, so the
// `--t-*` tokens from today/styles.ts are available; everything here is
// scoped under `.tdp`.
export const taskDetailStyles = `
.tdp { padding: 10px 12px 72px; max-width: 760px; }

/* ── Header ───────────────────────────────────────────────── */
.tdp-head { display: flex; align-items: flex-start; gap: 16px; margin-top: 14px; }
.tdp-head__text { flex: 1; min-width: 0; }
.tdp-emoji {
  width: 46px; height: 46px; border-radius: 13px; flex-shrink: 0;
  background: var(--t-chip-bg);
  display: flex; align-items: center; justify-content: center;
  font-size: 24px; line-height: 1;
  margin-top: 2px;
}
.tdp-title {
  margin: 0;
  font-size: 28px; font-weight: 800; letter-spacing: -0.03em; line-height: 1.2;
  color: var(--t-ink-1);
  text-wrap: pretty; overflow-wrap: break-word;
}
.tdp-title--done { color: var(--t-ink-3); text-decoration: line-through; text-decoration-thickness: 1.5px; }
.tdp-meta {
  margin: 8px 0 0;
  display: flex; align-items: center; gap: 9px; flex-wrap: wrap;
  font-size: 13.5px; font-weight: 600; color: var(--t-ink-2);
}
.tdp-meta .t-dot-tiny { width: 3px; height: 3px; border-radius: 50%; background: var(--t-ink-4); }
.tdp-meta__overdue { color: var(--t-overdue); }
.tdp-meta__done { color: var(--t-ink-3); }

/* Status word with a small state dot — plain words, no badge. */
.tdp-status { display: inline-flex; align-items: center; gap: 7px; }
.tdp-status__dot {
  width: 9px; height: 9px; border-radius: 50%;
  border: 1.5px solid var(--t-ink-4); background: transparent;
}
.tdp-status__dot--in_progress { border-color: var(--t-accent); background: var(--t-accent-soft); }
.tdp-status__dot--done { border-color: transparent; background: var(--t-accent); }
.tdp-status__dot--cancelled { border-color: transparent; background: var(--t-ink-4); }

/* ── Goal connection ──────────────────────────────────────── */
.tdp-goal {
  display: inline-flex; align-items: center; gap: 10px;
  margin-top: 14px; padding: 7px 12px 7px 8px; border-radius: 11px;
  border: 1px solid var(--t-divider); background: var(--t-surface);
  text-decoration: none; max-width: 100%;
  transition: border-color 0.12s, background 0.12s;
}
.tdp-goal:hover { border-color: var(--t-ink-4); background: var(--t-hover); }
.tdp-goal__label {
  font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em;
  color: var(--t-ink-3); display: block;
}
.tdp-goal__title {
  font-size: 13.5px; font-weight: 700; color: var(--t-ink-1);
  display: block; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
}
.tdp-goal__text { min-width: 0; }
.tdp-goal__arrow { color: var(--t-ink-3); flex-shrink: 0; }

/* ── Description ──────────────────────────────────────────── */
.tdp-desc {
  margin: 22px 0 0; max-width: 65ch;
  font-size: 15px; font-weight: 500; line-height: 1.65; color: var(--t-ink-1);
  white-space: pre-wrap; overflow-wrap: break-word;
}

/* ── Actions ──────────────────────────────────────────────── */
.tdp-actions { display: flex; align-items: center; gap: 8px; flex-shrink: 0; margin-top: 4px; }
.tdp-btn {
  display: inline-flex; align-items: center; gap: 7px;
  height: 34px; padding: 0 13px; border-radius: 9px;
  border: 1px solid var(--t-divider); background: var(--t-surface);
  color: var(--t-ink-1); cursor: pointer;
  font-family: inherit; font-size: 13px; font-weight: 600; letter-spacing: -0.01em;
  text-decoration: none;
  transition: background 0.12s, border-color 0.12s;
}
.tdp-btn:hover { background: var(--t-hover); }
.tdp-btn:disabled { opacity: 0.5; cursor: not-allowed; }
.tdp-btn--primary {
  border-color: transparent; background: var(--t-accent); color: #fff;
  font-weight: 700;
}
.tdp-btn--primary:hover { background: var(--t-accent); filter: brightness(1.06); }
.tdp-btn--icon { width: 34px; padding: 0; justify-content: center; color: var(--t-ink-2); }

/* ── Sections ─────────────────────────────────────────────── */
.tdp-section { margin-top: 40px; }
.tdp-section__head {
  display: flex; align-items: baseline; gap: 10px;
  margin: 0 0 4px;
}
.tdp-section__head h2 {
  margin: 0; font-size: 15px; font-weight: 700; letter-spacing: -0.01em;
  color: var(--t-ink-1);
}
.tdp-section__count { font-size: 12.5px; font-weight: 600; color: var(--t-ink-3); font-variant-numeric: tabular-nums; }

/* ── Details list ─────────────────────────────────────────── */
.tdp-details { margin: 0; }
.tdp-details__row {
  display: grid; grid-template-columns: 150px 1fr; gap: 16px; align-items: baseline;
  padding: 11px 2px;
}
.tdp-details__row + .tdp-details__row { border-top: 1px solid var(--t-divider); }
.tdp-details__row dt { font-size: 12.5px; font-weight: 600; color: var(--t-ink-3); }
.tdp-details__row dd {
  margin: 0; font-size: 14px; font-weight: 600; color: var(--t-ink-1);
  font-variant-numeric: tabular-nums; overflow-wrap: break-word;
}
.tdp-details__row dd .tdp-details__hint { font-weight: 500; color: var(--t-ink-3); }
.tdp-details__row dd.tdp-details__overdue { color: var(--t-overdue); }
.tdp-empty {
  padding: 14px 2px; font-size: 13.5px; font-weight: 500; color: var(--t-ink-3); line-height: 1.5;
}

/* ── Activity ─────────────────────────────────────────────── */
.tdp-log { margin: 6px 0 0; padding: 0; list-style: none; }
.tdp-log__item {
  position: relative;
  display: flex; align-items: flex-start; gap: 12px;
  padding: 12px 2px;
}
.tdp-log__item + .tdp-log__item { border-top: 1px solid var(--t-divider); }
.tdp-log__dot {
  width: 8px; height: 8px; border-radius: 50%; flex-shrink: 0;
  margin-top: 6px;
  border: 1.5px solid var(--t-ink-4); background: var(--t-surface);
}
.tdp-log__dot--created { border-color: var(--t-accent); background: var(--t-accent-soft); }
.tdp-log__body { flex: 1; min-width: 0; }
.tdp-log__line {
  margin: 0; font-size: 13.5px; font-weight: 500; line-height: 1.55; color: var(--t-ink-2);
  overflow-wrap: break-word;
}
.tdp-log__line strong { font-weight: 700; color: var(--t-ink-1); }
.tdp-log__changes { margin: 4px 0 0; padding: 0; list-style: none; }
.tdp-log__changes li {
  font-size: 13px; font-weight: 500; line-height: 1.6; color: var(--t-ink-2);
}
.tdp-log__changes li::before { content: "· "; color: var(--t-ink-4); }
.tdp-log__time {
  flex-shrink: 0; margin-top: 1px;
  font-size: 12px; font-weight: 600; color: var(--t-ink-3);
  font-variant-numeric: tabular-nums; white-space: nowrap;
}

/* ── Loading / dead-end states ────────────────────────────── */
.tdp-skeleton { margin-top: 24px; display: flex; flex-direction: column; gap: 14px; }
.tdp-skeleton div { background: var(--t-chip-bg); border-radius: 10px; }
.tdp-deadend {
  margin-top: 48px; padding: 44px 24px; text-align: center;
  border: 1px dashed var(--t-divider); border-radius: 16px;
}
.tdp-deadend h2 { margin: 0 0 4px; font-size: 16px; font-weight: 700; color: var(--t-ink-1); }
.tdp-deadend p { margin: 0 0 16px; font-size: 13.5px; font-weight: 500; color: var(--t-ink-2); }

/* ── Edit form ────────────────────────────────────────────── */
.tdp-form {
  margin-top: 14px;
  background: var(--t-surface);
  border: 1px solid var(--t-divider);
  border-radius: 16px;
  box-shadow: var(--t-shadow-card);
}
.tdp-form__title-row {
  display: flex; align-items: center; gap: 12px;
  padding: 16px 20px;
  border-bottom: 1px solid var(--t-divider);
}
.tdp-form__title-input {
  flex: 1; min-width: 0; border: none; outline: none; background: transparent;
  font-family: inherit; font-size: 17px; font-weight: 600; color: var(--t-ink-1);
  letter-spacing: -0.01em;
}
.tdp-form__title-input::placeholder { color: var(--t-ink-3); }
.tdp-form__body {
  display: flex; flex-direction: column; gap: 18px;
  padding: 16px 20px 20px;
}
.tdp-form__section-head {
  display: flex; align-items: center; gap: 10px;
  font-size: 11px; font-weight: 700;
  text-transform: uppercase; letter-spacing: 0.08em;
  color: var(--t-ink-3);
}
.tdp-form__section-head::after { content: ""; flex: 1; height: 1px; background: var(--t-divider); }
.tdp-form__grid { display: flex; gap: 20px; flex-wrap: wrap; align-items: flex-start; }
.tdp-field { display: flex; flex-direction: column; gap: 6px; flex: 1 1 200px; min-width: 0; }
.tdp-field--narrow { flex: 0 1 auto; }
.tdp-field--wide { flex: 1 1 100%; }
.tdp-field__label {
  font-size: 11px; font-weight: 600;
  text-transform: uppercase; letter-spacing: 0.04em;
  color: var(--t-ink-3);
}
.tdp-input {
  width: 100%; padding: 8px 10px;
  background: var(--t-bg);
  border: 1px solid var(--t-divider);
  border-radius: 9px;
  font-family: inherit; font-size: 14px; font-weight: 500; color: var(--t-ink-1);
  outline: none;
  transition: border-color 0.12s;
  color-scheme: light;
}
.dark .tdp-input { color-scheme: dark; }
.tdp-input:focus { border-color: var(--t-accent); }
.tdp-input:disabled { opacity: 0.5; cursor: not-allowed; }
.tdp-input::placeholder { color: var(--t-ink-3); }
textarea.tdp-input { min-height: 96px; resize: vertical; line-height: 1.55; }
.tdp-field__hint { font-size: 11.5px; font-weight: 500; color: var(--t-ink-3); }
.tdp-field__label--info { display: inline-flex; align-items: center; gap: 5px; }
.tdp-estimate { display: flex; gap: 8px; align-items: center; }
.tdp-estimate .tdp-input { flex: 1 1 auto; min-width: 0; }
.tdp-estimate > button { flex: 0 0 auto; }
.tdp-check {
  display: flex; align-items: center; gap: 8px;
  margin-top: 2px; font-size: 12.5px; font-weight: 500; color: var(--t-ink-2);
  cursor: pointer;
}
.tdp-slider-head { display: flex; align-items: center; gap: 8px; min-height: 20px; }
.tdp-slider-value {
  font-size: 13px; font-weight: 600; color: var(--t-ink-1);
  font-variant-numeric: tabular-nums;
}
.tdp-slider-clear {
  margin-left: auto; border: none; background: transparent; cursor: pointer;
  font-family: inherit; font-size: 11.5px; font-weight: 600; color: var(--t-ink-3);
  padding: 2px 6px; border-radius: 6px;
}
.tdp-slider-clear:hover { background: var(--t-hover); color: var(--t-ink-1); }
.tdp-slider-clear:disabled { opacity: 0.5; cursor: not-allowed; }
.tdp-form [data-slot=slider] { height: 16px; }
.tdp-form [data-slot=slider-track] { background: var(--t-chip-bg); }
.tdp-form [data-slot=slider-range] { background: var(--t-accent); }
.tdp-form [data-slot=slider-thumb] {
  border-color: var(--t-accent); background: var(--t-surface);
  box-shadow: 0 1px 3px rgba(0,0,0,0.18);
}
.tdp-form [data-unset] [data-slot=slider-range] { background: var(--t-ink-4); }
.tdp-form [data-unset] [data-slot=slider-thumb] { border-color: var(--t-ink-4); }

/* Progress section (long-running tasks) — read view, outside the form. */
.tdp-progress { display: flex; flex-direction: column; gap: 10px; }
.tdp-progress [data-slot=slider] { height: 16px; }
.tdp-progress [data-slot=slider-track] { background: var(--t-chip-bg); }
.tdp-progress [data-slot=slider-range] { background: var(--t-accent); }
.tdp-progress [data-slot=slider-thumb] {
  border-color: var(--t-accent); background: var(--t-surface);
  box-shadow: 0 1px 3px rgba(0,0,0,0.18);
}
.tdp-progress__hint { margin: 0; font-size: 12.5px; font-weight: 500; color: var(--t-ink-3); }
.tdp-form [data-slot=select-trigger] {
  width: 100%; padding: 8px 10px; height: auto;
  background: var(--t-bg);
  border: 1px solid var(--t-divider);
  border-radius: 9px;
  font-size: 14px; font-weight: 500; color: var(--t-ink-1);
  box-shadow: none;
  transition: border-color 0.12s;
}
.tdp-form [data-slot=select-trigger]:hover,
.tdp-form [data-slot=select-trigger][data-state=open] { border-color: var(--t-accent); }
.tdp-form__error {
  margin: 0 20px; padding: 10px 12px; border-radius: 9px;
  background: var(--t-overdue-soft); color: var(--t-overdue);
  font-size: 12.5px; font-weight: 600;
}
.tdp-form__foot {
  display: flex; align-items: center; gap: 8px;
  padding: 14px 20px;
  border-top: 1px solid var(--t-divider);
}
.tdp-form__foot .tdp-btn--primary { margin-left: auto; }

@media (max-width: 560px) {
  .tdp-details__row { grid-template-columns: 1fr; gap: 2px; }
  .tdp-head { flex-wrap: wrap; }
}

/* ── People / assignees ─────────────────────────────────── */
.tdp-people { list-style: none; margin: 0; padding: 0; }
.tdp-people__row {
  display: flex; align-items: center; gap: 11px;
  padding: 10px 2px;
}
.tdp-people__row + .tdp-people__row { border-top: 1px solid var(--t-divider); }
.tdp-people__text { min-width: 0; flex: 1; display: flex; flex-direction: column; gap: 1px; }
.tdp-people__name {
  font-size: 14px; font-weight: 600; color: var(--t-ink-1);
  white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
}
.tdp-people__you { font-weight: 500; color: var(--t-ink-3); }
.tdp-people__email {
  font-size: 12px; font-weight: 500; color: var(--t-ink-3);
  white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
}
.tdp-people__tag {
  font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em;
  color: var(--t-ink-3); flex-shrink: 0;
  border: 1px solid var(--t-divider); border-radius: 999px; padding: 2px 8px;
}
.tdp-people__remove {
  width: 26px; height: 26px; border-radius: 8px; flex-shrink: 0;
  border: none; background: transparent; cursor: pointer;
  font-size: 16px; line-height: 1; color: var(--t-ink-3);
  transition: background 0.12s, color 0.12s;
}
.tdp-people__remove:hover { background: var(--t-hover); color: var(--t-overdue); }
.tdp-people__remove:disabled { opacity: 0.5; cursor: not-allowed; }
.tdp-people__add { margin-top: 10px; }

.tdp-people__search {
  width: 100%; padding: 8px 10px;
  background: var(--t-bg); border: 1px solid var(--t-divider); border-radius: 9px;
  font-family: inherit; font-size: 13.5px; font-weight: 500; color: var(--t-ink-1);
}
.tdp-people__search:focus { outline: none; border-color: var(--t-accent); }
.tdp-people__results {
  list-style: none; margin: 6px 0 0; padding: 0;
  max-height: 240px; overflow-y: auto;
}
.tdp-people__hint {
  padding: 10px 6px; font-size: 12.5px; font-weight: 500; color: var(--t-ink-3);
}
.tdp-people__result {
  display: flex; align-items: center; gap: 10px; width: 100%;
  padding: 7px 8px; border: none; border-radius: 9px;
  background: transparent; cursor: pointer; text-align: left;
  font-family: inherit;
  transition: background 0.12s;
}
.tdp-people__result:hover { background: var(--t-hover); }
`
