export const dayViewStyles = `
/* Shell: shared nav in normal flow on top, the graph fills the rest. */
.day-shell {
  display: flex; flex-direction: column;
  height: 100vh; overflow: hidden;
}
.day-shell__nav {
  width: 100%; max-width: 1240px;
  margin: 0 auto; padding: 0 24px;
  flex-shrink: 0;
}

.day-root {
  --d-bg: #f6f5f1;
  --d-bg-2: #ecebe5;
  --d-ink-1: #16181d;
  --d-ink-2: #4a4f5a;
  --d-ink-3: #8b909c;
  --d-line: rgba(20, 22, 28, 0.08);
  --d-line-strong: rgba(20, 22, 28, 0.18);
  --d-accent: #2b6ef5;
  --d-overdue: #e25151;
  --d-active: #16a34a;
  --d-card: #ffffff;
  --d-shadow-sm: 0 1px 2px rgba(20, 22, 28, 0.04), 0 1px 3px rgba(20, 22, 28, 0.06);
  --d-shadow-md: 0 4px 10px rgba(20, 22, 28, 0.05), 0 12px 24px rgba(20, 22, 28, 0.08);
  --d-shadow-lg: 0 10px 30px rgba(20, 22, 28, 0.08), 0 30px 60px rgba(20, 22, 28, 0.12);

  position: relative;
  flex: 1;
  min-height: 0;
  background:
    radial-gradient(1200px 800px at 20% -10%, rgba(43, 110, 245, 0.10), transparent 60%),
    radial-gradient(1000px 700px at 110% 110%, rgba(120, 80, 240, 0.10), transparent 55%),
    var(--d-bg);
  font-family: 'Plus Jakarta Sans', ui-sans-serif, system-ui, -apple-system, sans-serif;
  color: var(--d-ink-1);
  overflow: hidden;
}

.day-root[data-theme='dark'] {
  --d-bg: #0c0d12;
  --d-bg-2: #14161c;
  --d-ink-1: #f5f6f8;
  --d-ink-2: #b9bdc6;
  --d-ink-3: #7d8390;
  --d-line: rgba(255, 255, 255, 0.08);
  --d-line-strong: rgba(255, 255, 255, 0.18);
  --d-card: #1a1c23;
  --d-shadow-sm: 0 1px 2px rgba(0, 0, 0, 0.3), 0 1px 3px rgba(0, 0, 0, 0.4);
  --d-shadow-md: 0 4px 10px rgba(0, 0, 0, 0.25), 0 12px 24px rgba(0, 0, 0, 0.45);
  --d-shadow-lg: 0 10px 30px rgba(0, 0, 0, 0.30), 0 30px 60px rgba(0, 0, 0, 0.55);
}

/* ── Topbar ─────────────────────────────────────────────────────────── */
.d-topbar {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 64px;
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 0 22px;
  z-index: 20;
  background: linear-gradient(180deg, var(--d-bg) 0%, transparent 100%);
  pointer-events: none;
}
.d-topbar > * { pointer-events: auto; }

.d-back {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  height: 36px;
  padding: 0 12px 0 8px;
  border-radius: 999px;
  border: 1px solid var(--d-line);
  background: var(--d-card);
  color: var(--d-ink-2);
  font-size: 13px;
  font-weight: 600;
  text-decoration: none;
  box-shadow: var(--d-shadow-sm);
  transition: transform 160ms ease, color 160ms ease, border-color 160ms ease;
}
.d-back:hover {
  color: var(--d-ink-1);
  border-color: var(--d-line-strong);
  transform: translateX(-2px);
}
.d-back svg { width: 16px; height: 16px; }

.d-title {
  display: flex;
  flex-direction: column;
  line-height: 1.1;
}
.d-title__main { font-size: 18px; font-weight: 700; letter-spacing: -0.01em; }
.d-title__sub { font-size: 11px; color: var(--d-ink-3); font-weight: 500; margin-top: 2px; }

.d-spacer { flex: 1; }

.d-stat {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  height: 36px;
  padding: 0 14px;
  border-radius: 999px;
  border: 1px solid var(--d-line);
  background: var(--d-card);
  color: var(--d-ink-2);
  font-size: 12px;
  font-weight: 600;
  box-shadow: var(--d-shadow-sm);
}
.d-stat b { color: var(--d-ink-1); font-weight: 700; }
.d-stat--alert b { color: var(--d-overdue); }

/* ── Legend ─────────────────────────────────────────────────────────── */
.d-legend {
  position: absolute;
  left: 22px;
  bottom: 22px;
  z-index: 15;
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 14px 14px;
  border-radius: 14px;
  background: var(--d-card);
  border: 1px solid var(--d-line);
  box-shadow: var(--d-shadow-md);
  font-size: 12px;
  color: var(--d-ink-2);
  min-width: 180px;
}
.d-legend__title {
  font-size: 10px;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--d-ink-3);
  margin-bottom: 2px;
}
.d-legend__row { display: flex; align-items: center; gap: 8px; }
.d-legend__chip {
  width: 10px;
  height: 10px;
  border-radius: 3px;
  background: var(--d-ink-2);
  flex: 0 0 10px;
}
.d-legend__chip--overdue { background: var(--d-overdue); }
.d-legend__chip--active { background: var(--d-active); }
.d-legend__chip--default { background: var(--d-accent); }

/* ── Empty state ─────────────────────────────────────────────────────── */
.d-empty {
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 8px;
  color: var(--d-ink-2);
  text-align: center;
  padding: 24px;
}
.d-empty__title { font-size: 22px; font-weight: 700; letter-spacing: -0.01em; color: var(--d-ink-1); }
.d-empty__body { font-size: 14px; color: var(--d-ink-3); max-width: 360px; line-height: 1.5; }

/* ── Anchor node ─────────────────────────────────────────────────────── */
.d-anchor {
  position: relative;
  width: 240px;
  height: 96px;
  border-radius: 18px;
  background: linear-gradient(180deg, var(--d-card) 0%, var(--d-bg-2) 100%);
  border: 1px solid var(--d-line);
  box-shadow: var(--d-shadow-md);
  overflow: hidden;
}
.d-anchor__inner {
  position: relative;
  z-index: 2;
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 18px 20px;
  height: 100%;
}
.d-anchor__glyph {
  width: 48px;
  height: 48px;
  flex: 0 0 48px;
  border-radius: 14px;
  display: grid;
  place-items: center;
  font-size: 24px;
  color: white;
  background: linear-gradient(135deg, #f7c25c 0%, #ef7c4b 100%);
  box-shadow: 0 4px 16px rgba(239, 124, 75, 0.35);
}
.d-anchor--end .d-anchor__glyph {
  background: linear-gradient(135deg, #6b6fdc 0%, #2c2f7a 100%);
  box-shadow: 0 4px 16px rgba(43, 47, 122, 0.40);
}
.d-anchor__text { display: flex; flex-direction: column; gap: 2px; }
.d-anchor__label { font-size: 16px; font-weight: 700; letter-spacing: -0.01em; }
.d-anchor__sub { font-size: 12px; color: var(--d-ink-3); font-weight: 500; }
.d-anchor__halo {
  position: absolute;
  inset: -2px;
  border-radius: 20px;
  background: conic-gradient(from 180deg, transparent, rgba(247, 194, 92, 0.22), transparent 60%);
  filter: blur(14px);
  opacity: 0.7;
  z-index: 0;
  animation: d-anchor-spin 18s linear infinite;
}
.d-anchor--end .d-anchor__halo {
  background: conic-gradient(from 0deg, transparent, rgba(107, 111, 220, 0.22), transparent 60%);
}
@keyframes d-anchor-spin {
  to { transform: rotate(360deg); }
}

/* ── Bucket node ─────────────────────────────────────────────────────── */
.d-bucket {
  position: relative;
  width: 200px;
  height: 72px;
  border-radius: 999px;
  background: var(--d-card);
  border: 1px solid var(--d-line-strong);
  box-shadow: var(--d-shadow-sm);
  padding: 12px 22px;
  display: flex;
  flex-direction: column;
  justify-content: center;
  overflow: hidden;
}
.d-bucket__pulse {
  position: absolute;
  inset: 0;
  border-radius: inherit;
  background: linear-gradient(90deg, transparent 30%, rgba(43, 110, 245, 0.10) 50%, transparent 70%);
  background-size: 220% 100%;
  animation: d-bucket-shimmer 4.5s ease-in-out infinite;
  pointer-events: none;
}
@keyframes d-bucket-shimmer {
  0%   { background-position: 220% 0; }
  100% { background-position: -120% 0; }
}
.d-bucket__row {
  display: flex;
  align-items: center;
  gap: 10px;
  position: relative;
  z-index: 1;
}
.d-bucket__label {
  font-size: 13px;
  font-weight: 700;
  letter-spacing: -0.01em;
}
.d-bucket__count {
  margin-left: auto;
  min-width: 22px;
  height: 22px;
  padding: 0 7px;
  border-radius: 999px;
  background: var(--d-ink-1);
  color: var(--d-card);
  font-size: 11px;
  font-weight: 700;
  display: inline-flex;
  align-items: center;
  justify-content: center;
}
.d-bucket__hint {
  font-size: 11px;
  color: var(--d-ink-3);
  font-weight: 500;
  margin-top: 2px;
  position: relative;
  z-index: 1;
}

/* ── Task node ───────────────────────────────────────────────────────── */
.d-task {
  position: relative;
  width: 300px;
  min-height: 132px;
  background: var(--d-card);
  border: 1px solid var(--d-line);
  border-radius: 16px;
  padding: 14px 16px 12px;
  display: flex;
  flex-direction: column;
  gap: 8px;
  box-shadow: var(--d-shadow-sm);
  cursor: pointer;
  transition:
    transform 240ms cubic-bezier(0.2, 0.8, 0.2, 1),
    box-shadow 240ms cubic-bezier(0.2, 0.8, 0.2, 1),
    border-color 240ms ease;
  outline: none;
}
.d-task:hover, .d-task:focus-visible {
  transform: translateY(-3px);
  box-shadow: var(--d-shadow-lg);
  border-color: var(--d-line-strong);
}
.d-task--overdue {
  border-color: rgba(226, 81, 81, 0.55);
  box-shadow: 0 0 0 1px rgba(226, 81, 81, 0.18), var(--d-shadow-sm);
}
.d-task--overdue:hover, .d-task--overdue:focus-visible {
  box-shadow: 0 0 0 1px rgba(226, 81, 81, 0.30), var(--d-shadow-lg);
}
.d-task--active::before {
  content: '';
  position: absolute;
  left: 0;
  top: 14px;
  bottom: 14px;
  width: 3px;
  border-radius: 2px;
  background: linear-gradient(180deg, var(--d-active), transparent);
}

.d-task__header { display: flex; align-items: flex-start; gap: 8px; }
.d-task__title {
  flex: 1;
  font-size: 14px;
  font-weight: 700;
  letter-spacing: -0.01em;
  line-height: 1.3;
  color: var(--d-ink-1);
}
.d-task__pulse {
  width: 8px;
  height: 8px;
  flex: 0 0 8px;
  margin-top: 4px;
  border-radius: 999px;
  background: var(--d-active);
  box-shadow: 0 0 0 0 rgba(22, 163, 74, 0.5);
  animation: d-pulse 1.6s ease-out infinite;
}
@keyframes d-pulse {
  0%   { box-shadow: 0 0 0 0 rgba(22, 163, 74, 0.55); }
  70%  { box-shadow: 0 0 0 10px rgba(22, 163, 74, 0); }
  100% { box-shadow: 0 0 0 0 rgba(22, 163, 74, 0); }
}

.d-task__body {
  font-size: 12.5px;
  color: var(--d-ink-2);
  line-height: 1.45;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.d-task__meta {
  margin-top: auto;
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 11.5px;
  font-weight: 600;
}
.d-task__time {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  color: var(--d-ink-2);
  background: var(--d-bg-2);
  padding: 4px 8px;
  border-radius: 999px;
}
.d-task__time--overdue {
  color: var(--d-overdue);
  background: rgba(226, 81, 81, 0.10);
}
.d-task__time--ghost { color: var(--d-ink-3); }
.d-task__sep {
  width: 3px;
  height: 3px;
  border-radius: 999px;
  background: currentColor;
  opacity: 0.5;
}

.d-task__avatars { display: flex; align-items: center; }
.d-task__avatars .d-avatar:not(:first-child) { margin-left: -8px; }
.d-avatar {
  width: 22px;
  height: 22px;
  border-radius: 999px;
  border: 2px solid var(--d-card);
  display: grid;
  place-items: center;
  font-size: 10px;
  font-weight: 700;
  object-fit: cover;
}
.d-task__more {
  margin-left: 4px;
  font-size: 10px;
  font-weight: 700;
  color: var(--d-ink-3);
}

/* ── React Flow surface ──────────────────────────────────────────────── */
.day-flow .react-flow__edge-path {
  stroke: var(--d-line-strong);
  stroke-width: 1.5;
}
.day-flow .react-flow__edge.animated .react-flow__edge-path {
  stroke: var(--d-accent);
  stroke-dasharray: 6 6;
  animation: d-edge-flow 1.8s linear infinite;
}
@keyframes d-edge-flow {
  to { stroke-dashoffset: -24; }
}
.day-flow .react-flow__handle {
  width: 6px;
  height: 6px;
  background: transparent;
  border: none;
  pointer-events: none;
}
.day-flow .react-flow__attribution { display: none; }
.day-flow .react-flow__controls {
  box-shadow: var(--d-shadow-md);
  border: 1px solid var(--d-line);
  border-radius: 10px;
  overflow: hidden;
}
.day-flow .react-flow__controls-button {
  background: var(--d-card);
  border-bottom: 1px solid var(--d-line);
  color: var(--d-ink-2);
}
.day-flow .react-flow__controls-button:hover { color: var(--d-ink-1); }
.day-flow .react-flow__minimap {
  border-radius: 12px;
  border: 1px solid var(--d-line);
  box-shadow: var(--d-shadow-md);
  background: var(--d-card);
}
.day-flow .react-flow__background { background: transparent; }
`
