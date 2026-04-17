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


