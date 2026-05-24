export const todayStyles = `
[data-today-theme="light"] {
  --t-bg: #f5f6fa;
  --t-surface: #ffffff;
  --t-rail: #ffffff;
  --t-ink-1: #14161d;
  --t-ink-2: #5b6173;
  --t-ink-3: #9aa0b2;
  --t-ink-4: #c5cad7;
  --t-divider: #eef0f5;
  --t-chip-bg: #f3f4f8;
  --t-hover: #f7f8fc;
  --t-accent: var(--t-accent-raw, #2b6ef5);
  --t-accent-soft: color-mix(in srgb, var(--t-accent) 14%, var(--t-surface));
  --t-accent-ink: color-mix(in srgb, var(--t-accent) 80%, #000);
  --t-overdue: #e25151;
  --t-overdue-soft: #fde8e8;
  --t-pink: #ec4899;
  --t-shadow-card: 0 1px 0 rgba(20,22,29,0.03), 0 4px 14px -6px rgba(20,22,29,0.08);
  --t-shadow-elev: 0 1px 0 rgba(20,22,29,0.04), 0 10px 28px -12px rgba(20,22,29,0.18);
  --t-kbd-bg: #ffffff;
  --t-kbd-border: #e3e6ee;
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
  --t-pink: #f472b6;
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

/* ── Topbar ────────────────────────────────────────────────── */
.t-topbar {
  display: flex; align-items: center; gap: 16px;
  padding: 22px 12px 18px;
  background: var(--t-bg);
  position: sticky; top: 0; z-index: 4;
  border-bottom: 1px solid transparent;
}
.t-brand { display: flex; align-items: center; gap: 10px; }
.t-brand__mark {
  width: 32px; height: 32px; border-radius: 9px;
  background: var(--t-accent); color: white;
  display: flex; align-items: center; justify-content: center;
  font-size: 16px; font-weight: 800; letter-spacing: -0.04em;
  box-shadow: inset 0 -2px 0 rgba(0,0,0,0.12);
}
.t-topbar h1 { margin: 0; font-size: 30px; font-weight: 800; letter-spacing: -0.03em; color: var(--t-ink-1); }
.t-topbar__meta {
  font-size: 13px; color: var(--t-ink-2); font-weight: 500;
  margin-left: 4px; display: flex; align-items: center; gap: 10px;
}
.t-dot-tiny { width: 3px; height: 3px; border-radius: 50%; background: var(--t-ink-4); }
.t-btn-create {
  height: 44px; padding: 0 18px 0 14px; border-radius: 11px; border: none;
  background: var(--t-accent); color: white; cursor: pointer;
  display: inline-flex; align-items: center; gap: 8px;
  font-size: 14px; font-weight: 700; letter-spacing: -0.01em;
  box-shadow: 0 8px 22px -10px var(--t-accent);
  transition: transform 0.08s, box-shadow 0.12s;
}
.t-btn-create:hover { transform: translateY(-1px); box-shadow: 0 12px 28px -10px var(--t-accent); }
.t-btn-create:active { transform: translateY(0); }
.t-icon-btn {
  width: 40px; height: 40px; border-radius: 11px;
  background: var(--t-surface); border: 1px solid var(--t-divider);
  display: flex; align-items: center; justify-content: center;
  cursor: pointer; color: var(--t-ink-2);
  position: relative; transition: background 0.12s;
}
.t-icon-btn:hover { background: var(--t-hover); }
.t-icon-btn__dot {
  position: absolute; top: 8px; right: 8px;
  width: 8px; height: 8px; border-radius: 50%;
  background: var(--t-pink); box-shadow: 0 0 0 2px var(--t-bg);
}
.t-me-pill {
  width: 40px; height: 40px; border-radius: 11px;
  background: linear-gradient(135deg, #18a86b, #0e7a4d);
  color: #fff; font-size: 15px; font-weight: 800;
  display: flex; align-items: center; justify-content: center;
  letter-spacing: -0.02em;
  box-shadow: inset 0 -2px 0 rgba(0,0,0,0.12);
}

/* ── Hero ─────────────────────────────────────────────────── */
.t-hero { padding: 8px 12px 26px; display: grid; grid-template-columns: 1.1fr 1fr; gap: 22px; }
@media (max-width: 880px) { .t-hero { grid-template-columns: 1fr; } }
.t-hero__main { display: flex; flex-direction: column; gap: 14px; }
.t-greeting {
  font-size: 38px; font-weight: 700;
  letter-spacing: -0.025em; line-height: 1.1;
  color: var(--t-ink-1); margin: 0;
  text-wrap: pretty;
}
.t-wave { display: inline-block; transform-origin: 70% 70%; animation: t-wave 2.5s ease-in-out infinite; }
@keyframes t-wave {
  0%, 60%, 100% { transform: rotate(0deg); }
  10% { transform: rotate(14deg); }
  20% { transform: rotate(-8deg); }
  30% { transform: rotate(14deg); }
  40% { transform: rotate(-4deg); }
  50% { transform: rotate(10deg); }
}
.t-subgreeting { font-size: 15px; color: var(--t-ink-2); font-weight: 500; line-height: 1.5; max-width: 60ch; text-wrap: pretty; }
.t-ai-pill {
  align-self: flex-start;
  margin-top: 6px;
  display: inline-flex; align-items: center; gap: 10px;
  padding: 10px 16px 10px 12px;
  background: var(--t-accent-soft); color: var(--t-accent-ink);
  border-radius: 999px;
  font-size: 13px; font-weight: 600;
  max-width: 100%;
}
.t-ai-pill__star {
  width: 22px; height: 22px; border-radius: 50%;
  background: var(--t-accent); color: #fff;
  display: flex; align-items: center; justify-content: center;
  font-size: 12px; flex-shrink: 0;
}
.t-caret {
  display: inline-block; width: 2px; height: 0.9em;
  background: currentColor; vertical-align: -2px; margin-left: 2px;
  opacity: 0.6; animation: t-blink 1s steps(1) infinite;
}
@keyframes t-blink { 50% { opacity: 0; } }

/* ── Up next card ─────────────────────────────────────────── */
.t-upnext {
  background: var(--t-surface);
  border-radius: 18px;
  padding: 22px;
  box-shadow: var(--t-shadow-elev);
  display: flex; flex-direction: column; gap: 14px;
  position: relative; overflow: hidden;
}
.t-upnext__eyebrow {
  display: flex; align-items: center; gap: 10px;
  font-size: 11px; font-weight: 700; letter-spacing: 0.12em;
  text-transform: uppercase; color: var(--t-accent);
}
.t-upnext__eyebrow .t-dot {
  width: 7px; height: 7px; border-radius: 50%;
  background: var(--t-accent); animation: t-pulse 1.6s ease-in-out infinite;
}
@keyframes t-pulse {
  0%, 100% { opacity: 1; transform: scale(1); }
  50% { opacity: 0.55; transform: scale(0.8); }
}
.t-upnext__title { margin: 0; font-size: 20px; font-weight: 700; letter-spacing: -0.015em; line-height: 1.3; color: var(--t-ink-1); text-wrap: balance; }
.t-upnext__countdown {
  display: flex; align-items: baseline; gap: 8px;
  font-variant-numeric: tabular-nums;
}
.t-upnext__countdown b { font-size: 30px; font-weight: 800; letter-spacing: -0.03em; color: var(--t-ink-1); }
.t-upnext__countdown small { font-size: 13px; font-weight: 600; color: var(--t-ink-2); }
.t-upnext__row { display: flex; align-items: center; gap: 10px; margin-top: 4px; }
.t-upnext__btn-primary {
  height: 36px; padding: 0 14px; border-radius: 9px;
  background: var(--t-accent); color: #fff; border: none;
  font-size: 13px; font-weight: 700; cursor: pointer;
  display: inline-flex; align-items: center; gap: 8px;
}
.t-upnext__btn-secondary {
  height: 36px; padding: 0 14px; border-radius: 9px;
  background: var(--t-chip-bg); color: var(--t-ink-1); border: none;
  font-size: 13px; font-weight: 600; cursor: pointer;
}
.t-upnext__assignee {
  display: flex; align-items: center; gap: 10px;
}
.t-upnext__assignee-name {
  font-size: 13px; color: var(--t-ink-2); font-weight: 600;
}

/* ── Tasks section ───────────────────────────────────────── */
.t-tasks-section { padding: 0 12px 60px; }
.t-tasks-head {
  display: flex; align-items: center; gap: 16px;
  margin-bottom: 18px;
}
.t-tasks-head h2 { margin: 0; font-size: 19px; font-weight: 800; letter-spacing: -0.02em; color: var(--t-ink-1); }
.t-tasks-head .t-count { font-size: 13px; color: var(--t-ink-3); font-weight: 600; font-variant-numeric: tabular-nums; }

.t-filter-chips {
  display: flex; gap: 6px; margin-left: auto; padding: 4px;
  background: var(--t-chip-bg); border-radius: 11px;
}
.t-filter-chip {
  border: none; background: transparent; cursor: pointer;
  height: 30px; padding: 0 12px; border-radius: 8px;
  font-size: 12.5px; font-weight: 600; color: var(--t-ink-2);
  display: inline-flex; align-items: center; gap: 6px;
}
.t-filter-chip:hover { color: var(--t-ink-1); }
.t-filter-chip--active {
  background: var(--t-surface); color: var(--t-ink-1);
  box-shadow: 0 1px 0 rgba(0,0,0,0.04), 0 2px 6px -2px rgba(0,0,0,0.08);
}
.t-filter-chip__badge {
  background: var(--t-ink-4); color: var(--t-surface);
  font-size: 10.5px; font-weight: 700; padding: 1px 6px; border-radius: 999px;
  font-variant-numeric: tabular-nums;
}
.t-filter-chip--active .t-filter-chip__badge { background: var(--t-accent); color: #fff; }
.t-filter-chip__badge--overdue { background: var(--t-overdue) !important; color: #fff !important; }

.t-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px; }
@media (max-width: 1200px) { .t-grid { grid-template-columns: repeat(2, 1fr); } }
@media (max-width: 720px) { .t-grid { grid-template-columns: 1fr; } }

/* ── Card ────────────────────────────────────────────────── */
.t-card {
  background: var(--t-surface);
  border-radius: 18px;
  padding: 18px;
  box-shadow: var(--t-shadow-card);
  display: flex; flex-direction: column; gap: 14px;
  transition: transform 0.1s, box-shadow 0.15s;
  position: relative; overflow: hidden;
  min-width: 0;
  text-decoration: none; color: inherit;
}
.t-card:hover { transform: translateY(-2px); box-shadow: var(--t-shadow-elev); }
.t-card--overdue { box-shadow: 0 0 0 1.5px var(--t-overdue-soft) inset, var(--t-shadow-card); }
.t-card__hdr { display: flex; gap: 12px; align-items: flex-start; min-width: 0; }
.t-card__name {
  font-size: 14.5px; font-weight: 700; color: var(--t-ink-1);
  letter-spacing: -0.01em;
  overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
}
.t-card__date {
  font-size: 12px; font-weight: 700; color: var(--t-accent);
  font-variant-numeric: tabular-nums; letter-spacing: 0.01em;
  display: flex; align-items: center; gap: 8px;
  margin-top: 1px;
}
.t-card__date--overdue { color: var(--t-overdue); }
.t-card__date .t-dot { width: 3px; height: 3px; border-radius: 50%; background: var(--t-ink-4); }
.t-card__countdown { font-size: 11.5px; font-weight: 600; color: var(--t-ink-2); }
.t-card__countdown--overdue { color: var(--t-overdue); }
.t-card__title { margin: 0; font-size: 15.5px; font-weight: 700; letter-spacing: -0.012em; line-height: 1.35; color: var(--t-ink-1); text-wrap: pretty; }
.t-card__body {
  margin: 0; font-size: 13.5px; line-height: 1.55; color: var(--t-ink-2);
  display: -webkit-box; -webkit-line-clamp: 3; -webkit-box-orient: vertical;
  overflow: hidden;
}
.t-card__divider { height: 1px; background: var(--t-divider); margin: 0 -4px; }
.t-card__footer { display: flex; align-items: center; justify-content: space-between; gap: 8px; min-height: 32px; }
.t-source-chip {
  display: inline-flex; align-items: center; gap: 8px;
  height: 32px; padding: 0 14px 0 10px;
  border-radius: 999px;
  background: var(--t-chip-bg);
  font-size: 12.5px; font-weight: 700; color: var(--t-ink-1);
  letter-spacing: -0.005em;
}
.t-source-chip svg { flex-shrink: 0; }

.t-ai-badge {
  align-self: flex-start;
  display: inline-flex; align-items: center; gap: 7px;
  height: 24px; padding: 0 10px 0 8px;
  border-radius: 999px;
  background: var(--t-accent-soft); color: var(--t-accent-ink);
  font-size: 11.5px; font-weight: 600;
}
.t-ai-badge__star { width: 6px; height: 6px; border-radius: 50%; background: var(--t-accent); }

.t-card--fresh .t-shimmer-bar {
  height: 9px; border-radius: 5px;
  background: linear-gradient(90deg, var(--t-chip-bg) 0%,
                color-mix(in srgb, var(--t-chip-bg) 60%, var(--t-surface)) 50%,
                var(--t-chip-bg) 100%);
  background-size: 220% 100%;
  animation: t-shimmer 1.4s linear infinite;
}
.t-card--fresh::after {
  content: ""; position: absolute; inset: 0; border-radius: 18px; pointer-events: none;
  box-shadow: inset 0 0 0 1.5px var(--t-accent-soft);
  animation: t-pulse-ring 1.8s ease-in-out infinite;
}
@keyframes t-pulse-ring { 0%, 100% { opacity: 0.4; } 50% { opacity: 1; } }
@keyframes t-shimmer { 0% { background-position: 100% 0; } 100% { background-position: -100% 0; } }

/* ── Avatar ──────────────────────────────────────────────── */
.t-avatar {
  width: 36px; height: 36px; border-radius: 11px;
  display: flex; align-items: center; justify-content: center;
  font-size: 14px; font-weight: 700; flex-shrink: 0;
  letter-spacing: -0.01em;
  box-shadow: inset 0 -2px 0 rgba(0,0,0,0.06);
}
.t-avatar--sm {
  width: 26px; height: 26px; border-radius: 8px; font-size: 11px;
  box-shadow: inset 0 -1px 0 rgba(0,0,0,0.08), 0 0 0 2px var(--t-surface);
}
.t-avatar-stack { display: flex; align-items: center; }
.t-avatar-stack .t-avatar--sm + .t-avatar--sm { margin-left: -8px; }
.t-avatar-stack .t-count {
  margin-left: -8px;
  height: 26px; min-width: 26px; padding: 0 8px;
  border-radius: 8px;
  background: var(--t-chip-bg); color: var(--t-ink-1);
  font-size: 11px; font-weight: 700;
  display: inline-flex; align-items: center; justify-content: center;
  box-shadow: 0 0 0 2px var(--t-surface);
  font-variant-numeric: tabular-nums;
}

.t-clock { font-variant-numeric: tabular-nums; font-feature-settings: "tnum"; }

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
  background: rgba(20,22,29,0.32);
  backdrop-filter: blur(4px);
  -webkit-backdrop-filter: blur(4px);
  display: flex; align-items: flex-start; justify-content: center;
  padding-top: 18vh;
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
  overflow: hidden;
  animation: t-pop-in 0.18s cubic-bezier(0.2,0.9,0.3,1);
}
@keyframes t-fade-in { from{opacity:0} to{opacity:1} }
@keyframes t-pop-in { from{opacity:0;transform:translateY(-8px) scale(0.98)} to{opacity:1;transform:translateY(0) scale(1)} }
.t-palette__row {
  display: flex; align-items: center; gap: 12px; padding: 18px 20px;
  border-bottom: 1px solid var(--t-divider);
}
.t-palette__plus {
  width: 22px; height: 22px; border-radius: 7px;
  background: var(--t-accent-soft); color: var(--t-accent);
  display: flex; align-items: center; justify-content: center;
  font-size: 14px; font-weight: 700; flex-shrink: 0;
}
.t-palette__input {
  flex: 1; border: none; outline: none; background: transparent;
  font-size: 17px; font-weight: 500; color: var(--t-ink-1);
  letter-spacing: -0.01em;
}
.t-palette__input::placeholder { color: var(--t-ink-3); }
.t-palette__hints {
  display: flex; align-items: center; gap: 16px;
  padding: 12px 20px; background: var(--t-bg);
  font-size: 12px; color: var(--t-ink-2);
  flex-wrap: wrap;
}
.t-palette__ai {
  margin-left: auto;
  display: inline-flex; align-items: center; gap: 8px;
  color: var(--t-accent-ink); font-weight: 600;
}

/* ── Tweaks panel ────────────────────────────────────────── */
.t-tweaks {
  position: fixed; right: 24px; bottom: 24px; z-index: 30;
  display: flex; flex-direction: column; align-items: flex-end; gap: 10px;
}
.t-tweaks__toggle {
  width: 44px; height: 44px; border-radius: 14px;
  background: var(--t-surface); border: 1px solid var(--t-divider);
  display: flex; align-items: center; justify-content: center;
  cursor: pointer; color: var(--t-ink-1);
  box-shadow: var(--t-shadow-elev);
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
.t-tweaks__toggle-pill {
  position: relative; width: 32px; height: 18px;
  border-radius: 999px; background: var(--t-ink-4); cursor: pointer;
  border: none; padding: 0; transition: background 0.2s;
}
.t-tweaks__toggle-pill[data-on="true"] { background: var(--t-accent); }
.t-tweaks__toggle-pill::after {
  content: ""; position: absolute; top: 2px; left: 2px;
  width: 14px; height: 14px; border-radius: 50%; background: #fff;
  transition: left 0.2s; box-shadow: 0 1px 2px rgba(0,0,0,0.2);
}
.t-tweaks__toggle-pill[data-on="true"]::after { left: 16px; }

/* ── Group rail ────────────────────────────────────────────── */
.t-group-rail {
  display: flex; align-items: center; gap: 8px;
  padding: 8px 12px 14px;
  overflow-x: auto;
  scrollbar-width: none;
}
.t-group-rail::-webkit-scrollbar { display: none; }
.t-group-pill {
  flex: 0 0 auto;
  display: inline-flex; align-items: center; gap: 8px;
  height: 34px; padding: 0 14px; border-radius: 10px;
  background: var(--t-surface); border: 1px solid var(--t-divider);
  color: var(--t-ink-2); cursor: pointer;
  font-size: 13px; font-weight: 600; letter-spacing: -0.01em;
  transition: background 0.12s, color 0.12s, border-color 0.12s;
}
.t-group-pill:hover { background: var(--t-hover); color: var(--t-ink-1); }
.t-group-pill--active {
  background: var(--t-accent-soft); color: var(--t-accent-ink);
  border-color: color-mix(in srgb, var(--t-accent) 30%, transparent);
}
.t-group-pill__dot {
  width: 8px; height: 8px; border-radius: 50%;
  background: var(--t-ink-4);
}
.t-group-pill__icon { font-size: 14px; line-height: 1; }
.t-group-pill__count {
  margin-left: 2px;
  padding: 0 6px; min-width: 18px; height: 18px;
  border-radius: 999px;
  background: var(--t-chip-bg); color: var(--t-ink-3);
  font-size: 11px; font-weight: 700;
  display: inline-flex; align-items: center; justify-content: center;
}
.t-group-pill--active .t-group-pill__count {
  background: color-mix(in srgb, var(--t-accent) 16%, var(--t-surface));
  color: var(--t-accent-ink);
}
.t-group-pill--ghost {
  background: transparent; border: 1px dashed var(--t-ink-4);
  color: var(--t-ink-3);
}
.t-group-pill--ghost:hover { color: var(--t-ink-1); border-color: var(--t-ink-3); }

/* ── New-group modal ──────────────────────────────────────── */
.t-newgroup-bd {
  position: fixed; inset: 0; z-index: 60;
  background: rgba(20,22,29,0.32);
  display: flex; align-items: flex-start; justify-content: center;
  padding-top: 18vh;
  backdrop-filter: blur(4px);
}
.t-newgroup {
  width: min(440px, 92vw);
  background: var(--t-surface);
  border-radius: 14px;
  border: 1px solid var(--t-divider);
  box-shadow: var(--t-shadow-elev);
  padding: 18px;
  display: flex; flex-direction: column; gap: 14px;
}
.t-newgroup__title { font-size: 14px; font-weight: 700; color: var(--t-ink-1); }
.t-newgroup__input {
  width: 100%; height: 38px;
  border-radius: 9px; border: 1px solid var(--t-divider);
  background: var(--t-bg); color: var(--t-ink-1);
  padding: 0 12px; font-size: 14px; font-weight: 500; outline: none;
}
.t-newgroup__input:focus { border-color: var(--t-accent); }
.t-newgroup__row { display: flex; align-items: center; gap: 10px; flex-wrap: wrap; }
.t-newgroup__swatches { display: inline-flex; gap: 6px; }
.t-newgroup__swatch {
  width: 24px; height: 24px; border-radius: 8px;
  border: 2px solid transparent; cursor: pointer; padding: 0;
}
.t-newgroup__swatch[data-active="true"] {
  border-color: var(--t-ink-1);
  box-shadow: 0 0 0 2px var(--t-surface);
}
.t-newgroup__actions { display: flex; justify-content: flex-end; gap: 8px; }
.t-newgroup__btn {
  height: 32px; padding: 0 12px;
  border-radius: 8px; border: 1px solid var(--t-divider);
  background: var(--t-surface); color: var(--t-ink-2);
  font-size: 12px; font-weight: 600; cursor: pointer;
}
.t-newgroup__btn--primary {
  background: var(--t-accent); color: #fff; border-color: transparent;
}
.t-newgroup__btn:disabled { opacity: 0.5; cursor: not-allowed; }

/* ── Capture palette group chip ───────────────────────────── */
.t-palette__group {
  display: inline-flex; align-items: center; gap: 6px;
  height: 22px; padding: 0 8px; border-radius: 7px;
  background: var(--t-chip-bg); color: var(--t-ink-2);
  font-size: 11px; font-weight: 700; letter-spacing: 0.01em;
}
.t-palette__group__dot {
  width: 8px; height: 8px; border-radius: 50%;
}
`
