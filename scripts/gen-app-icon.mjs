// Phase 0 辅助脚本：生成 tauri icon 所需的占位源图（512x512 纯色 RGBA PNG）。
// 用途：Windows 下 tauri-build 必须生成窗口资源（icons/icon.ico）。
// 不是业务代码；正式图标由设计阶段提供后重新执行 pnpm tauri icon 覆盖。
import { deflateSync } from 'node:zlib'
import { writeFileSync } from 'node:fs'

const SIZE = 512
const COLOR = [0x28, 0x96, 0xff, 0xff] // ClassNest 基准蓝

const table = new Uint32Array(256)
for (let n = 0; n < 256; n++) {
  let c = n
  for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1
  table[n] = c >>> 0
}
function crc32(buf) {
  let c = 0xffffffff
  for (let i = 0; i < buf.length; i++) c = table[(c ^ buf[i]) & 0xff] ^ (c >>> 8)
  return (c ^ 0xffffffff) >>> 0
}
function chunk(type, data) {
  const len = Buffer.alloc(4)
  len.writeUInt32BE(data.length)
  const typeBuf = Buffer.from(type, 'ascii')
  const crc = Buffer.alloc(4)
  crc.writeUInt32BE(crc32(Buffer.concat([typeBuf, data])))
  return Buffer.concat([len, typeBuf, data, crc])
}

const raw = Buffer.alloc(SIZE * (SIZE * 4 + 1))
for (let y = 0; y < SIZE; y++) {
  const rowStart = y * (SIZE * 4 + 1)
  raw[rowStart] = 0
  for (let x = 0; x < SIZE; x++) {
    const o = rowStart + 1 + x * 4
    raw[o] = COLOR[0]
    raw[o + 1] = COLOR[1]
    raw[o + 2] = COLOR[2]
    raw[o + 3] = COLOR[3]
  }
}

const ihdr = Buffer.alloc(13)
ihdr.writeUInt32BE(SIZE, 0)
ihdr.writeUInt32BE(SIZE, 4)
ihdr[8] = 8 // bit depth
ihdr[9] = 6 // RGBA
ihdr[10] = 0
ihdr[11] = 0
ihdr[12] = 0

const png = Buffer.concat([
  Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
  chunk('IHDR', ihdr),
  chunk('IDAT', deflateSync(raw, { level: 9 })),
  chunk('IEND', Buffer.alloc(0)),
])
writeFileSync('src-tauri/app-icon.png', png)
console.log('src-tauri/app-icon.png generated')
