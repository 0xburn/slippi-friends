import { writeFileSync, mkdirSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const assetsDir = resolve(__dirname, '../apps/agent/assets');
mkdirSync(assetsDir, { recursive: true });

function createPNG(r, g, b) {
  const size = 22;
  const margin = 5;
  const raw = [];

  for (let y = 0; y < size; y++) {
    raw.push(0); // filter byte
    for (let x = 0; x < size; x++) {
      const cx = size / 2, cy = size / 2, radius = (size / 2) - margin;
      const dist = Math.sqrt((x - cx) ** 2 + (y - cy) ** 2);
      if (dist <= radius) {
        raw.push(r, g, b, 255);
      } else if (dist <= radius + 1) {
        const alpha = Math.max(0, Math.round(255 * (1 - (dist - radius))));
        raw.push(r, g, b, alpha);
      } else {
        raw.push(0, 0, 0, 0);
      }
    }
  }

  const rawBuf = Buffer.from(raw);
  const deflate = zlib_deflate(rawBuf);

  const png = Buffer.concat([
    Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]),
    makeChunk('IHDR', bufIHDR(size, size)),
    makeChunk('IDAT', deflate),
    makeChunk('IEND', Buffer.alloc(0)),
  ]);
  return png;
}

function bufIHDR(w, h) {
  const b = Buffer.alloc(13);
  b.writeUInt32BE(w, 0);
  b.writeUInt32BE(h, 4);
  b[8] = 8; // bit depth
  b[9] = 6; // RGBA
  b[10] = 0; b[11] = 0; b[12] = 0;
  return b;
}

function makeChunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length);
  const t = Buffer.from(type, 'ascii');
  const crcData = Buffer.concat([t, data]);
  const crc = crc32(crcData);
  const crcBuf = Buffer.alloc(4);
  crcBuf.writeUInt32BE(crc >>> 0);
  return Buffer.concat([len, t, data, crcBuf]);
}

function crc32(buf) {
  let crc = 0xffffffff;
  for (let i = 0; i < buf.length; i++) {
    crc ^= buf[i];
    for (let j = 0; j < 8; j++) {
      crc = (crc >>> 1) ^ (crc & 1 ? 0xedb88320 : 0);
    }
  }
  return (crc ^ 0xffffffff) >>> 0;
}

import { deflateSync } from 'zlib';

function zlib_deflate(data) {
  return deflateSync(data);
}

const icons = {
  'tray-online.png': [33, 186, 69],    // green
  'tray-ingame.png': [250, 204, 21],   // yellow
  'tray-offline.png': [107, 114, 128], // grey
  'icon.png': [33, 186, 69],           // green (app icon)
};

for (const [name, [r, g, b]] of Object.entries(icons)) {
  const png = createPNG(r, g, b);
  writeFileSync(resolve(assetsDir, name), png);
  console.log(`Created ${name}`);
}

console.log('Done!');
