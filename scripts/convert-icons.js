const sharp = require('sharp');
const path = require('path');

const input = path.resolve(__dirname, '..', 'resources', 'favicon.svg');
const sizes = [192, 512];

async function convert() {
  for (const size of sizes) {
    const outPath = path.resolve(__dirname, '..', 'icons', `icon-${size}.png`);
    await sharp(input)
      .resize(size, size)
      .png()
      .toFile(outPath);
    console.log(`Generated ${outPath}`);
  }
}

convert().catch(err => {
  console.error('Error converting icons:', err);
  process.exit(1);
});
