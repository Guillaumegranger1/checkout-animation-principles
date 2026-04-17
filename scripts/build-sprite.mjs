#!/usr/bin/env node
/**
 * Build a horizontal sprite sheet (as an SVG) from individual SVG frames.
 * - Reads all *.svg from src/assets/svg-sequence (sorted by filename)
 * - Embeds each frame as a data: URL <image> at x offsets
 * - Writes public/images/check-sprite.svg
 */
import { readdirSync, readFileSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'

const SRC_DIR = join(process.cwd(), 'src', 'assets', 'svg-sequence')
const OUT_PATH = join(process.cwd(), 'public', 'images', 'check-sprite.svg')

function getFrames(dir) {
  const files = readdirSync(dir).filter(f => f.toLowerCase().endsWith('.svg')).sort((a,b)=>a.localeCompare(b, undefined, { numeric:true }))
  return files.map(f => ({ name: f, path: join(dir, f), content: readFileSync(join(dir, f), 'utf8') }))
}

function detectViewBox(svg) {
  const vb = svg.match(/viewBox=["']\s*([0-9.\-]+)\s+([0-9.\-]+)\s+([0-9.\-]+)\s+([0-9.\-]+)\s*["']/i)
  if (vb) {
    const minX = parseFloat(vb[1]); const minY = parseFloat(vb[2])
    const w = parseFloat(vb[3]); const h = parseFloat(vb[4])
    return { minX, minY, w: Math.round(w), h: Math.round(h) }
  }
  const w = svg.match(/width=["']\s*([0-9.]+)\s*(px)?\s*["']/i)
  const h = svg.match(/height=["']\s*([0-9.]+)\s*(px)?\s*["']/i)
  if (w && h) return { minX: 0, minY: 0, w: Math.round(parseFloat(w[1])), h: Math.round(parseFloat(h[1])) }
  // Fallback to 75x75
  return { minX: 0, minY: 0, w: 75, h: 75 }
}

function extractInner(svg) {
  const inner = svg.replace(/^[\s\S]*?<svg[^>]*>/i, '').replace(/<\/svg>\s*$/i, '')
  return inner
}

const frames = getFrames(SRC_DIR)
if (!frames.length) {
  console.error(`No SVG frames found in ${SRC_DIR}. Nothing to do.`)
  process.exit(0)
}
// Compute a uniform tile size (target 75x75) to center-align all frames and match CSS frameSize
const TILE = 75
const GUTTER = 2 // transparent spacing between frames to prevent sampling bleed during scaling
const dims = frames.map(f => ({ ...detectViewBox(f.content), inner: extractInner(f.content) }))
// Build a union coordinate system across all frames
const unionMinX = Math.min(...dims.map(d => d.minX))
const unionMinY = Math.min(...dims.map(d => d.minY))
const unionMaxX = Math.max(...dims.map(d => d.minX + d.w))
const unionMaxY = Math.max(...dims.map(d => d.minY + d.h))
const unionW = unionMaxX - unionMinX
const unionH = unionMaxY - unionMinY
const scale = Math.min(TILE / unionW, TILE / unionH)
const padX = (TILE - unionW * scale) / 2
const padY = (TILE - unionH * scale) / 2
const totalW = TILE
const totalH = TILE * frames.length + GUTTER * (frames.length - 1)

let images = ''
for (let i = 0; i < frames.length; i++) {
  const d = dims[i]
  const y = i * (TILE + GUTTER)
  // Map each frame into the union coordinate system, then scale+center into the TILE (vertical layout).
  images += `<svg x="0" y="${y}" width="${TILE}" height="${TILE}" viewBox="0 0 ${TILE} ${TILE}" preserveAspectRatio="xMidYMid meet"><g transform="translate(${padX},${padY}) scale(${scale}) translate(${-unionMinX},${-unionMinY})">${d.inner}</g></svg>`
}

const outSvg =
`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${totalW} ${totalH}" width="${totalW}" height="${totalH}" preserveAspectRatio="xMinYMin meet">
  ${images}
</svg>`

writeFileSync(OUT_PATH, outSvg, 'utf8')
console.log(`Wrote sprite: ${OUT_PATH}  (vertical, ${frames.length} frames, ${TILE}x${TILE} each, gutter ${GUTTER}px)`)


