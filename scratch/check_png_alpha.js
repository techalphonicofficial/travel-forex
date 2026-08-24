const fs = require('fs');
const zlib = require('zlib');

function checkPngTransparency(filePath) {
  const buf = fs.readFileSync(filePath);
  
  // Verify PNG signature
  if (buf.readUInt32BE(0) !== 0x89504E47 || buf.readUInt32BE(4) !== 0x0D0A1A0A) {
    console.log('Not a valid PNG file');
    return;
  }

  // Parse chunks
  let pos = 8;
  let hasAlpha = false;
  let colorType = -1;

  while (pos < buf.length) {
    const length = buf.readUInt32BE(pos);
    const type = buf.toString('ascii', pos + 4, pos + 8);
    
    if (type === 'IHDR') {
      const width = buf.readUInt32BE(pos + 8);
      const height = buf.readUInt32BE(pos + 12);
      const bitDepth = buf[pos + 16];
      colorType = buf[pos + 17];
      console.log(`IHDR: ${width}x${height}, bitDepth=${bitDepth}, colorType=${colorType}`);
      // Color types:
      // 0: Greyscale
      // 2: Truecolour (RGB)
      // 3: Indexed (Palette)
      // 4: Greyscale + Alpha
      // 6: Truecolour + Alpha (RGBA)
      if (colorType === 4 || colorType === 6) {
        hasAlpha = true;
      }
    }
    
    if (type === 'tRNS') {
      console.log('Found tRNS chunk (palette transparency)');
      hasAlpha = true;
    }

    pos += 12 + length;
  }

  console.log('Has Alpha channel/transparency:', hasAlpha);
}

const files = ['couple.png', 'luxury.png', 'honeymoon.png', 'trending.png', 'budget.png'];
files.forEach((file) => {
  console.log(`\n--- Checking scratch/${file} ---`);
  checkPngTransparency(`scratch/${file}`);
});
