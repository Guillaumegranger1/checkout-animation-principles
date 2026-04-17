---
name: checkout-checkbox
description: Implements the Checkout-style animated checkbox component with hover, press, and selection microinteractions. Use when building a checkbox that matches Shopify Checkout's interaction design: 18px square box, fixed-border style (no fill change on selection), spring-animated checkmark, press scale feedback, and hover border darkening.
---

# Checkout Checkbox Component

A fully interactive checkbox following Shopify Checkout's microinteraction principles: feedback is functional and never draws attention to itself. The box never changes color or border when checked — only the checkmark appears. All motion is fast, spring-based, and purposeful.

---

## Visual Spec

| Property | Value |
|----------|-------|
| Box size | 18×18px |
| Border radius | 5px |
| Border (all states) | `1px solid var(--color-border, #eee)` |
| Background (all states) | `var(--color-bg, #fff)` |
| Checkmark size | 10×9px SVG, `strokeWidth: 1.75` |
| Checkmark color | `var(--color-text, #000)` |
| Label font | 14px / regular weight / `var(--color-text)` |
| Gap (box → label) | 10px |

> The box **does not change background or border color** when checked. Only the checkmark icon appears.

---

## Interaction States

### 1. Unselected (default)
- Box: `1px solid var(--color-border, #eee)`, white background
- No checkmark

### 2. Hover (unselected only)
- Box border darkens: `rgba(0, 0, 0, 0.25)`
- Transition: `border-color 150ms ease`
- Dark mode: `rgba(255, 255, 255, 0.35)`

### 3. Press (box only — label stays still)
- Box scales to `scale(0.88)` in `80ms cubic-bezier(0.25, 0.46, 0.45, 0.94)`
- On release: springs back to `scale(1)` in `300ms cubic-bezier(0.34, 1.2, 0.64, 1)`
- **Important:** scale is applied to `.cb-box` only, not the root element. The label never moves.

### 4. Selected — checkmark appears
- A `<span class="cb-check-wrap">` mounts wrapping the SVG
- The SVG plays `@keyframes cb-check-in`: `scale(0) opacity(0)` → `scale(1) opacity(1)`
- Easing: `cubic-bezier(0.34, 1.56, 0.64, 1)` (spring with overshoot), duration `280ms`

### 5. Press while selected — checkmark shrinks
- `.cb-check-wrap` scales to `scale(0.85)` in `80ms cubic-bezier(0.25, 0.46, 0.45, 0.94)`
- On release: springs back in `300ms cubic-bezier(0.34, 1.56, 0.64, 1)`
- **Why a wrapper:** the SVG has `animation-fill-mode: both` which locks its `transform`. Applying press scale to a parent wrapper avoids the CSS animation/transition conflict.

---

## Animation Reference

| Animation | Duration | Easing | Property |
|-----------|----------|--------|----------|
| Checkmark appear | 280ms | `cubic-bezier(0.34, 1.56, 0.64, 1)` | `transform: scale`, `opacity` |
| Press in (box) | 80ms | `cubic-bezier(0.25, 0.46, 0.45, 0.94)` | `transform: scale(0.88)` |
| Press release (box) | 300ms | `cubic-bezier(0.34, 1.2, 0.64, 1)` | `transform: scale(1)` |
| Press in (checkmark wrap) | 80ms | `cubic-bezier(0.25, 0.46, 0.45, 0.94)` | `transform: scale(0.85)` |
| Press release (checkmark wrap) | 300ms | `cubic-bezier(0.34, 1.56, 0.64, 1)` | `transform: scale(1)` |
| Hover border | 150ms | `ease` | `border-color` |

---

## React Component (TypeScript)

```tsx
import { useState } from 'react'

type CheckboxProps = {
  label: string
  defaultChecked?: boolean
  onChange?: (checked: boolean) => void
}

export function Checkbox({ label, defaultChecked = false, onChange }: CheckboxProps) {
  const [checked, setChecked] = useState(defaultChecked)

  function toggle() {
    const next = !checked
    setChecked(next)
    onChange?.(next)
  }

  return (
    <div
      className={`cb-root${checked ? ' cb-root--checked' : ''}`}
      role="checkbox"
      aria-checked={checked}
      tabIndex={0}
      onClick={toggle}
      onKeyDown={(e) => {
        if (e.key === ' ' || e.key === 'Enter') {
          e.preventDefault()
          toggle()
        }
      }}
    >
      {/* 18×18 square box — press scale target */}
      <div className="cb-box" aria-hidden>
        {checked && (
          <span className="cb-check-wrap">
            <svg
              className="cb-check"
              viewBox="0 0 12 10"
              fill="none"
              aria-hidden
            >
              <path
                d="M1.5 5L4.5 8L10.5 1.5"
                stroke="currentColor"
                strokeWidth="1.75"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </span>
        )}
      </div>

      <span className="cb-label">{label}</span>
    </div>
  )
}
```

---

## CSS

```css
/* Root row — no transform here so the label stays still on press */
.cb-root {
  display: flex;
  align-items: center;
  gap: 10px;
  cursor: pointer;
  user-select: none;
  width: 100%;
  outline: none;
}

.cb-root:focus-visible .cb-box {
  outline: 2px solid var(--color-accent, #5a31f4);
  outline-offset: 2px;
}

/* 18×18 box — receives press scale */
.cb-box {
  position: relative;
  width: 18px;
  height: 18px;
  border-radius: 5px;
  border: 1px solid var(--color-border, #eee);
  background: var(--color-bg, #fff);
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  /* Spring-like release */
  transition: transform 300ms cubic-bezier(0.34, 1.2, 0.64, 1),
              border-color 150ms ease;
}

/* Hover: darken border (unselected only) */
.cb-root:hover .cb-box {
  border-color: rgba(0, 0, 0, 0.25);
}

/* Press: fast scale-down on box */
.cb-root:active .cb-box {
  transform: scale(0.88);
  transition: transform 80ms cubic-bezier(0.25, 0.46, 0.45, 0.94);
}

/* Checkmark wrapper — receives press scale when checked */
.cb-check-wrap {
  display: flex;
  align-items: center;
  justify-content: center;
  /* Spring-back on release */
  transition: transform 300ms cubic-bezier(0.34, 1.56, 0.64, 1);
}

/* Press on checked state: shrink the checkmark */
.cb-root--checked:active .cb-check-wrap {
  transform: scale(0.85);
  transition: transform 80ms cubic-bezier(0.25, 0.46, 0.45, 0.94);
}

/* Checkmark SVG — spring-animated in on mount */
.cb-check {
  width: 10px;
  height: 9px;
  color: var(--color-text, #000);
  animation: cb-check-in 280ms cubic-bezier(0.34, 1.56, 0.64, 1) both;
  /* Spring-back on release (does not conflict — different element from wrapper) */
  transition: transform 300ms cubic-bezier(0.34, 1.56, 0.64, 1);
}

@keyframes cb-check-in {
  from { transform: scale(0); opacity: 0; }
  to   { transform: scale(1); opacity: 1; }
}

/* Label */
.cb-label {
  font-size: 14px;
  font-weight: 400;
  color: var(--color-text, #000);
  line-height: 20px;
}

/* Dark mode */
.dark-mode .cb-box {
  border-color: rgba(255, 255, 255, 0.12);
  background: #1c1c1c;
}

.dark-mode .cb-root:hover .cb-box {
  border-color: rgba(255, 255, 255, 0.35);
}

.dark-mode .cb-check {
  color: #fff;
}
```

---

## CSS Custom Properties

| Token | Default | Usage |
|-------|---------|-------|
| `--color-border` | `#eee` | Box border (all states) |
| `--color-bg` | `#fff` | Box background (all states) |
| `--color-text` | `#000` | Checkmark stroke, label color |
| `--color-accent` | `#5a31f4` | Focus ring |

---

## Key Design Decisions

1. **No fill change on check** — the box stays white. Only the checkmark icon appears. This keeps the interaction subtle and avoids the visual weight of a color-filled box.

2. **Press scale on box only** — `transform` is applied to `.cb-box`, not `.cb-root`. The label never moves, which avoids a jarring shift on tap.

3. **Wrapper element for press-while-checked** — The `<span class="cb-check-wrap">` exists solely to carry the press `transform` on checked state. The SVG itself has `animation-fill-mode: both` which holds a CSS animation transform and would block a `transition` on the same element. The wrapper is a separate element, so there is no conflict.

4. **Spring cubic-bezier** — `cubic-bezier(0.34, 1.56, 0.64, 1)` gives a slight overshoot (the checkmark scales past 1.0 briefly). This mimics spring physics without requiring a JS animation library.

5. **Hover only on unselected** — hover border darkening is applied to `.cb-root:hover .cb-box` without a `:not(.cb-root--checked)` guard because the visual effect is neutral when checked (the box border is already de-emphasised by the presence of the checkmark).

---

## Principle

> Microinteractions exist to deliver feedback — not to be noticed. Press states should resolve in under 100ms; selection feedback in under 300ms. The measure of a well-designed microinteraction is not whether users notice it, but whether they would notice its absence.
