# Git & GitHub

## Repository

- **Remote:** https://github.com/Guillaumegranger1/checkout-animation-principles
- **Owner:** Guillaume Granger (guillaume.granger@shopify.com)
- **Working branch:** `guillaume/main-work`

## Rules — read these before touching git

1. **Never merge into `master`**, unless Guillaume explicitly asks you to.
2. **Always work on `guillaume/main-work`**. If you need to create another branch for any reason, confirm with Guillaume first.
3. **Never push automatically.** Always ask Guillaume before running `git push`. He decides when his work is ready to be saved to GitHub.
4. **Commits are fine to create locally** when changes are meaningful — but don't push them without being asked.
5. **Never use `--force` or `git push --force`** on any branch. This rewrites history and can destroy work.
6. **API secrets and tokens must never be hardcoded** in source files. Use `import.meta.env.VITE_*` environment variables for Vite source files. For plain HTML files, use `window.MAPBOX_TOKEN` (injected separately). Document what the caller needs to set.

## Environment variables required locally

Create a `.env` file at the project root (it's gitignored) with:

```
VITE_MAPBOX_TOKEN=pk.ey...   # your Mapbox token
```

## How to commit and push (when asked)

```sh
git add -A
git commit -m "short description of what changed"
git push
```

`git push` alone works because the branch tracking is already set up.

## Quick (internal hosting)

This project is also deployed to Quick at:
**https://checkout-motion.quick.shopify.io/**

To build and deploy:
```sh
pnpm build           # or npm run build
quick deploy dist checkout-motion
```

Only deploy the `dist/` output folder — never the source files.
