/**
 * Landing page styles. One long scroll, one day in the village:
 * dawn sky (hero) -> daylight cream (features) -> warm afternoon
 * (village) -> golden hour (accountability, pricing) -> dusk (faq)
 * -> night (final CTA + footer). Section backgrounds hand off to
 * each other so the scroll reads as a single sky.
 */
export const landingStyles = `
html:has(.landing-root) { scroll-behavior: smooth; }

.landing-root {
  --landing-ink: #241f1a;
  --landing-ink-2: #55493d;
  --landing-ink-3: #8a8072;
  --landing-paper: #fdfaf3;
  --landing-line: #eadfcb;
  --landing-gold: #e4b352;
  --landing-cta: #2b2620;
  --landing-cta-ink: #fbf7ee;
  font-family: 'Plus Jakarta Sans', ui-sans-serif, system-ui, -apple-system, sans-serif;
  color: var(--landing-ink);
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  position: relative;
  min-height: 100vh;
  overflow-x: clip;
  background: var(--landing-paper);
}
.landing-root *,
.landing-root *::before,
.landing-root *::after {
  box-sizing: border-box;
}
.landing-root a { color: inherit; text-decoration: none; }
.landing-root button { font-family: inherit; }
.landing-root img { max-width: 100%; }

/* ── Header (floats over the hero sky) ─────────────────────── */
.landing-header {
  position: absolute;
  top: 0; left: 0; right: 0;
  z-index: 30;
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
  background: rgba(253, 250, 243, 0.55);
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
  box-shadow: 0 1px 0 rgba(0,0,0,0.03), 0 22px 50px -22px rgba(36,31,26,0.28);
  z-index: 40;
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
.landing-user__item:hover { background: rgba(36,31,26,0.05); }
.landing-user__item--quiet { color: var(--landing-ink-2); }
@keyframes landing-pop {
  from { opacity: 0; transform: translateY(-4px); }
  to   { opacity: 1; transform: translateY(0); }
}

/* ── Hero + sky ───────────────────────────────────────────── */
.lp-hero {
  position: relative;
  min-height: max(660px, 96vh);
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  background: linear-gradient(180deg,
    #9ed7f2 0%,
    #b7e2f6 26%,
    #d3edf8 48%,
    #ecf6f0 70%,
    #fbf4e0 100%);
}
.sky {
  position: absolute;
  inset: 0;
  z-index: 0;
  pointer-events: none;
  overflow: hidden;
}
.sky__sun {
  position: absolute;
  left: 62%; top: 4%;
  width: clamp(280px, 38vw, 520px);
  aspect-ratio: 1;
  transform: translateX(-50%);
  background: radial-gradient(closest-side, rgba(255, 241, 197, 0.9), rgba(255, 241, 197, 0));
  filter: blur(6px);
}
.sky__layer, .sky__drifters, .sky__sparkles {
  position: absolute;
  inset: 0;
  will-change: transform;
}
.sky__cloud {
  position: absolute;
  height: auto;
  animation: lp-cloud-sway var(--sway, 50s) ease-in-out infinite alternate;
  filter: drop-shadow(0 10px 18px rgba(120, 150, 190, 0.18));
}
@keyframes lp-cloud-sway {
  from { transform: translateX(-14px); }
  to   { transform: translateX(22px); }
}
.sky__cloud--drift {
  left: -14%;
  animation: lp-cloud-cross var(--cross, 180s) linear infinite;
}
@keyframes lp-cloud-cross {
  from { transform: translateX(0); }
  to   { transform: translateX(128vw); }
}
.sky__sparkle {
  position: absolute;
  height: auto;
  opacity: 0.55;
  animation: lp-twinkle 5.5s ease-in-out infinite;
}
@keyframes lp-twinkle {
  0%, 100% { opacity: 0.25; transform: scale(0.85); }
  50%      { opacity: 0.9;  transform: scale(1.1); }
}
.sky__coin {
  position: absolute;
  height: auto;
  animation: lp-coin-bob var(--bob, 7s) ease-in-out infinite alternate;
  filter: drop-shadow(0 8px 14px rgba(120, 96, 40, 0.22));
}
@keyframes lp-coin-bob {
  from { transform: translateY(-7px) rotate(-2deg) scale(var(--coin-scale, 1)); }
  to   { transform: translateY(7px) rotate(2.5deg) scale(var(--coin-scale, 1)); }
}
.sky__hills {
  position: absolute;
  left: -4%; right: -4%; bottom: -2px;
  width: 108%;
  height: clamp(140px, 22vw, 250px);
}

.lp-hero__content {
  position: relative;
  z-index: 10;
  max-width: 1180px;
  margin: 0 auto;
  padding: clamp(96px, 14vh, 150px) clamp(20px, 4vw, 56px) clamp(150px, 24vw, 240px);
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
}
.lp-eyebrow {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 7px 15px 7px 13px;
  border-radius: 999px;
  background: rgba(253, 250, 243, 0.72);
  border: 1px solid rgba(160, 190, 215, 0.5);
  color: #33546b;
  font-size: 12.5px;
  font-weight: 700;
  letter-spacing: 0.01em;
  margin-bottom: clamp(22px, 3vw, 34px);
  animation: lp-up 0.7s 0.05s cubic-bezier(0.22, 1, 0.36, 1) backwards;
}
.lp-eyebrow__dot {
  width: 6px; height: 6px; border-radius: 50%;
  background: #4b7c9b;
}
.lp-headline {
  font-family: 'Bodoni Moda', 'Bodoni 72', serif;
  font-weight: 600;
  font-size: clamp(2.75rem, 5.4vw + 0.6rem, 5.25rem);
  line-height: 1.04;
  letter-spacing: -0.02em;
  color: var(--landing-ink);
  margin: 0 0 clamp(18px, 2.4vw, 26px);
  max-width: 15ch;
  text-wrap: balance;
  animation: lp-up 0.85s 0.12s cubic-bezier(0.22, 1, 0.36, 1) backwards;
}
.lp-headline__em {
  font-style: italic;
  font-weight: 500;
  color: #2e6086;
}
.lp-hero-sub {
  font-size: clamp(15px, 1vw + 0.4rem, 17.5px);
  line-height: 1.6;
  color: #3c4a53;
  max-width: 54ch;
  margin: 0 auto clamp(26px, 3.2vw, 40px);
  animation: lp-up 0.9s 0.22s cubic-bezier(0.22, 1, 0.36, 1) backwards;
}
.lp-hero-note {
  margin: 18px 0 0;
  font-size: 12.5px;
  font-weight: 600;
  color: #52626d;
  animation: lp-up 1s 0.4s cubic-bezier(0.22, 1, 0.36, 1) backwards;
}

/* ── Buttons ──────────────────────────────────────────────── */
.lp-cta-row {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 12px;
  animation: lp-up 0.95s 0.32s cubic-bezier(0.22, 1, 0.36, 1) backwards;
}
.lp-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  height: 52px;
  padding: 0 26px;
  border-radius: 999px;
  font-size: 14.5px;
  font-weight: 700;
  letter-spacing: -0.005em;
  cursor: pointer;
  transition: transform 0.08s, box-shadow 0.18s, background 0.15s, color 0.15s;
  appearance: none;
  border: 1px solid transparent;
}
.lp-btn:active { transform: translateY(1px); }
.lp-btn--primary {
  background: var(--landing-cta);
  color: var(--landing-cta-ink);
  box-shadow: 0 1px 0 rgba(0,0,0,0.18), 0 18px 36px -14px rgba(36, 31, 26, 0.5);
}
.lp-btn--primary:hover {
  background: #3c352c;
  box-shadow: 0 1px 0 rgba(0,0,0,0.18), 0 22px 44px -14px rgba(36, 31, 26, 0.55);
}
.lp-btn--outline {
  background: rgba(253, 250, 243, 0.62);
  color: var(--landing-ink);
  border-color: var(--landing-ink);
}
.lp-btn--outline:hover {
  background: var(--landing-ink);
  color: var(--landing-paper);
}

/* ── Section shells ───────────────────────────────────────── */
.lp-section {
  position: relative;
  padding: clamp(72px, 9vw, 130px) 0;
}
.lp-container {
  max-width: 1180px;
  margin: 0 auto;
  padding: 0 clamp(20px, 4vw, 56px);
}
.lp-container--narrow { max-width: 860px; }
.lp-section-head {
  max-width: 640px;
  margin-bottom: clamp(40px, 6vw, 72px);
}
.lp-h2 {
  font-family: 'Bodoni Moda', serif;
  font-weight: 600;
  font-size: clamp(1.9rem, 2.6vw + 0.6rem, 3rem);
  line-height: 1.1;
  letter-spacing: -0.015em;
  margin: 0 0 14px;
  text-wrap: balance;
}
.lp-h3 {
  font-size: clamp(1.1rem, 0.8vw + 0.8rem, 1.35rem);
  font-weight: 800;
  letter-spacing: -0.01em;
  margin: 0 0 10px;
}
.lp-lede {
  font-size: clamp(15px, 0.9vw + 0.45rem, 17px);
  line-height: 1.6;
  color: var(--landing-ink-2);
  margin: 0;
  max-width: 58ch;
}

/* Reveal on scroll */
.lp-reveal {
  opacity: 0;
  transform: translateY(18px);
  transition: opacity 0.65s cubic-bezier(0.22, 1, 0.36, 1), transform 0.65s cubic-bezier(0.22, 1, 0.36, 1);
}
.lp-reveal[data-in] {
  opacity: 1;
  transform: none;
}

/* ── Features (daylight) ──────────────────────────────────── */
.lp-features {
  background: linear-gradient(180deg, #f3f4e4 0%, var(--landing-paper) 14%, var(--landing-paper) 100%);
}
.lp-story {
  display: grid;
  grid-template-columns: minmax(0, 5fr) minmax(0, 6fr);
  align-items: center;
  gap: clamp(28px, 5vw, 80px);
  padding: clamp(28px, 4vw, 52px) 0;
}
.lp-story--flip .lp-story__text { order: 2; }
.lp-story--flip .lp-story__art { order: 1; }
.lp-story__text p {
  font-size: 15.5px;
  line-height: 1.65;
  color: var(--landing-ink-2);
  margin: 0;
  max-width: 46ch;
}
.lp-vignette {
  display: block;
  width: 100%;
  max-width: 460px;
  height: auto;
  margin: 0 auto;
  filter: drop-shadow(0 24px 40px -24px rgba(120, 100, 60, 0.35));
}
.lp-vignette text { font-family: 'Plus Jakarta Sans', sans-serif; }

/* ── Village (warm afternoon) ─────────────────────────────── */
.lp-village {
  background: linear-gradient(180deg, var(--landing-paper) 0%, #fdf2dd 100%);
}
.lp-dialogue { margin-bottom: clamp(40px, 5vw, 64px); }
.lp-dialogue__box {
  max-width: 560px;
  background: #fffdf7;
  border: 2px solid var(--landing-ink);
  border-radius: 6px;
  box-shadow: 4px 4px 0 rgba(36, 31, 26, 0.85);
  padding: 16px 20px 18px;
  position: relative;
}
.lp-dialogue__name {
  position: absolute;
  top: -13px; left: 16px;
  background: var(--landing-gold);
  color: var(--landing-ink);
  border: 2px solid var(--landing-ink);
  border-radius: 5px;
  font-size: 12px;
  font-weight: 800;
  letter-spacing: 0.02em;
  padding: 2px 10px;
}
.lp-dialogue__line {
  margin: 6px 0 0;
  font-family: 'DM Mono', ui-monospace, monospace;
  font-size: 14px;
  line-height: 1.65;
  color: var(--landing-ink);
}
.lp-crests-head { margin-bottom: 28px; }
.lp-crests-head p {
  margin: 0;
  color: var(--landing-ink-2);
  font-size: 15px;
  line-height: 1.6;
}
.lp-crests {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(110px, 1fr));
  gap: clamp(16px, 2.5vw, 28px);
}
.lp-crest {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
  text-align: center;
}
.lp-crest img {
  width: clamp(64px, 7vw, 84px);
  height: auto;
  transition: transform 0.3s cubic-bezier(0.22, 1, 0.36, 1);
}
.lp-crest:hover img { transform: translateY(-6px) rotate(-3deg); }
.lp-crest span {
  font-size: 12.5px;
  font-weight: 700;
  color: var(--landing-ink-2);
}

/* ── Accountability (golden hour) ─────────────────────────── */
.lp-account {
  background: linear-gradient(180deg, #fdf2dd 0%, #fbe8cd 100%);
}
.lp-account__rows {
  display: flex;
  flex-direction: column;
}
.lp-account__row {
  display: grid;
  grid-template-columns: 52px minmax(0, 1fr);
  gap: 20px;
  padding: clamp(22px, 3vw, 32px) 0;
  border-top: 1px solid rgba(160, 120, 60, 0.22);
}
.lp-account__row:last-child { border-bottom: 1px solid rgba(160, 120, 60, 0.22); }
.lp-account__row p {
  margin: 0;
  font-size: 15px;
  line-height: 1.65;
  color: var(--landing-ink-2);
  max-width: 56ch;
}
.lp-account__icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 46px; height: 46px;
  border-radius: 999px;
  background: rgba(253, 250, 243, 0.75);
  border: 1px solid rgba(160, 120, 60, 0.3);
  color: #8a5a24;
}
.lp-account__icon svg { width: 22px; height: 22px; }

/* ── Pricing (sunset) ─────────────────────────────────────── */
.lp-pricing {
  background: linear-gradient(180deg, #fbe8cd 0%, #f7dcc3 60%, #eed3c8 100%);
}
.lp-plans {
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(0, 1.08fr);
  gap: clamp(18px, 3vw, 32px);
  align-items: stretch;
  max-width: 860px;
}
.lp-plan {
  background: #fffdf7;
  border: 1px solid var(--landing-line);
  border-radius: 22px;
  padding: clamp(24px, 3vw, 36px);
  display: flex;
  flex-direction: column;
  box-shadow: 0 24px 48px -30px rgba(120, 80, 50, 0.4);
}
.lp-plan--plus {
  border: 2px solid var(--landing-gold);
  box-shadow: 0 28px 56px -30px rgba(150, 100, 40, 0.5);
}
.lp-plan__name {
  font-size: 15px;
  font-weight: 800;
  letter-spacing: 0.01em;
  margin: 0 0 6px;
}
.lp-plan__price {
  font-family: 'Bodoni Moda', serif;
  font-size: clamp(2.2rem, 2.6vw + 1rem, 3rem);
  font-weight: 600;
  margin: 0 0 18px;
}
.lp-plan__price span {
  font-family: 'Plus Jakarta Sans', sans-serif;
  font-size: 13.5px;
  font-weight: 600;
  color: var(--landing-ink-3);
  margin-left: 6px;
}
.lp-plan__list {
  list-style: none;
  margin: 0 0 26px;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 11px;
  flex: 1;
}
.lp-plan__list li {
  position: relative;
  padding-left: 26px;
  font-size: 14.5px;
  line-height: 1.5;
  color: var(--landing-ink-2);
}
.lp-plan__list li::before {
  content: '';
  position: absolute;
  left: 0; top: 4px;
  width: 14px; height: 14px;
  border-radius: 50%;
  background: #dcecc9;
  box-shadow: inset 0 0 0 1.5px #8bb26e;
}
.lp-pricing__note {
  margin: 26px 0 0;
  font-size: 13px;
  font-weight: 600;
  color: #7a5a36;
}

/* ── FAQ (dusk) ───────────────────────────────────────────── */
.lp-faq {
  background: linear-gradient(180deg, #eed3c8 0%, #d9c3d3 55%, #b7a4c9 100%);
}
.lp-faq__list {
  border-top: 1px solid rgba(70, 50, 90, 0.25);
}
.lp-faq__item {
  border-bottom: 1px solid rgba(70, 50, 90, 0.25);
}
.lp-faq__item summary {
  list-style: none;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 18px;
  padding: 20px 2px;
  font-size: clamp(15.5px, 1vw + 0.5rem, 18px);
  font-weight: 700;
  cursor: pointer;
  color: #2e2438;
}
.lp-faq__item summary::-webkit-details-marker { display: none; }
.lp-faq__glyph {
  flex: none;
  color: #5c4a72;
  transition: transform 0.25s cubic-bezier(0.22, 1, 0.36, 1);
}
.lp-faq__item[open] .lp-faq__glyph { transform: rotate(45deg); }
.lp-faq__item p {
  margin: 0;
  padding: 0 2px 22px;
  font-size: 15px;
  line-height: 1.65;
  color: #453852;
  max-width: 62ch;
}
.lp-faq .lp-h2 { color: #2e2438; }

/* ── Night ────────────────────────────────────────────────── */
.lp-night {
  position: relative;
  overflow: hidden;
  background: linear-gradient(180deg, #b7a4c9 0%, #6b5b93 22%, #363564 48%, #23244d 74%, #1a1b3a 100%);
  padding-top: clamp(90px, 12vw, 160px);
}
.lp-night__sky {
  position: absolute;
  inset: 0;
  pointer-events: none;
}
.lp-night__star {
  position: absolute;
  height: auto;
  opacity: 0.4;
  animation: lp-twinkle 6.5s ease-in-out infinite;
}
.lp-night__moon {
  position: absolute;
  right: clamp(24px, 8vw, 120px);
  top: clamp(40px, 8vw, 110px);
  width: clamp(44px, 5vw, 64px);
  opacity: 0.95;
  filter: drop-shadow(0 0 24px rgba(244, 233, 197, 0.35));
}
.lp-night__content {
  position: relative;
  z-index: 2;
  text-align: center;
  display: flex;
  flex-direction: column;
  align-items: center;
  padding-bottom: clamp(120px, 16vw, 220px);
}
.lp-night__title { color: #f6efdc; }
.lp-night__lede {
  color: #c3bcd8;
  margin: 0 auto clamp(26px, 3vw, 36px);
}
.lp-cta-row--night { animation: none; }
.lp-cta-row--night .lp-btn--primary {
  background: #f2c14e;
  color: #2b2620;
  box-shadow: 0 1px 0 rgba(0,0,0,0.2), 0 18px 40px -14px rgba(242, 193, 78, 0.45);
}
.lp-cta-row--night .lp-btn--primary:hover { background: #f7cd6b; }
.lp-night__village {
  position: relative;
  display: block;
  width: 100%;
  height: clamp(110px, 14vw, 200px);
  margin-top: -1px;
}

/* ── Footer ───────────────────────────────────────────────── */
.lp-footer {
  position: relative;
  z-index: 2;
  background: #14152e;
  border-top: 1px solid rgba(244, 233, 197, 0.12);
}
.lp-footer__inner {
  display: flex;
  align-items: center;
  gap: clamp(18px, 3vw, 36px);
  padding-top: 26px;
  padding-bottom: 30px;
  color: #a9a3c4;
}
.lp-footer__brand {
  font-family: 'Bodoni Moda', serif;
  font-weight: 700;
  font-size: 17px;
  color: #f6efdc;
}
.lp-footer__nav {
  display: flex;
  gap: clamp(14px, 2vw, 26px);
  font-size: 13px;
  font-weight: 600;
}
.lp-footer__nav a:hover { color: #f6efdc; }
.lp-footer__note {
  margin-left: auto;
  font-size: 12.5px;
}

@keyframes lp-up {
  from { opacity: 0; transform: translateY(14px); }
  to   { opacity: 1; transform: translateY(0); }
}

/* ── Responsive ───────────────────────────────────────────── */
@media (max-width: 900px) {
  .landing-header__nav { display: none; }
  .landing-header__right { margin-left: auto; }
  .lp-story,
  .lp-story--flip {
    grid-template-columns: 1fr;
    gap: 22px;
  }
  .lp-story--flip .lp-story__text { order: 1; }
  .lp-story--flip .lp-story__art { order: 2; }
  .lp-plans { grid-template-columns: 1fr; max-width: 520px; }
}
@media (max-width: 640px) {
  .landing-header { padding: 16px 18px; gap: 12px; }
  .landing-header__wordmark { font-size: 17px; }
  .lp-hero__content { padding-top: 108px; }
  .lp-btn { height: 48px; padding: 0 20px; }
  .sky__coin { --coin-scale: 0.72; transform: scale(0.72); }
  .lp-footer__inner { flex-wrap: wrap; }
  .lp-footer__note { margin-left: 0; flex-basis: 100%; }
}

@media (prefers-reduced-motion: reduce) {
  .lp-eyebrow, .lp-headline, .lp-hero-sub, .lp-cta-row, .lp-hero-note { animation: none; }
  .sky__cloud, .sky__cloud--drift, .sky__sparkle, .sky__coin, .lp-night__star { animation: none; }
  .sky__cloud--drift { display: none; }
  .lp-reveal { opacity: 1; transform: none; transition: none; }
  .lp-crest img { transition: none; }
  html:has(.landing-root) { scroll-behavior: auto; }
}
`
