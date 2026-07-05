export const todayStyles = `
[data-today-theme="light"] {
  /* Soft white: warm near-neutrals (no blue cast), chroma kept under 0.004. */
  --t-bg: oklch(0.986 0.002 95);
  --t-surface: oklch(0.998 0.001 95);
  --t-rail: oklch(0.998 0.001 95);
  --t-ink-1: oklch(0.24 0.006 85);
  --t-ink-2: oklch(0.5 0.008 85);
  --t-ink-3: oklch(0.65 0.007 85);
  --t-ink-4: oklch(0.845 0.005 85);
  --t-divider: oklch(0.938 0.003 90);
  --t-chip-bg: oklch(0.962 0.003 90);
  --t-hover: oklch(0.973 0.003 90);
  --t-accent: var(--t-accent-raw, #2b6ef5);
  --t-accent-soft: color-mix(in srgb, var(--t-accent) 14%, var(--t-surface));
  --t-accent-ink: color-mix(in srgb, var(--t-accent) 80%, #000);
  --t-overdue: #e25151;
  --t-overdue-soft: #fde8e8;
  --t-shadow-card: 0 1px 0 rgba(30,28,22,0.03), 0 4px 14px -6px rgba(30,28,22,0.08);
  --t-shadow-elev: 0 1px 0 rgba(30,28,22,0.04), 0 10px 28px -12px rgba(30,28,22,0.16);
  --t-kbd-bg: oklch(0.998 0.001 95);
  --t-kbd-border: oklch(0.908 0.004 90);
  background: var(--t-bg);
  color: var(--t-ink-1);
}

[data-today-theme="dark"] {
  --t-bg: #0d0f15;
  --t-surface: #15181f;
  --t-rail: #11141a;
  --t-ink-1: #f1f3f8;
  --t-ink-2: #9aa1b2;
  --t-ink-3: #6b7185;
  --t-ink-4: #3a3f4e;
  --t-divider: #1f242e;
  --t-chip-bg: #1c2029;
  --t-hover: #1a1e26;
  --t-accent: var(--t-accent-raw, #5b8df8);
  --t-accent-soft: color-mix(in srgb, var(--t-accent) 22%, var(--t-surface));
  --t-accent-ink: color-mix(in srgb, var(--t-accent) 60%, #fff);
  --t-overdue: #f37777;
  --t-overdue-soft: #2d1a1a;
  --t-shadow-card: 0 1px 0 rgba(0,0,0,0.4), 0 8px 24px -10px rgba(0,0,0,0.4);
  --t-shadow-elev: 0 1px 0 rgba(0,0,0,0.4), 0 12px 30px -12px rgba(0,0,0,0.6);
  --t-kbd-bg: #1a1e26;
  --t-kbd-border: #2a2f3a;
  background: var(--t-bg);
  color: var(--t-ink-1);
}

.today-root {
  font-family: 'Plus Jakarta Sans', ui-sans-serif, system-ui, -apple-system, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  min-height: 100vh;
  transition: background 0.18s, color 0.18s;
}
.today-root * { box-sizing: border-box; }
.today-root button, .today-root input, .today-root select { font-family: inherit; }
.today-root input { color: inherit; }

/* ── Layout ────────────────────────────────────────────────── */
.t-main { max-width: 1240px; margin: 0 auto; min-height: 100vh; padding: 0 24px; }

/* ── Top nav ───────────────────────────────────────────────── */
.t-nav {
  display: flex; align-items: center; gap: 8px;
  padding: 18px 12px;
}
.t-nav__brand {
  width: 34px; height: 34px; border-radius: 10px;
  background: var(--t-accent); color: #fff;
  display: flex; align-items: center; justify-content: center;
  flex-shrink: 0;
}
.t-nav__links { display: flex; align-items: center; gap: 2px; margin-left: 8px; }
.t-nav__link {
  display: inline-flex; align-items: center;
  height: 34px; padding: 0 13px; border-radius: 9px;
  color: var(--t-ink-2); text-decoration: none;
  font-size: 13.5px; font-weight: 600; letter-spacing: -0.01em;
  transition: background 0.12s, color 0.12s;
}
.t-nav__link:hover { background: var(--t-hover); color: var(--t-ink-1); }
.t-nav__link[data-active="true"] { background: var(--t-chip-bg); color: var(--t-ink-1); }
.t-btn-create {
  height: 38px; padding: 0 16px 0 13px; border-radius: 10px; border: none;
  background: var(--t-accent); color: white; cursor: pointer;
  display: inline-flex; align-items: center; gap: 8px;
  font-size: 13.5px; font-weight: 700; letter-spacing: -0.01em;
  transition: filter 0.12s;
}
.t-btn-create:hover { filter: brightness(1.06); }

/* ── Page section header (title + count + page-local actions) ── */
.t-page-head {
  display: flex; align-items: center; gap: 14px;
  padding: 26px 12px 6px;
}
.t-page-head h1 { margin: 0; font-size: 30px; font-weight: 800; letter-spacing: -0.03em; color: var(--t-ink-1); }
.t-page-head__count { font-size: 13px; color: var(--t-ink-3); font-weight: 600; font-variant-numeric: tabular-nums; }

/* ── Greeting ─────────────────────────────────────────────── */
.t-hello { padding: 34px 12px 26px; }
.t-hello h1 {
  margin: 0;
  font-size: 33px; font-weight: 750; letter-spacing: -0.03em; line-height: 1.15;
  color: var(--t-ink-1);
  text-wrap: pretty;
}
.t-hello__meta {
  margin: 10px 0 0;
  font-size: 14px; font-weight: 500; color: var(--t-ink-2);
  display: flex; align-items: center; gap: 10px; flex-wrap: wrap;
}
.t-hello__meta .t-dot-tiny { width: 3px; height: 3px; border-radius: 50%; background: var(--t-ink-4); }
.t-hello__overdue { color: var(--t-overdue); font-weight: 600; }

/* ── Office card ──────────────────────────────────────────── */
.t-office {
  margin: 0 12px 44px;
  background: var(--t-surface);
  border: 1px solid var(--t-divider);
  border-radius: 18px;
  box-shadow: var(--t-shadow-card);
  overflow: hidden;
}
.t-office__head {
  display: flex; align-items: center; gap: 12px;
  padding: 16px 20px;
}
.t-office__head h2 {
  margin: 0; font-size: 15px; font-weight: 700; letter-spacing: -0.01em;
  color: var(--t-ink-1);
}
.t-office__count { font-size: 12.5px; font-weight: 600; color: var(--t-ink-3); }
.t-office__link {
  margin-left: auto;
  display: inline-flex; align-items: center; gap: 6px;
  height: 30px; padding: 0 11px; border-radius: 8px;
  color: var(--t-ink-2); text-decoration: none;
  font-size: 12.5px; font-weight: 600;
}
.t-office__link:hover { background: var(--t-hover); color: var(--t-ink-1); }
.t-office__stage {
  position: relative;
  display: flex; justify-content: center;
  background: var(--t-chip-bg);
  border-top: 1px solid var(--t-divider);
  overflow: hidden;
}
.t-office__placeholder {
  height: 288px; width: 100%;
}
.t-office__overlay {
  position: absolute; inset: 0;
  display: flex; flex-direction: column; align-items: center; justify-content: center;
  gap: 12px;
  background: color-mix(in srgb, var(--t-surface) 62%, transparent);
}
.t-office__overlay p {
  margin: 0; font-size: 14px; font-weight: 600; color: var(--t-ink-1);
}
.t-office__overlay a {
  display: inline-flex; align-items: center;
  height: 36px; padding: 0 16px; border-radius: 10px;
  background: var(--t-accent); color: #fff; text-decoration: none;
  font-size: 13px; font-weight: 700;
}

/* ── Today's tasks ────────────────────────────────────────── */
.t-today { padding: 0 12px 64px; }
.t-today__head {
  display: flex; align-items: baseline; gap: 12px;
  margin-bottom: 6px; padding: 0 8px;
}
.t-today__head h2 { margin: 0; font-size: 18px; font-weight: 800; letter-spacing: -0.02em; color: var(--t-ink-1); }
.t-today__count { font-size: 13px; color: var(--t-ink-3); font-weight: 600; font-variant-numeric: tabular-nums; }
.t-task-row {
  display: flex; align-items: center; gap: 14px;
  padding: 14px 10px;
  border-radius: 10px;
  text-decoration: none; color: inherit;
  min-width: 0;
}
.t-task-row:hover { background: var(--t-hover); }
.t-task-row + .t-task-row { border-top: 1px solid var(--t-divider); }
.t-task-row:hover + .t-task-row, .t-task-row + .t-task-row:hover { border-top-color: transparent; }
.t-task-row__dot {
  width: 9px; height: 9px; border-radius: 50%; flex-shrink: 0;
  border: 1.5px solid var(--t-ink-4);
}
.t-task-row__dot--overdue { border-color: var(--t-overdue); background: var(--t-overdue-soft); }
.t-task-row__emoji {
  width: 18px; flex-shrink: 0;
  font-size: 15px; line-height: 1; text-align: center;
}
.t-task-row__title {
  flex: 1; min-width: 0;
  font-size: 15px; font-weight: 600; letter-spacing: -0.01em;
  color: var(--t-ink-1);
  white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
}
.t-task-row__src { display: inline-flex; color: var(--t-ink-3); flex-shrink: 0; }
.t-task-row__due {
  flex-shrink: 0;
  font-size: 12.5px; font-weight: 600; color: var(--t-ink-3);
  font-variant-numeric: tabular-nums;
}
.t-task-row__due--overdue { color: var(--t-overdue); }
.t-today__empty {
  padding: 22px 10px; font-size: 14px; color: var(--t-ink-3); line-height: 1.5;
}

.t-kbd {
  display: inline-flex; align-items: center; justify-content: center;
  min-width: 18px; height: 20px; padding: 0 6px;
  border-radius: 5px; background: var(--t-kbd-bg);
  border: 1px solid var(--t-kbd-border);
  font-family: 'DM Mono', ui-monospace, SF Mono, monospace;
  font-size: 10.5px; font-weight: 500; color: var(--t-ink-2);
}
.t-kbd--on-accent {
  background: rgba(255,255,255,0.18);
  border: 1px solid rgba(255,255,255,0.18);
  color: rgba(255,255,255,0.95);
}

/* ── Quick-capture palette ──────────────────────────────── */
.t-palette-bd {
  position: fixed; inset: 0;
  background: rgba(30,28,22,0.32);
  backdrop-filter: blur(4px);
  -webkit-backdrop-filter: blur(4px);
  display: flex; align-items: center; justify-content: center;
  padding: 24px;
  z-index: 50;
  animation: t-fade-in 0.14s ease-out;
}
[data-today-theme="dark"] .t-palette-bd { background: rgba(0,0,0,0.55); }
.t-palette {
  width: 600px; max-width: calc(100% - 32px);
  background: var(--t-surface);
  border-radius: 16px;
  box-shadow: 0 30px 70px -20px rgba(0,0,0,0.4);
  border: 1px solid var(--t-divider);
  /* Visible so the emoji / goal picker panels can overflow the card. */
  overflow: visible;
  animation: t-pop-in 0.18s cubic-bezier(0.2,0.9,0.3,1);
}
.t-palette__row {
  border-top-left-radius: 16px;
  border-top-right-radius: 16px;
}
.t-palette__hints {
  border-bottom-left-radius: 16px;
  border-bottom-right-radius: 16px;
}
@keyframes t-fade-in { from{opacity:0} to{opacity:1} }
@keyframes t-pop-in { from{opacity:0;transform:translateY(-8px) scale(0.98)} to{opacity:1;transform:translateY(0) scale(1)} }
.t-palette__row {
  display: flex; align-items: center; gap: 12px; padding: 18px 20px;
  border-bottom: 1px solid var(--t-divider);
}
/* ── Emoji picker ────────────────────────────────────────── */
.t-emoji { position: relative; flex-shrink: 0; }
.t-emoji__trigger {
  width: 30px; height: 30px; border-radius: 8px;
  background: var(--t-accent-soft); color: var(--t-accent);
  border: 1px solid transparent;
  display: flex; align-items: center; justify-content: center;
  cursor: pointer; flex-shrink: 0;
  transition: background 0.12s ease, border-color 0.12s ease;
}
.t-emoji__trigger:hover { border-color: var(--t-accent); }
.t-emoji__trigger[data-has-emoji] { background: var(--t-bg); }
.t-emoji__trigger:disabled { opacity: 0.5; cursor: not-allowed; }
.t-emoji__glyph { font-size: 18px; line-height: 1; }
.t-emoji__panel {
  position: absolute; top: calc(100% + 8px); left: 0;
  width: 340px;
  display: flex; flex-direction: column;
  background: var(--t-surface);
  border: 1px solid var(--t-divider);
  border-radius: 12px;
  box-shadow: 0 18px 40px -14px rgba(0,0,0,0.35);
  z-index: 60;
  overflow: hidden;
  animation: t-pop-in 0.14s cubic-bezier(0.2,0.9,0.3,1);
}
.t-emoji__search {
  display: flex; align-items: center; gap: 8px;
  margin: 10px 10px 8px;
  padding: 7px 10px;
  background: var(--t-bg);
  border: 1px solid var(--t-divider);
  border-radius: 9px;
}
.t-emoji__search:focus-within { border-color: var(--t-accent); }
.t-emoji__search-icon { color: var(--t-ink-3); flex-shrink: 0; }
.t-emoji__search input {
  flex: 1; min-width: 0;
  border: none; outline: none; background: transparent;
  font-size: 14px; font-weight: 500; color: var(--t-ink-1);
  font-family: inherit;
}
.t-emoji__search input::placeholder { color: var(--t-ink-3); }
.t-emoji__search-clear {
  border: none; background: transparent; cursor: pointer;
  color: var(--t-ink-3); font-size: 18px; line-height: 1;
  padding: 0 2px; flex-shrink: 0;
}
.t-emoji__search-clear:hover { color: var(--t-ink-1); }
.t-emoji__tabs {
  display: flex; gap: 1px;
  padding: 0 8px 6px;
  border-bottom: 1px solid var(--t-divider);
}
.t-emoji__tab {
  flex: 1; height: 30px; border-radius: 7px;
  border: none; background: transparent; cursor: pointer;
  font-size: 15px; line-height: 1;
  display: flex; align-items: center; justify-content: center;
  filter: saturate(0.15) opacity(0.7);
  transition: background 0.1s ease, filter 0.1s ease;
}
.t-emoji__tab:hover { background: var(--t-bg); filter: none; }
.t-emoji__tab[data-active] {
  background: var(--t-accent-soft); filter: none;
}
.t-emoji__scroll {
  position: relative;
  max-height: 264px; overflow-y: auto;
  padding: 4px 10px 8px;
  overscroll-behavior: contain;
}
.t-emoji__section-head {
  position: sticky; top: 0; z-index: 1;
  padding: 8px 2px 4px;
  background: var(--t-surface);
  font-size: 11px; font-weight: 700;
  text-transform: uppercase; letter-spacing: 0.04em;
  color: var(--t-ink-3);
}
.t-emoji__grid {
  display: grid; grid-template-columns: repeat(8, 1fr); gap: 1px;
}
.t-emoji__cell {
  aspect-ratio: 1; border: none; background: transparent;
  border-radius: 8px; cursor: pointer;
  font-size: 20px; line-height: 1;
  display: flex; align-items: center; justify-content: center;
  transition: background 0.1s ease;
}
.t-emoji__cell:hover { background: var(--t-bg); }
.t-emoji__cell[data-active] { background: var(--t-accent-soft); }
.t-emoji__empty {
  padding: 24px 10px; text-align: center;
  font-size: 13px; color: var(--t-ink-3);
}
.t-emoji__clear {
  margin: 0; width: 100%;
  padding: 9px; border: none; border-top: 1px solid var(--t-divider);
  background: transparent;
  color: var(--t-ink-2); font-size: 12px; font-weight: 600;
  font-family: inherit; cursor: pointer;
  transition: background 0.12s ease, color 0.12s ease;
}
.t-emoji__clear:hover { background: var(--t-bg); color: var(--t-ink-1); }

/* ── Goal picker ─────────────────────────────────────────── */
.t-goalpick { position: relative; }
.t-goalpick__trigger {
  display: flex; align-items: center; gap: 8px; width: 100%;
  padding: 8px 10px;
  background: var(--t-bg);
  border: 1px solid var(--t-divider);
  border-radius: 9px;
  cursor: pointer; text-align: left;
  transition: border-color 0.12s ease;
}
.t-goalpick__trigger:hover,
.t-goalpick__trigger[aria-expanded="true"] { border-color: var(--t-accent); }
.t-goalpick__trigger:disabled { opacity: 0.5; cursor: not-allowed; }
.t-goalpick__value {
  flex: 1; min-width: 0;
  font-size: 14px; font-weight: 500; color: var(--t-ink-1);
  overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
}
.t-goalpick__trigger[data-empty] .t-goalpick__value { color: var(--t-ink-3); }
.t-goalpick__caret { color: var(--t-ink-3); flex-shrink: 0; }
.t-goalpick__panel {
  position: absolute; top: calc(100% + 6px); left: 0; right: 0;
  max-height: 220px; overflow-y: auto;
  padding: 5px;
  background: var(--t-surface);
  border: 1px solid var(--t-divider);
  border-radius: 11px;
  box-shadow: 0 18px 40px -14px rgba(0,0,0,0.35);
  z-index: 60;
  animation: t-pop-in 0.14s cubic-bezier(0.2,0.9,0.3,1);
}
.t-goalpick__opt {
  display: block; width: 100%; text-align: left;
  padding: 8px 10px; border: none; background: transparent;
  border-radius: 7px; cursor: pointer;
  font-size: 14px; font-weight: 500; color: var(--t-ink-1);
  font-family: inherit;
  overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
  transition: background 0.1s ease;
}
.t-goalpick__opt:hover { background: var(--t-bg); }
.t-goalpick__opt[data-active] {
  background: var(--t-accent-soft); color: var(--t-accent-ink);
}
.t-goalpick__empty {
  padding: 8px 10px; font-size: 13px; color: var(--t-ink-3);
}
.t-palette__input {
  flex: 1; border: none; outline: none; background: transparent;
  font-size: 17px; font-weight: 500; color: var(--t-ink-1);
  letter-spacing: -0.01em;
}
.t-palette__input::placeholder { color: var(--t-ink-3); }
/* Slim disclosure row under the title: fine-tune toggle + summary chips. */
.t-palette__more {
  display: flex; align-items: center; gap: 10px; flex-wrap: wrap;
  padding: 8px 14px 8px 12px;
  border-bottom: 1px solid var(--t-divider);
}
.t-palette__more-toggle {
  display: inline-flex; align-items: center; gap: 6px;
  border: none; background: transparent; cursor: pointer;
  padding: 5px 9px; border-radius: 7px;
  font-family: inherit; font-size: 12.5px; font-weight: 600; color: var(--t-ink-2);
  transition: background 0.12s ease, color 0.12s ease;
}
.t-palette__more-toggle:hover { background: var(--t-hover); color: var(--t-ink-1); }
.t-palette__more-toggle svg { transition: transform 0.15s ease; color: var(--t-ink-3); }
.t-palette__more-toggle[aria-expanded="true"] svg { transform: rotate(90deg); }
.t-palette__summary {
  display: flex; align-items: center; gap: 6px; flex-wrap: wrap; margin-left: auto;
}
.t-palette__sum-chip {
  display: inline-flex; align-items: center; gap: 6px;
  max-width: 180px; overflow: hidden;
  padding: 3px 9px; border-radius: 999px;
  border: 1px solid var(--t-divider); background: var(--t-bg);
  color: var(--t-ink-2); font-family: inherit;
  font-size: 11.5px; font-weight: 600; white-space: nowrap; text-overflow: ellipsis;
  cursor: pointer;
  transition: border-color 0.12s ease, color 0.12s ease;
}
.t-palette__sum-chip:hover { border-color: var(--t-accent); color: var(--t-ink-1); }

/* Expanded fine-tune area, organized into titled sections. */
.t-palette__details {
  display: flex; flex-direction: column; gap: 18px;
  padding: 16px 20px 18px;
  border-bottom: 1px solid var(--t-divider);
  max-height: min(56vh, 480px); overflow-y: auto;
  overscroll-behavior: contain;
}
.t-palette__section { display: flex; flex-direction: column; gap: 10px; }
.t-palette__section-head {
  display: flex; align-items: center; gap: 10px;
  font-size: 11px; font-weight: 700;
  text-transform: uppercase; letter-spacing: 0.08em;
  color: var(--t-ink-3);
}
.t-palette__section-head::after {
  content: ""; flex: 1; height: 1px; background: var(--t-divider);
}
.t-palette__grid { display: flex; gap: 20px; flex-wrap: wrap; align-items: flex-start; }
.t-palette__field {
  display: flex; flex-direction: column; gap: 6px;
  flex: 1 1 220px; min-width: 0;
}
.t-palette__field--narrow { flex: 0 1 auto; }

/* Target date: shadcn calendar popover trigger + quick chips. */
.t-palette__date { display: flex; align-items: center; gap: 6px; flex-wrap: wrap; }
.t-palette__date-btn {
  display: inline-flex; align-items: center; gap: 8px;
  padding: 8px 12px;
  background: var(--t-bg);
  border: 1px solid var(--t-divider);
  border-radius: 9px;
  cursor: pointer;
  font-family: inherit; font-size: 13.5px; font-weight: 600; color: var(--t-ink-1);
  transition: border-color 0.12s ease;
}
.t-palette__date-btn svg { color: var(--t-ink-3); }
.t-palette__date-btn:hover, .t-palette__date-btn[data-state="open"] { border-color: var(--t-accent); }
.t-palette__date-btn[data-empty] { color: var(--t-ink-3); font-weight: 500; }
.t-palette__date-btn:disabled { opacity: 0.5; cursor: not-allowed; }

/* Slider blocks (day time slot, difficulty). */
.t-palette__slot { display: flex; flex-direction: column; gap: 10px; min-width: 0; }
.t-palette__slot-head { display: flex; align-items: center; gap: 8px; min-height: 22px; }
.t-palette__slot-value {
  font-size: 13px; font-weight: 600; color: var(--t-ink-1);
  font-variant-numeric: tabular-nums;
}
.t-palette__scale {
  display: flex; justify-content: space-between;
  font-size: 10.5px; font-weight: 600; color: var(--t-ink-3);
  font-variant-numeric: tabular-nums;
}
.t-palette [data-slot=slider] { height: 16px; }
.t-palette [data-slot=slider-track] { background: var(--t-chip-bg); }
.t-palette [data-slot=slider-range] { background: var(--t-accent); }
.t-palette [data-slot=slider-thumb] {
  border-color: var(--t-accent); background: var(--t-surface);
  box-shadow: 0 1px 3px rgba(0,0,0,0.18);
}
.t-palette [data-unset] [data-slot=slider-range] { background: var(--t-ink-4); }
.t-palette [data-unset] [data-slot=slider-thumb] { border-color: var(--t-ink-4); }

/* Segmented control (priority). */
.t-seg {
  display: inline-flex; align-self: flex-start;
  padding: 3px; gap: 2px;
  background: var(--t-chip-bg); border-radius: 9px;
}
.t-seg button {
  display: inline-flex; align-items: center; gap: 6px;
  border: none; background: transparent; cursor: pointer;
  height: 28px; padding: 0 11px; border-radius: 7px;
  font-family: inherit; font-size: 12.5px; font-weight: 600; color: var(--t-ink-2);
  transition: background 0.12s ease, color 0.12s ease;
}
.t-seg button:disabled { opacity: 0.5; cursor: not-allowed; }
.t-seg button[data-active] {
  background: var(--t-surface); color: var(--t-ink-1);
  box-shadow: 0 1px 0 rgba(0,0,0,0.04), 0 2px 6px -2px rgba(0,0,0,0.08);
}
.t-prio-dot { width: 8px; height: 8px; border-radius: 50%; flex-shrink: 0; }
.t-prio-dot--high { background: #e25151; }
.t-prio-dot--medium { background: #e8a13c; }
.t-prio-dot--low { background: #5b8df8; }
.t-palette__label {
  font-size: 11px; font-weight: 600;
  text-transform: uppercase; letter-spacing: 0.04em;
  color: var(--t-ink-3);
}
.t-palette__field-input {
  display: inline-flex; align-items: center; gap: 8px;
  padding: 8px 10px;
  background: var(--t-bg);
  border: 1px solid var(--t-divider);
  border-radius: 9px;
  transition: border-color 0.12s ease;
}
.t-palette__field-input:focus-within {
  border-color: var(--t-accent);
}
.t-palette__field-input input {
  flex: 1; min-width: 0;
  border: none; outline: none; background: transparent;
  font-size: 14px; font-weight: 500; color: var(--t-ink-1);
  font-family: inherit;
}
.t-palette__field-input input::placeholder { color: var(--t-ink-3); }
.t-palette__suffix {
  font-size: 12px; color: var(--t-ink-3);
  font-variant-numeric: tabular-nums;
}
.t-palette__chip {
  padding: 4px 9px;
  border-radius: 7px;
  border: 1px solid var(--t-divider);
  background: var(--t-surface);
  color: var(--t-ink-2);
  font-size: 11px; font-weight: 600;
  cursor: pointer;
  transition: background 0.12s ease, color 0.12s ease, border-color 0.12s ease;
}
.t-palette__chip:hover {
  background: var(--t-accent-soft);
  color: var(--t-accent-ink);
  border-color: var(--t-accent-soft);
}
.t-palette__chip:disabled { opacity: 0.5; cursor: not-allowed; }
.t-palette__chip--ghost {
  background: transparent;
  color: var(--t-ink-3);
}
.t-palette__error {
  padding: 10px 20px;
  background: rgba(220, 38, 38, 0.08);
  color: #b91c1c;
  font-size: 12px; font-weight: 500;
  border-bottom: 1px solid var(--t-divider);
}
[data-today-theme="dark"] .t-palette__error {
  background: rgba(248, 113, 113, 0.12);
  color: #fca5a5;
}
.t-palette__hints {
  display: flex; align-items: center; justify-content: space-between; gap: 16px;
  padding: 12px 20px; background: var(--t-bg);
  font-size: 12px; color: var(--t-ink-2);
  flex-wrap: wrap;
}

/* Enter/submit affordance beside the title input. */
.t-palette__enter {
  display: inline-flex; align-items: center; justify-content: center;
  padding: 3px; border: none; background: transparent;
  border-radius: 6px; cursor: pointer; flex-shrink: 0;
  transition: background 0.12s ease, opacity 0.12s ease;
}
.t-palette__enter:hover:not(:disabled) { background: var(--t-hover); }
.t-palette__enter:disabled { opacity: 0.45; cursor: not-allowed; }

/* Primary "Add task" button in the footer action row. */
.t-palette__save {
  display: inline-flex; align-items: center; gap: 8px;
  padding: 7px 14px; border: none; border-radius: 9px;
  background: var(--t-accent); color: #fff;
  font-family: inherit; font-size: 13px; font-weight: 600;
  letter-spacing: -0.01em; cursor: pointer;
  transition: filter 0.12s ease, opacity 0.12s ease;
}
.t-palette__save:hover:not(:disabled) { filter: brightness(1.06); }
.t-palette__save:disabled { opacity: 0.5; cursor: not-allowed; }

/* ── Tweaks panel ────────────────────────────────────────── */
.t-tweaks {
  position: fixed; right: 24px; bottom: 24px; z-index: 30;
  display: flex; flex-direction: column; align-items: flex-end; gap: 10px;
}
.t-tweaks__panel {
  width: 280px;
  background: var(--t-surface);
  border: 1px solid var(--t-divider);
  border-radius: 16px;
  box-shadow: var(--t-shadow-elev);
  padding: 14px 16px;
  display: flex; flex-direction: column; gap: 14px;
}
.t-tweaks__section {
  font-size: 10.5px; font-weight: 700; letter-spacing: 0.12em;
  text-transform: uppercase; color: var(--t-ink-3);
}
.t-tweaks__row { display: flex; align-items: center; justify-content: space-between; gap: 12px; font-size: 13px; color: var(--t-ink-1); font-weight: 600; }
.t-tweaks__radio { display: inline-flex; padding: 3px; background: var(--t-chip-bg); border-radius: 9px; gap: 2px; }
.t-tweaks__radio button {
  border: none; background: transparent; cursor: pointer;
  height: 26px; padding: 0 10px; border-radius: 7px;
  font-size: 12px; font-weight: 600; color: var(--t-ink-2);
}
.t-tweaks__radio button[data-active="true"] {
  background: var(--t-surface); color: var(--t-ink-1);
  box-shadow: 0 1px 0 rgba(0,0,0,0.04), 0 2px 6px -2px rgba(0,0,0,0.08);
}
.t-tweaks__swatches { display: inline-flex; gap: 6px; }
.t-tweaks__swatch {
  width: 22px; height: 22px; border-radius: 7px;
  border: 2px solid transparent; cursor: pointer; padding: 0;
}
.t-tweaks__swatch[data-active="true"] { border-color: var(--t-ink-1); }
`
