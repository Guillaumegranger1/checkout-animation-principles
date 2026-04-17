# Checkout Motion Principles

> Last updated: April 2026  
> Prototype: [checkout-motion.quick.shopify.io](https://checkout-motion.quick.shopify.io)

Motion in Checkout exists to support understanding, not decoration. Every animation is purposeful — supporting clarity, responsiveness, and trust without drawing attention to itself.

---

## Animation Tokens

These values are sourced from `checkout-web-ui` (`packages/checkout-web-ui/src/styles/theme/tokens/transition.ts`) and are the canonical reference for all motion work.

### Duration — Modular Scale (base 200ms, ratio 1.5×)

| Token | Value | Usage |
|-------|-------|-------|
| `transitionDuration.faster` | 88.9ms | Micro press states, instant feedback |
| `transitionDuration.fast` | 133.3ms | Toggle selections, hover transitions |
| `transitionDuration.base` | 200ms | Standard UI transitions |
| `transitionDuration.slow` | 300ms | Rollup collapse, spring releases |
| `transitionDuration.slower` | 450ms | Large surface entries |
| `transitionDuration.slowest` | 675ms | Full-screen transitions |
| `transitionDuration.reducedMotion` | 1ms | Prefers-reduced-motion override |

### Easing

| Token | Value | Usage |
|-------|-------|-------|
| `transitionTimingFunction.base` | `ease-in-out` | General UI transitions |
| `transitionTimingFunction.easeOut` | `cubic-bezier(0.30, 0.50, 0.50, 1.00)` | Rollups, toggles, all expand/collapse |

> **Spring easing** (sheets, microinteractions) is not a CSS token — it uses `linear()` generated from physical parameters: mass, stiffness, damping. See per-component specs below.

---

## Rollups

Rollups are a core part of the checkout experience, so their motion is practical, not expressive. Expansion uses an ease-out curve for a smooth, deliberate reveal; collapse uses a tighter ease-out for a quick, clean close. No bounce, no recoil, no caret rotation — every movement is purposeful.

### Values

| Property | Expand | Collapse |
|----------|--------|----------|
| Duration | 250ms | 150ms |
| Easing | `cubic-bezier(0.30, 0.50, 0.50, 1.00)` | `cubic-bezier(0.30, 0.50, 0.50, 1.00)` |
| Property animated | `height` (via `max-height` or clip) | `height` |

> Collapse is faster than expand. Opening feels deliberate; closing feels efficient.

### CSS

```css
/* Expand */
transition: height 250ms cubic-bezier(0.30, 0.50, 0.50, 1.00);

/* Collapse */
transition: height 150ms cubic-bezier(0.30, 0.50, 0.50, 1.00);
```

---

## Toggles (Ship / Pickup)

Toggles behave like real-world switches — quick, responsive, grounded in physical plausibility. The sliding highlight animates horizontally; content below cross-fades in sync with the toggle's end state.

### Values

| Property | Value |
|----------|-------|
| Duration | 150ms |
| Easing | `cubic-bezier(0.30, 0.50, 0.50, 1.00)` |
| Property animated | `left` (sliding highlight) + `opacity` (content crossfade) |

### CSS

```css
/* Sliding highlight */
transition: left 150ms cubic-bezier(0.30, 0.50, 0.50, 1.00);

/* Content crossfade */
transition: opacity 150ms cubic-bezier(0.30, 0.50, 0.50, 1.00);
```

---

## Sheets

For larger surface transitions, motion can afford a touch more realism. Entry uses a spring with subtle overshoot; exit is clean and swift to keep focus on what comes next.

### Values

| Property | Open | Close |
|----------|------|-------|
| Duration | ~350ms (derived from spring) | 220ms |
| Easing (open) | Spring: `mass 1, stiffness 302, damping 26` | — |
| Easing (close) | — | `cubic-bezier(0.30, 0.50, 0.50, 1.00)` |
| Property animated | `transform: translateY()` | `transform: translateY()` |

### Spring → CSS `linear()` (open)

```css
transition: transform 350ms linear(
  0, 0.098 4.3%, 0.261 8.7%, 0.435 13.0%, 0.595 17.4%,
  0.726 21.7%, 0.827 26.1%, 0.899 30.4%, 0.948 34.8%,
  0.980 39.1%, 0.998 43.5%, 1.008 47.8%, 1.011 52.2%,
  1.012 56.5%, 1.011 60.9%, 1.009 65.2%, 1.007 69.6%,
  1.005 73.9%, 1.003 78.3%, 1.002 82.6%, 1.001 87.0%,
  1.001 91.3%, 1.000 95.7%, 1
);
```

### CSS (close)

```css
transition: transform 220ms cubic-bezier(0.30, 0.50, 0.50, 1.00);
```

---

## Pay Now Transition

The "Pay now" transition marks a key emotional peak — the peak-end moment of the checkout journey. It should feel expressive and rewarding: immediate feedback that confirms the purchase, with a celebratory quality that builds trust and makes Shopify checkout recognizable.

### Values

| Stage | Duration | Easing | Notes |
|-------|----------|--------|-------|
| Button spinner | 350ms | arc loader rotation | Plays during processing |
| Checkmark draw (CSS stroke) | ~940ms total | see below | Circle 540ms + check 380ms |
| Thumbnail morph | 150ms | `cubic-bezier(0.51, 0.00, 0.72, 0.51)` | Checkmark → thumbnails |

### Checkmark Animation (CSS Stroke — recommended)

```css
/* Circle path: draws in, scales up, stroke tapers */
@keyframes cssDrawCircle {
  /* stroke-dashoffset 201 → 0, scale 0.3 → 1, strokeWidth tapers */
  /* duration: 540ms, easing: cubic-bezier(0.4, 0, 0.8, 0.6) */
}

/* Check path: draws in after circle completes */
@keyframes cssDrawCheck {
  /* stroke-dashoffset 76 → 0 */
  /* delay: 540ms, duration: 380ms, easing: cubic-bezier(0, 0, 0.1, 1) */
}
```

---

## Microinteractions

Microinteractions exist to deliver feedback — not to be noticed. Each press state, selection animation, and state transition should be fast, subtle, spring-based where appropriate, and purposeful. An animation that draws attention to itself has already failed its purpose.

> **For Checkout: press states should resolve in under 100ms; selection feedback in under 300ms; and spring physics — high stiffness, well-damped — should give interactions a grounded, physical quality without veering into playfulness.**
>
> The measure of a well-designed microinteraction is not whether users notice it, but whether they would notice its absence.

### Radio Button Indicator (inner dot)

| State | Property | Value |
|-------|----------|-------|
| Appear (on select) | `transform: scale(0→1)`, `opacity: 0→1` | 280ms `cubic-bezier(0.34, 1.56, 0.64, 1)` |
| Disappear (on deselect) | reverse transition | 280ms `cubic-bezier(0.34, 1.56, 0.64, 1)` |

```css
/* Inner dot — 9×9px, always in DOM, toggled via class */
.radio-indicator::after {
  transform: scale(0);
  opacity: 0;
  transition: transform 280ms cubic-bezier(0.34, 1.56, 0.64, 1),
              opacity 150ms ease;
}
.radio-indicator--selected::after {
  transform: scale(1);
  opacity: 1;
}
```

### Choice List Item (card press)

Uses a fixed-pixel shrink model: configured in pixels, converted to `scale()` relative to the element's actual rendered width so the visual offset is consistent regardless of layout width.

| State | Property | Value |
|-------|----------|-------|
| Press in | `transform: scale()` | 80ms `cubic-bezier(0.25, 0.46, 0.45, 0.94)` |
| Release | `transform: scale(1)` | 300ms `cubic-bezier(0.34, 1.2, 0.64, 1)` |
| Default offset | 4px | `scale = (elementWidth - 4) / elementWidth` |

```css
.choice-item {
  transition: transform 300ms cubic-bezier(0.34, 1.2, 0.64, 1);
}
.choice-item:active {
  /* scale computed as (elementWidth - Npx) / elementWidth */
  transform: scale(var(--press-scale));
  transition: transform 80ms cubic-bezier(0.25, 0.46, 0.45, 0.94);
}
```

### Hover (radio indicator border)

```css
.choice-item:not(.selected):hover .radio-indicator {
  border-color: rgba(0, 0, 0, 0.25);
  transition: border-color 150ms ease;
}
```

### Rollup Chevron (expand/collapse tap)

| State | Property | Value |
|-------|----------|-------|
| Press in | `transform: scale(0.75)` | 80ms `cubic-bezier(0.25, 0.46, 0.45, 0.94)` |
| Release | `transform: scale(1)` | 300ms `cubic-bezier(0.34, 1.2, 0.64, 1)` |

```css
.section-header .arrow-icon {
  transition: transform 300ms cubic-bezier(0.34, 1.2, 0.64, 1);
}
.section-header:active .arrow-icon {
  transform: scale(0.75);
  transition: transform 80ms cubic-bezier(0.25, 0.46, 0.45, 0.94);
}
```

### Checkbox

See [`checkout-checkbox` skill](.pi/skills/checkout-checkbox/SKILL.md) for the full component spec including all interaction states, source code, and design rationale.

| State | Property | Value |
|-------|----------|-------|
| Checkmark appear | `scale(0→1)`, `opacity(0→1)` | 280ms `cubic-bezier(0.34, 1.56, 0.64, 1)` |
| Box press in | `scale(0.88)` | 80ms `cubic-bezier(0.25, 0.46, 0.45, 0.94)` |
| Box release | `scale(1)` | 300ms `cubic-bezier(0.34, 1.2, 0.64, 1)` |
| Checkmark press (when checked) | `scale(0.85)` on wrapper | 80ms `cubic-bezier(0.25, 0.46, 0.45, 0.94)` |
| Hover border | `rgba(0,0,0,0.25)` | 150ms `ease` |

---

## Spring Easing Reference

Spring physics are used for interactions that benefit from physical realism (sheets, indicator dots). Generate `linear()` from these parameters using the physical simulation in `RollupsDemo.tsx → generateSpringLinearPhysical()`.

| Use case | Mass | Stiffness | Damping | Approx. duration |
|----------|------|-----------|---------|-----------------|
| Sheet open | 1 | 302 | 26 | ~350ms |
| Radio/checkbox dot | — | — | — | 280ms `cubic-bezier(0.34, 1.56, 0.64, 1)` |
| Press release (cards) | — | — | — | 300ms `cubic-bezier(0.34, 1.2, 0.64, 1)` |

> `cubic-bezier(0.34, 1.56, 0.64, 1)` is the CSS approximation of a high-stiffness spring (stiffness ≈500, damping ≈30). It produces a ~7% overshoot and settles in ~280ms.

---

## Token Alignment Note

The demo's `tokens.css` includes convenience tokens for the prototype UI chrome. These do **not** replace or duplicate the production token system — they are demo-only. The animation values used in each demo (hardcoded in component state) match production `checkout-web-ui` values exactly.

| Demo token | Demo value | Production equivalent |
|------------|------------|-----------------------|
| `--ease-out` | `cubic-bezier(0.30, 0.50, 0.50, 1.00)` | `transitionTimingFunction.easeOut` ✅ |
| `--dur-fast` (demo UI only) | 150ms | closest: `transitionDuration.fast` (133.3ms) |
| `--dur-med` (demo UI only) | 220ms | closest: `transitionDuration.base` (200ms) |
| `--dur-slow` (demo UI only) | 320ms | closest: `transitionDuration.slow` (300ms) |
