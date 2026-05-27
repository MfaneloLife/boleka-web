// Generate PWA icons from the public logo
const sharp = require('sharp');
const path = require('path');
const fs = require('fs');

const sizes = [72, 96, 128, 144, 152, 192, 384, 512];
const inputPath = path.join(__dirname, '..', 'public', 'images', 'logo.png');
const outputDir = path.join(__dirname, '..', 'public', 'icons');

async function generate() {
  // Ensure output directory exists
  fs.mkdirSync(outputDir, { recursive: true });

  // Check if input exists
  if (!fs.existsSync(inputPath)) {
    console.error('Logo not found at:', inputPath);
    console.log('Creating a simple orange square fallback icon...');
    
    // Create a simple SVG icon as fallback
    const svgIcon = `<svg xmlns="http://www.w3.org/2000/svg" width="512" height="512" viewBox="0 0 512 512">
      <rect width="512" height="512" rx="64" fill="#f97316"/>
      <text x="256" y="300" font-family="Arial, sans-serif" font-size="180" font-weight="bold" fill="white" text-anchor="middle">B</text>
    </svg>`;
    
    for (const size of sizes) {
      const svgBuffer = Buffer.from(svgIcon);
      await sharp(svgBuffer)
        .resize(size, size)
        .png()
        .toFile(path.join(outputDir, `icon-${size}x${size}.png`));
      console.log(`Created icon-${size}x${size}.png`);
    }
    return;
  }

  for (const size of sizes) {
    await sharp(inputPath)
      .resize(size, size, { fit: 'contain', background: { r: 249, g: 115, b: 22, alpha: 1 } })
      .png()
      .toFile(path.join(outputDir, `icon-${size}x${size}.png`));
    console.log(`Created icon-${size}x${size}.png`);
  }

  console.log('✅ All PWA icons generated!');
}

generate().catch(console.error);
