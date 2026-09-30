const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

function crc32(buf) {
  let c = 0xffffffff;
  for (let i = 0; i < buf.length; i++) {
    c = (c >>> 8) ^ table[(c ^ buf[i]) & 0xff];
  }
  return (c ^ 0xffffffff) >>> 0;
}

const table = new Uint32Array(256);
for (let n = 0; n < 256; n++) {
  let c = n;
  for (let k = 0; k < 8; k++) {
    c = (c & 1) ? (0xedb88320 ^ (c >>> 1)) : (c >>> 1);
  }
  table[n] = c;
}

function makeChunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length, 0);
  const typeBuf = Buffer.from(type, 'binary');
  const body = Buffer.concat([typeBuf, data]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(body), 0);
  return Buffer.concat([len, body, crc]);
}

function createPngIcon(size, filename) {
  const width = size;
  const height = size;
  const scanlines = [];

  const bgColor = [37, 17, 247, 255]; // Royal Blue #2511F7
  const yellowColor = [255, 230, 0, 255]; // Electric Yellow #FFE600
  const darkBlueColor = [10, 4, 61, 255]; // Dark Navy #0A043D

  const radius = Math.floor(size * 0.2);

  for (let y = 0; y < height; y++) {
    const line = [0]; // Filter byte 0 (None)
    for (let x = 0; x < width; x++) {
      // Rounded corner mask
      let inCorner = false;
      if (x < radius && y < radius && Math.hypot(x - radius, y - radius) > radius) inCorner = true;
      if (x > width - radius && y < radius && Math.hypot(x - (width - radius), y - radius) > radius) inCorner = true;
      if (x < radius && y > height - radius && Math.hypot(x - radius, y - (height - radius)) > radius) inCorner = true;
      if (x > width - radius && y > height - radius && Math.hypot(x - (width - radius), y - (height - radius)) > radius) inCorner = true;

      if (inCorner) {
        line.push(0, 0, 0, 0); // Transparent outside rounded corner
        continue;
      }

      // Draw center icon emblem
      const centerX = width / 2;
      const centerY = height / 2;
      const boxSize = size * 0.35;

      const inCenterBox = Math.abs(x - centerX) < boxSize && Math.abs(y - centerY) < boxSize;

      // Draw letter "NM" inside yellow emblem box
      if (inCenterBox) {
        // Simple pixel art / geometric pattern for "NM" inside box
        const normX = (x - (centerX - boxSize)) / (boxSize * 2);
        const normY = (y - (centerY - boxSize)) / (boxSize * 2);

        // N left stem, diagonal, right stem
        const isN = (normX >= 0.15 && normX <= 0.28) ||
                    (normX >= 0.45 && normX <= 0.58) ||
                    (normX >= 0.28 && normX <= 0.45 && Math.abs(normY - ((normX - 0.28) / 0.17)) < 0.15);

        // M left stem, diagonal 1, diagonal 2, right stem
        const isM = (normX >= 0.65 && normX <= 0.73) ||
                    (normX >= 0.87 && normX <= 0.95) ||
                    (normX >= 0.73 && normX <= 0.81 && normY <= 0.6 && Math.abs(normY - ((normX - 0.73) / 0.08 * 0.6)) < 0.2) ||
                    (normX >= 0.81 && normX <= 0.87 && normY <= 0.6 && Math.abs(normY - ((0.87 - normX) / 0.06 * 0.6)) < 0.2);

        if (isN || isM) {
          line.push(...darkBlueColor);
        } else {
          line.push(...yellowColor);
        }
      } else {
        line.push(...bgColor);
      }
    }
    scanlines.push(Buffer.from(line));
  }

  const rawData = Buffer.concat(scanlines);
  const compressedData = zlib.deflateSync(rawData);

  const header = Buffer.alloc(13);
  header.writeUInt32BE(width, 0);
  header.writeUInt32BE(height, 4);
  header[8] = 8;  // bit depth
  header[9] = 6;  // RGBA
  header[10] = 0; // compression
  header[11] = 0; // filter
  header[12] = 0; // interlace

  const pngSignature = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
  const ihdrChunk = makeChunk('IHDR', header);
  const idatChunk = makeChunk('IDAT', compressedData);
  const iendChunk = makeChunk('IEND', Buffer.alloc(0));

  const pngBuffer = Buffer.concat([pngSignature, ihdrChunk, idatChunk, iendChunk]);
  fs.writeFileSync(filename, pngBuffer);
  console.log(`Generated ${filename} (${size}x${size}, ${pngBuffer.length} bytes)`);
}

const publicDir = path.join(__dirname, '..', 'public');
createPngIcon(192, path.join(publicDir, 'icon-192.png'));
createPngIcon(512, path.join(publicDir, 'icon-512.png'));
createPngIcon(180, path.join(publicDir, 'apple-touch-icon.png'));
