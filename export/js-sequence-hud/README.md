# SVG Sequence (JS) — with Dev HUD

This variant includes a small Dev HUD that listens to `seq-status` events from the player and displays FPS, frame time, frames loaded/total, payload size, and playback state.

Run locally
```
npm i
npm run dev
```

Files
- `src/components/SvgSequencePlayer.tsx` — player
- `src/components/DevHud.tsx` — HUD
- `src/styles/sequence.css` — styles
- `src/assets/svg-sequence/*.svg` — frames (copied in)

# SVG Sequence (JS) - Portable Demo

This is a self‑contained demo of the JavaScript‑driven SVG sequence player used in the “Pay now transition”.

What’s included
- React component: `src/components/SvgSequencePlayer.tsx`
- Minimal styles: `src/styles/sequence.css`
- Demo app: `src/App.tsx`, `src/main.tsx`, `index.html`
- Vite + TypeScript config
- Place your frames under: `src/assets/svg-sequence/*.svg` (already copied from the project)

Run locally
```
npm i
npm run dev
```

Build
```
npm run build
npm run preview
```

Component usage
```tsx
<SvgSequencePlayer fps={60} size={111} padding={18} loop={false} restartKey={key} />
```

Notes
- The component preloads all frames first to avoid first‑run stutter.
- It dispatches `seq-status` CustomEvents you can subscribe to for live HUDs/metrics.
- Frames are sorted numerically by file name via `import.meta.glob`.


