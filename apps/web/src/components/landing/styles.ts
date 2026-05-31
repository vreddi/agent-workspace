export const landingStyles = `
.landing-root {
  --landing-ink: #1c1814;
  --landing-ink-2: #4a443d;
  --landing-ink-3: #8a8278;
  --landing-paper: #fdfaf6;
  --landing-line: #ebe5dc;
  --landing-accent: #c9deea;
  --landing-accent-ink: #2f4a5a;
  --landing-cta: #15110d;
  --landing-cta-ink: #faf7f2;
  font-family: 'Plus Jakarta Sans', ui-sans-serif, system-ui, -apple-system, sans-serif;
  color: var(--landing-ink);
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  position: relative;
  min-height: 100vh;
  overflow-x: clip;
  background: var(--landing-paper);
}
.landing-root::before {
  content: '';
  position: absolute;
  inset: 0;
  pointer-events: none;
  z-index: 1;
  background:
    linear-gradient(180deg, rgba(140, 120, 96, 0.55) 0%, transparent 4%, transparent 96%, rgba(20, 16, 12, 0.7) 100%),
    linear-gradient(90deg, rgba(140, 120, 96, 0.5) 0%, transparent 3%, transparent 97%, rgba(60, 90, 130, 0.5) 100%);
}
.landing-root *,
.landing-root *::before,
.landing-root *::after {
  box-sizing: border-box;
}
.landing-root a { color: inherit; text-decoration: none; }
.landing-root button { font-family: inherit; }

/* ── Header ────────────────────────────────────────────────── */
.landing-header {
  position: relative;
  z-index: 20;
  display: flex;
  align-items: center;
  gap: clamp(16px, 3vw, 40px);
  padding: 22px clamp(20px, 4vw, 56px);
}
.landing-header__left {
  display: flex; align-items: center; gap: clamp(12px, 1.6vw, 22px);
}
.landing-header__logo {
  display: inline-flex; align-items: center; gap: 10px;
  padding: 4px 6px 4px 0;
  border-radius: 10px;
}
.landing-header__wordmark {
  font-family: 'Bodoni Moda', serif;
  font-weight: 700;
  font-size: 19px;
  letter-spacing: -0.01em;
  color: var(--landing-ink);
}
.landing-header__pills {
  display: inline-flex;
  padding: 4px;
  background: rgba(28, 24, 20, 0.045);
  border-radius: 999px;
  border: 1px solid var(--landing-line);
}
.landing-header__pill {
  appearance: none;
  border: 0;
  background: transparent;
  font-size: 13.5px;
  font-weight: 600;
  letter-spacing: -0.005em;
  color: var(--landing-ink-2);
  padding: 7px 16px;
  border-radius: 999px;
  cursor: pointer;
  transition: color 0.15s, background 0.15s;
}
.landing-header__pill[data-active='true'] {
  background: var(--landing-paper);
  color: var(--landing-ink);
  box-shadow: 0 1px 0 rgba(0,0,0,0.04), 0 4px 14px -8px rgba(0,0,0,0.12);
}
.landing-header__pill:hover { color: var(--landing-ink); }

.landing-header__nav {
  margin-left: auto;
  display: flex;
  align-items: center;
  gap: clamp(18px, 2.4vw, 32px);
}
.landing-header__link {
  font-size: 13.5px;
  font-weight: 600;
  letter-spacing: -0.005em;
  color: var(--landing-ink-2);
  transition: color 0.15s;
}
.landing-header__link:hover { color: var(--landing-ink); }

.landing-header__right {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-left: clamp(18px, 3vw, 36px);
}
.landing-header__signin {
  appearance: none;
  border: 1px solid var(--landing-ink);
  background: transparent;
  color: var(--landing-ink);
  font-size: 13.5px;
  font-weight: 600;
  letter-spacing: -0.005em;
  padding: 9px 20px;
  border-radius: 999px;
  cursor: pointer;
  transition: background 0.15s, color 0.15s, transform 0.08s;
}
.landing-header__signin:hover {
  background: var(--landing-ink);
  color: var(--landing-paper);
}
.landing-header__signin:active { transform: translateY(1px); }

/* ── User menu (signed in) ────────────────────────────────── */
.landing-user { position: relative; }
.landing-avatar {
  appearance: none;
  border: 1px solid var(--landing-line);
  background: var(--landing-paper);
  width: 38px; height: 38px;
  border-radius: 999px;
  padding: 0; overflow: hidden;
  cursor: pointer;
  display: inline-flex; align-items: center; justify-content: center;
  font-size: 13px; font-weight: 700;
  color: var(--landing-ink);
  letter-spacing: -0.01em;
  transition: transform 0.08s, box-shadow 0.15s;
  box-shadow: 0 1px 0 rgba(0,0,0,0.04), 0 4px 14px -8px rgba(0,0,0,0.16);
}
.landing-avatar:hover { transform: translateY(-1px); box-shadow: 0 2px 0 rgba(0,0,0,0.04), 0 8px 18px -10px rgba(0,0,0,0.24); }
.landing-avatar img { width: 100%; height: 100%; object-fit: cover; }
.landing-avatar--ghost {
  background: var(--landing-line);
  cursor: default;
  pointer-events: none;
  opacity: 0.55;
}
.landing-user__menu {
  position: absolute; right: 0; top: calc(100% + 8px);
  min-width: 240px;
  background: var(--landing-paper);
  border: 1px solid var(--landing-line);
  border-radius: 14px;
  padding: 6px;
  box-shadow: 0 1px 0 rgba(0,0,0,0.03), 0 22px 50px -22px rgba(28,24,20,0.28);
  z-index: 30;
  animation: landing-pop 0.18s cubic-bezier(0.22, 1, 0.36, 1);
}
.landing-user__head {
  padding: 10px 12px 12px;
  border-bottom: 1px solid var(--landing-line);
  margin-bottom: 6px;
}
.landing-user__name { font-size: 13px; font-weight: 700; color: var(--landing-ink); }
.landing-user__email { font-size: 12px; color: var(--landing-ink-3); margin-top: 2px; }
.landing-user__item {
  display: flex; align-items: center; gap: 10px;
  width: 100%;
  appearance: none; border: 0;
  background: transparent;
  padding: 9px 12px;
  border-radius: 9px;
  font-size: 13px; font-weight: 600;
  color: var(--landing-ink);
  cursor: pointer;
  text-align: left;
}
.landing-user__item:hover { background: rgba(28,24,20,0.05); }
.landing-user__item--quiet { color: var(--landing-ink-2); }
@keyframes landing-pop {
  from { opacity: 0; transform: translateY(-4px); }
  to   { opacity: 1; transform: translateY(0); }
}

/* ── Canyon backdrop ──────────────────────────────────────── */
.canyon {
  position: absolute;
  inset: 0;
  z-index: 0;
  pointer-events: none;
  overflow: hidden;
}
.canyon__sky {
  position: absolute;
  inset: 0;
  background:
    radial-gradient(120% 60% at 50% 95%, rgba(232, 196, 162, 0.45) 0%, transparent 60%),
    linear-gradient(180deg, #fcf7ef 0%, #fdf9f3 55%, #fdf6ec 100%);
  will-change: transform;
}
.canyon__sun {
  position: absolute;
  left: 50%; top: 12%;
  width: clamp(320px, 42vw, 580px);
  aspect-ratio: 1;
  transform: translateX(-50%);
  background: radial-gradient(closest-side, rgba(255, 220, 180, 0.55), rgba(255, 220, 180, 0));
  filter: blur(8px);
}
.canyon__layer {
  position: absolute;
  left: -6%;
  right: -6%;
  bottom: 0;
  height: 100%;
  will-change: transform;
}
.canyon__layer--front { z-index: 4; }
.canyon__layer svg { display: block; width: 100%; height: 100%; }

.canyon__birds {
  position: absolute;
  inset: 0;
  will-change: transform;
  pointer-events: none;
  z-index: 3;
}
.canyon__bird {
  position: absolute;
  transform-origin: center;
  animation: landing-bird-drift 11s ease-in-out infinite;
  opacity: 0.85;
}
@keyframes landing-bird-drift {
  0%, 100% { transform: translate(0, 0); }
  50%      { transform: translate(28px, -10px); }
}

.canyon__mist {
  position: absolute;
  inset: 0;
  z-index: 5;
  pointer-events: none;
  background:
    radial-gradient(46% 38% at 50% 56%, rgba(253, 250, 246, 0.85) 0%, rgba(253, 250, 246, 0) 70%),
    radial-gradient(60% 30% at 50% 82%, rgba(253, 250, 246, 0.9) 0%, rgba(253, 250, 246, 0) 75%),
    linear-gradient(180deg, rgba(253, 250, 246, 0.7) 0%, rgba(253, 250, 246, 0) 30%);
}

/* ── Hero ─────────────────────────────────────────────────── */
.landing-hero {
  position: relative;
  z-index: 10;
  max-width: 1180px;
  margin: 0 auto;
  padding: clamp(36px, 6vw, 84px) clamp(20px, 4vw, 56px) clamp(40px, 5vw, 96px);
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
}

.landing-eyebrow {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 7px 14px 7px 12px;
  border-radius: 999px;
  background: var(--landing-accent);
  color: var(--landing-accent-ink);
  font-size: 12.5px;
  font-weight: 600;
  letter-spacing: -0.005em;
  margin-bottom: clamp(22px, 3vw, 36px);
  animation: landing-up 0.7s 0.05s cubic-bezier(0.22, 1, 0.36, 1) backwards;
}
.landing-eyebrow__dot {
  width: 6px; height: 6px; border-radius: 50%;
  background: var(--landing-accent-ink);
  box-shadow: 0 0 0 4px rgba(47, 74, 90, 0.12);
}
.landing-eyebrow__strong { font-weight: 800; letter-spacing: 0; }
.landing-eyebrow__divider { opacity: 0.55; margin: 0 2px; }

.landing-headline {
  font-family: 'Bodoni Moda', 'Bodoni 72', serif;
  font-weight: 600;
  font-size: clamp(2.75rem, 5.6vw + 0.6rem, 5.5rem);
  line-height: 1.02;
  letter-spacing: -0.02em;
  color: var(--landing-ink);
  margin: 0 0 clamp(20px, 2.4vw, 28px);
  max-width: 14ch;
  animation: landing-up 0.85s 0.12s cubic-bezier(0.22, 1, 0.36, 1) backwards;
}
.landing-headline__em {
  font-style: italic;
  font-weight: 500;
  color: #7d4326;
  font-feature-settings: 'liga' 1, 'dlig' 1;
}

.landing-sub {
  font-size: clamp(15px, 1vw + 0.4rem, 17.5px);
  line-height: 1.55;
  color: var(--landing-ink-2);
  max-width: 56ch;
  margin: 0 auto clamp(28px, 3.4vw, 44px);
  animation: landing-up 0.9s 0.22s cubic-bezier(0.22, 1, 0.36, 1) backwards;
}

.landing-cta-row {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 12px;
  animation: landing-up 0.95s 0.32s cubic-bezier(0.22, 1, 0.36, 1) backwards;
}
.landing-btn {
  display: inline-flex;
  align-items: center;
  gap: 10px;
  height: 52px;
  padding: 0 24px;
  border-radius: 999px;
  font-size: 14.5px;
  font-weight: 600;
  letter-spacing: -0.005em;
  cursor: pointer;
  transition: transform 0.08s, box-shadow 0.18s, background 0.15s, color 0.15s;
  appearance: none;
  border: 1px solid transparent;
}
.landing-btn:active { transform: translateY(1px); }
.landing-btn--primary {
  background: var(--landing-cta);
  color: var(--landing-cta-ink);
  box-shadow: 0 1px 0 rgba(0,0,0,0.18), 0 18px 36px -14px rgba(21, 17, 13, 0.55);
}
.landing-btn--primary:hover {
  background: #2a221b;
  box-shadow: 0 1px 0 rgba(0,0,0,0.18), 0 22px 44px -14px rgba(21, 17, 13, 0.6);
}
.landing-btn--outline {
  background: var(--landing-paper);
  color: var(--landing-ink);
  border-color: var(--landing-ink);
}
.landing-btn--outline:hover {
  background: var(--landing-ink);
  color: var(--landing-paper);
}

/* ── Trust row ────────────────────────────────────────────── */
.landing-trust {
  margin-top: clamp(52px, 6vw, 96px);
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 18px;
  animation: landing-up 1s 0.45s cubic-bezier(0.22, 1, 0.36, 1) backwards;
}
.landing-trust__label {
  font-size: 12px;
  font-weight: 600;
  letter-spacing: 0.02em;
  color: var(--landing-ink-3);
  margin: 0;
}
.landing-trust__row {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  align-items: center;
  gap: clamp(20px, 3vw, 44px);
  color: var(--landing-ink);
  opacity: 0.78;
}
.landing-trust__mark {
  font-size: 16.5px;
  white-space: nowrap;
  filter: saturate(0);
  transition: opacity 0.18s, filter 0.18s;
}
.landing-trust__mark:hover { filter: none; opacity: 1; }
.landing-trust__mark--lower-serif {
  font-family: 'Bodoni Moda', serif;
  font-weight: 600;
  letter-spacing: -0.01em;
  font-size: 19px;
}
.landing-trust__mark--tight-sans {
  font-weight: 800;
  letter-spacing: 0.14em;
  font-size: 13px;
}
.landing-trust__mark--mixed {
  font-weight: 700;
  letter-spacing: -0.01em;
}
.landing-trust__mark--lower-mono {
  font-family: 'DM Mono', ui-monospace, monospace;
  font-weight: 500;
  font-size: 15px;
  letter-spacing: -0.01em;
}
.landing-trust__mark--lower-italic {
  font-family: 'Bodoni Moda', serif;
  font-style: italic;
  font-weight: 500;
  font-size: 18px;
}
.landing-trust__mark--wide-mono {
  font-family: 'DM Mono', ui-monospace, monospace;
  font-weight: 600;
  letter-spacing: 0.18em;
  font-size: 13px;
}

@keyframes landing-up {
  from { opacity: 0; transform: translateY(14px); }
  to   { opacity: 1; transform: translateY(0); }
}

/* ── Responsive ───────────────────────────────────────────── */
@media (max-width: 900px) {
  .landing-header__nav { display: none; }
  .landing-header__right { margin-left: auto; }
}
@media (max-width: 640px) {
  .landing-header { padding: 16px 18px; gap: 12px; }
  .landing-header__pills { display: none; }
  .landing-header__wordmark { font-size: 17px; }
  .landing-hero { padding: 28px 18px 64px; }
  .landing-btn { height: 48px; padding: 0 20px; }
  .landing-trust { margin-top: 56px; }
  .canyon__layer { left: -18%; right: -18%; }
  .canyon__mist {
    background:
      radial-gradient(70% 50% at 50% 50%, rgba(253, 250, 246, 0.92) 0%, rgba(253, 250, 246, 0) 75%),
      linear-gradient(180deg, rgba(253, 250, 246, 0.78) 0%, rgba(253, 250, 246, 0) 38%);
  }
}

@media (prefers-reduced-motion: reduce) {
  .landing-eyebrow,
  .landing-headline,
  .landing-sub,
  .landing-cta-row,
  .landing-trust { animation: none; }
  .canyon__bird { animation: none; }
}
`
