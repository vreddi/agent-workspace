/**
 * Agents page styles. Rendered inside `.today-root`, so all `--t-*` tokens
 * (and light/dark theming) come from `todayStyles`.
 */
export const agentStyles = `
.ag-sub {
  padding: 0 12px 26px;
  font-size: 15px; color: var(--t-ink-2); font-weight: 500;
  max-width: 62ch; line-height: 1.5; text-wrap: pretty;
}

/* ── Composer ────────────────────────────────────────────── */
.ag-composer {
  margin: 0 12px 36px;
  background: var(--t-surface);
  border: 1px solid var(--t-divider);
  border-radius: 18px;
  box-shadow: var(--t-shadow-card);
  overflow: hidden;
}
.ag-composer__grid {
  display: grid; grid-template-columns: 1fr 300px;
}
@media (max-width: 880px) { .ag-composer__grid { grid-template-columns: 1fr; } }
.ag-composer__form {
  padding: 26px 28px 24px;
  display: flex; flex-direction: column; gap: 22px;
  min-width: 0;
}
.ag-composer__title { margin: 0; font-size: 18px; font-weight: 800; letter-spacing: -0.02em; color: var(--t-ink-1); }

.ag-field { display: flex; flex-direction: column; gap: 8px; }
.ag-label {
  font-size: 11px; font-weight: 700; letter-spacing: 0.08em;
  text-transform: uppercase; color: var(--t-ink-3);
}
.ag-hint { font-size: 12px; color: var(--t-ink-3); font-weight: 500; line-height: 1.5; }

.ag-input, .ag-textarea {
  width: 100%;
  border-radius: 10px; border: 1px solid var(--t-divider);
  background: var(--t-bg); color: var(--t-ink-1);
  font-size: 14px; font-weight: 500; outline: none;
  transition: border-color 0.12s ease;
}
.ag-input { height: 40px; padding: 0 12px; }
.ag-textarea {
  min-height: 88px; padding: 10px 12px;
  resize: vertical; line-height: 1.5; font-family: inherit;
}
.ag-input:focus, .ag-textarea:focus { border-color: var(--t-accent); }
.ag-input::placeholder, .ag-textarea::placeholder { color: var(--t-ink-3); }

/* shadcn Select trigger, retuned to match the other fields. The menu itself
   renders in a portal outside .today-root and keeps shadcn's own tokens. */
.today-root .ag-select-trigger {
  width: 100%; height: 40px; padding: 0 12px;
  border-radius: 10px; border: 1px solid var(--t-divider);
  background: var(--t-bg); color: var(--t-ink-1);
  font-family: inherit; font-size: 14px; font-weight: 500;
  box-shadow: none;
  transition: border-color 0.12s ease;
}
.today-root .ag-select-trigger:focus-visible,
.today-root .ag-select-trigger[data-state="open"] {
  border-color: var(--t-accent);
  box-shadow: none; outline: none;
}
.today-root .ag-select-trigger svg { color: var(--t-ink-3); }

/* Sprite picker */
.ag-sprites { display: flex; gap: 10px; flex-wrap: wrap; }
.ag-sprite-tile {
  width: 88px; height: 104px;
  border-radius: 14px; border: 1.5px solid var(--t-divider);
  background: var(--t-bg); cursor: pointer; padding: 0;
  display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 6px;
  transition: border-color 0.12s ease, background 0.12s ease;
}
.ag-sprite-tile:hover { border-color: var(--t-ink-4); }
.ag-sprite-tile[data-selected="true"] {
  border-color: var(--t-accent);
  background: var(--t-accent-soft);
}
.ag-sprite-tile__stage {
  height: 64px; display: flex; align-items: flex-end; justify-content: center;
}
.ag-sprite-tile__name { font-size: 11.5px; font-weight: 600; color: var(--t-ink-2); }
.ag-sprite-tile[data-selected="true"] .ag-sprite-tile__name { color: var(--t-accent-ink); }
.ag-sprite-tile--upload { border-style: dashed; }
.ag-sprite-tile--upload .ag-sprite-tile__plus {
  width: 28px; height: 28px; border-radius: 9px;
  background: var(--t-chip-bg); color: var(--t-ink-2);
  display: flex; align-items: center; justify-content: center;
  font-size: 16px; font-weight: 600;
}

.ag-actions { display: flex; align-items: center; gap: 10px; padding-top: 2px; }
.ag-btn-primary {
  height: 40px; padding: 0 18px; border-radius: 10px; border: none;
  background: var(--t-accent); color: #fff; cursor: pointer;
  font-size: 13.5px; font-weight: 700; letter-spacing: -0.01em;
  display: inline-flex; align-items: center; gap: 8px;
}
.ag-btn-primary:disabled { opacity: 0.45; cursor: not-allowed; }
.ag-btn-ghost {
  height: 40px; padding: 0 14px; border-radius: 10px;
  border: 1px solid var(--t-divider); background: transparent;
  color: var(--t-ink-2); font-size: 13px; font-weight: 600; cursor: pointer;
}
.ag-btn-ghost:hover { background: var(--t-hover); color: var(--t-ink-1); }
.ag-error {
  font-size: 12.5px; font-weight: 500; color: var(--t-overdue);
}

/* Preview column */
.ag-preview {
  background: var(--t-chip-bg);
  border-left: 1px solid var(--t-divider);
  padding: 26px 24px;
  display: flex; flex-direction: column; align-items: center; justify-content: center;
  gap: 6px; text-align: center;
}
@media (max-width: 880px) { .ag-preview { border-left: none; border-top: 1px solid var(--t-divider); } }
.ag-preview__stage {
  height: 120px; width: 120px;
  display: flex; align-items: flex-end; justify-content: center;
  margin-bottom: 12px;
  border-bottom: 2px solid var(--t-divider);
}
.ag-preview__name { font-size: 17px; font-weight: 800; letter-spacing: -0.02em; color: var(--t-ink-1); }
.ag-preview__name--empty { color: var(--t-ink-3); font-weight: 600; }
.ag-preview__model {
  font-size: 12px; font-weight: 600; color: var(--t-ink-2);
  display: inline-flex; align-items: center; gap: 6px;
}
.ag-preview__blurb {
  margin-top: 8px; font-size: 12.5px; color: var(--t-ink-3); line-height: 1.5;
  display: -webkit-box; -webkit-line-clamp: 3; -webkit-box-orient: vertical; overflow: hidden;
  max-width: 24ch;
}

/* ── Roster ──────────────────────────────────────────────── */
.ag-roster { padding: 0 12px 60px; }
.ag-roster__head { display: flex; align-items: center; gap: 12px; margin-bottom: 4px; }
.ag-roster__head h2 { margin: 0; font-size: 19px; font-weight: 800; letter-spacing: -0.02em; color: var(--t-ink-1); }
.ag-row {
  display: flex; align-items: center; gap: 18px;
  padding: 16px 8px;
  border-bottom: 1px solid var(--t-divider);
  min-width: 0;
}
.ag-row__stage {
  width: 72px; height: 72px; flex-shrink: 0;
  border-radius: 14px; background: var(--t-chip-bg);
  display: flex; align-items: flex-end; justify-content: center;
  padding-bottom: 4px; overflow: hidden;
}
.ag-row__info { display: flex; flex-direction: column; gap: 3px; min-width: 0; flex: 1; }
.ag-row__name { font-size: 15.5px; font-weight: 700; letter-spacing: -0.015em; color: var(--t-ink-1); }
.ag-row__personality {
  font-size: 13px; color: var(--t-ink-2); line-height: 1.45;
  display: -webkit-box; -webkit-line-clamp: 1; -webkit-box-orient: vertical; overflow: hidden;
}
.ag-model-chip {
  flex-shrink: 0;
  display: inline-flex; align-items: center; gap: 7px;
  height: 28px; padding: 0 12px; border-radius: 999px;
  background: var(--t-chip-bg); color: var(--t-ink-1);
  font-size: 12px; font-weight: 700; letter-spacing: -0.005em;
}
.ag-model-chip__dot { width: 6px; height: 6px; border-radius: 50%; background: var(--t-accent); }
.ag-row__remove {
  flex-shrink: 0; height: 30px; padding: 0 12px;
  border-radius: 8px; border: 1px solid transparent;
  background: transparent; color: var(--t-ink-3);
  font-size: 12px; font-weight: 600; cursor: pointer;
  opacity: 0; transition: opacity 0.12s ease;
}
.ag-row:hover .ag-row__remove, .ag-row__remove[data-arming="true"] { opacity: 1; }
.ag-row__remove:hover { color: var(--t-overdue); border-color: var(--t-overdue-soft); }
.ag-row__remove[data-arming="true"] { color: #fff; background: var(--t-overdue); border-color: var(--t-overdue); }

.ag-skeleton {
  height: 104px; border-radius: 14px;
  background: linear-gradient(90deg, var(--t-chip-bg) 0%,
              color-mix(in srgb, var(--t-chip-bg) 60%, var(--t-surface)) 50%,
              var(--t-chip-bg) 100%);
  background-size: 220% 100%;
  animation: t-shimmer 1.4s linear infinite;
  margin-bottom: 12px;
}
@keyframes t-shimmer { 0% { background-position: 100% 0; } 100% { background-position: -100% 0; } }
.ag-empty {
  padding: 28px 8px; font-size: 14px; color: var(--t-ink-3); line-height: 1.5;
}
`
