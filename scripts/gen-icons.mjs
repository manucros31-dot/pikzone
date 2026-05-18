// Génère icon-192.png et icon-512.png depuis icon.svg via @resvg/resvg-js
import { Resvg } from '@resvg/resvg-js'
import { readFileSync, writeFileSync, mkdirSync } from 'fs'

const svg = readFileSync('public/icons/icon.svg', 'utf8')
mkdirSync('public/icons', { recursive: true })

for (const size of [192, 512]) {
  const resvg = new Resvg(svg, {
    fitTo: { mode: 'width', value: size },
    font: { loadSystemFonts: false },
  })
  const png = resvg.render().asPng()
  writeFileSync(`public/icons/icon-${size}.png`, png)
  console.log(`✅ public/icons/icon-${size}.png (${png.length} bytes)`)
}
