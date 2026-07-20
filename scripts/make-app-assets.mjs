// Rasterize public/favicon.svg into the source images @capacitor/assets expects
// (assets/icon-only.png, assets/splash.png, assets/splash-dark.png), compositing
// the transparent bolt onto the site's dark page color. Run once, or again if the
// favicon changes; follow with `npx capacitor-assets generate --ios`.
import sharp from 'sharp'
import { mkdir } from 'node:fs/promises'

const PAGE = '#0b1014'
const SVG = 'public/favicon.svg'

await mkdir('assets', { recursive: true })

async function boltPng(size) {
  return sharp(SVG, { density: (72 * size) / 48 })
    .resize(size, size, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .png()
    .toBuffer()
}

async function compose(canvas, boltSize, out) {
  await sharp({
    create: { width: canvas, height: canvas, channels: 4, background: PAGE },
  })
    .composite([{ input: await boltPng(boltSize), gravity: 'centre' }])
    .png()
    .toFile(out)
  console.log('wrote', out)
}

await compose(1024, 640, 'assets/icon-only.png')
await compose(2732, 480, 'assets/splash.png')
await compose(2732, 480, 'assets/splash-dark.png')
