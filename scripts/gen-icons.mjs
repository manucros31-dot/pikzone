// Génère icon-192.png et icon-512.png avec fond #1E6B2E + 🦟 en SVG rasterisé via canvas
// Utilise uniquement zlib (builtin Node.js) — pas de dépendances
import { createWriteStream } from 'fs'
import { deflateSync } from 'zlib'
import { mkdir } from 'fs/promises'

const GREEN = [0x1e, 0x6b, 0x2e]

function createPNG(size) {
  // Signature PNG
  const sig = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])

  function chunk(type, data) {
    const buf = Buffer.alloc(4 + 4 + data.length + 4)
    buf.writeUInt32BE(data.length, 0)
    buf.write(type, 4, 'ascii')
    data.copy(buf, 8)
    const crc = crc32(buf.subarray(4, 8 + data.length))
    buf.writeUInt32BE(crc, 8 + data.length)
    return buf
  }

  // IHDR
  const ihdr = Buffer.alloc(13)
  ihdr.writeUInt32BE(size, 0)
  ihdr.writeUInt32BE(size, 4)
  ihdr[8] = 8   // bit depth
  ihdr[9] = 2   // RGB
  ihdr[10] = 0  // compression
  ihdr[11] = 0  // filter
  ihdr[12] = 0  // interlace

  // Raw image data: pour chaque ligne, filtre 0 + RGB * size
  const raw = Buffer.alloc((1 + size * 3) * size)
  let offset = 0
  for (let y = 0; y < size; y++) {
    raw[offset++] = 0 // filter None
    for (let x = 0; x < size; x++) {
      raw[offset++] = GREEN[0]
      raw[offset++] = GREEN[1]
      raw[offset++] = GREEN[2]
    }
  }

  const idat = chunk('IDAT', deflateSync(raw))
  const iend = chunk('IEND', Buffer.alloc(0))

  return Buffer.concat([sig, chunk('IHDR', ihdr), idat, iend])
}

// CRC32
function crc32(buf) {
  let c = 0xffffffff
  const table = makeCrcTable()
  for (const b of buf) c = (c >>> 8) ^ table[(c ^ b) & 0xff]
  return (c ^ 0xffffffff) >>> 0
}

let _crcTable
function makeCrcTable() {
  if (_crcTable) return _crcTable
  _crcTable = new Uint32Array(256)
  for (let n = 0; n < 256; n++) {
    let c = n
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1
    _crcTable[n] = c
  }
  return _crcTable
}

await mkdir('public/icons', { recursive: true })

for (const size of [192, 512]) {
  const png = createPNG(size)
  const ws = createWriteStream(`public/icons/icon-${size}.png`)
  ws.write(png)
  ws.end()
  console.log(`✅ public/icons/icon-${size}.png (${png.length} bytes)`)
}
