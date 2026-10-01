import sharp from 'sharp';
import fs from 'node:fs';
import path from 'node:path';

const svgPath = path.resolve('public/icon.svg');
const svgBuffer = fs.readFileSync(svgPath);

async function generate() {
  await sharp(svgBuffer).resize(192, 192).png().toFile('public/pwa-192x192.png');
  await sharp(svgBuffer).resize(512, 512).png().toFile('public/pwa-512x512.png');
  await sharp(svgBuffer).resize(512, 512).png().toFile('public/pwa-maskable-512x512.png');
  await sharp(svgBuffer).resize(180, 180).png().toFile('public/apple-touch-icon.png');
  await sharp(svgBuffer).resize(32, 32).png().toFile('public/favicon.png');
  console.log('PWA icons generated successfully.');
}

generate().catch(err => {
  console.error(err);
  process.exit(1);
});
