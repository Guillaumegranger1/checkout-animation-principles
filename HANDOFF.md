# Handoff Notes – Spinner + Pay now tweaks

## What changed
- Pay now settings panel (top to bottom):
  - “Reduce motion” first, then a divider
  - Spinner row with a chip‑styled dropdown (`select-chip`) and a right‑aligned white link (`preview-link`, text: “preview →”)
  - “Spinner speed” slider, then a divider
- Only one “Spinner speed” remains in Pay now (duplicate removed).
- Spinner variants used in the Pay button are controlled by the Pay now dropdown.
- Spinner speeds are independent:
  - Spinner page uses `spinnerMs` (scoped to Spinner containers)
  - Pay now uses `spinnerMsPay` (applied inline on the Pay button via `--spinner-ms`)

## Key files
- `src/components/SettingsPanel.tsx`
  - Pay now panel: chip dropdown + “preview →” link + single “Spinner speed”
  - Classes used:
    - Dropdown: `select-chip`
    - Link: `preview-link` (white, right‑aligned)
- `src/pages/RollupsDemo.tsx`
  - State separation: `spinnerMs` (Spinner) vs `spinnerMsPay` (Pay now)
  - Pay button spinner variant/speed wired via props
- `src/components/OrderSummaryGuest.tsx`
  - Applies `--spinner-ms` inline on the Pay button using `spinnerMs` prop
- `src/styles/global.css`
  - `.select-chip` (chip look, arrow kept on hover/active, vertical align nudged)
  - `.preview-link` forced white

## How to run (fresh)
```bash
rm -rf dist node_modules/.vite
npm run dev
# open: http://localhost:5173/?v=7
```

For preview (production build):
```bash
rm -rf dist node_modules/.vite
npm run build && npm run preview
# open printed URL, e.g. http://localhost:4173/?v=7
```

## Cache bust / verify
1) Open DevTools → Network → check “Disable cache” → hard‑reload (Cmd+Shift+R).
2) Add a query string to the URL (e.g., `?v=7`).

## Quick QA checklist
- Pay now panel layout:
  - Reduce motion → divider → Spinner row (dropdown + “preview →”) → Spinner speed → divider
- Dropdown has class `select-chip`; arrow remains on hover; label is vertically centered.
- “preview →” has class `preview-link`, appears white, and clicking navigates to the Spinner page.
- Only one “Spinner speed” slider exists in Pay now.
- Spinner speeds are independent:
  - Change Spinner page speed → only Spinner demo changes
  - Change Pay now speed → only Pay button spinner changes

## Known considerations
- If UI doesn’t reflect the latest styles, it’s almost always cached assets. Use the cache‑busting steps above.

## Next ideas (optional)
- If desired, mirror chip button hover/active shadows exactly on `.select-chip` for pixel parity with other chips.*** End Patch```} ***!
"</analysis to=functions.apply_patch code>"/>
  }}}  ```

