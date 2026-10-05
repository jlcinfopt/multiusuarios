const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

const publicDir = path.resolve(__dirname, '../public');
if (!fs.existsSync(publicDir)) {
  fs.mkdirSync(publicDir, { recursive: true });
}

// 1. Standard SVG Icon (Luxury Barber Scissors & Crest)
const svgStandard = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="512" height="512">
  <defs>
    <linearGradient id="bgGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#1c1c1c"/>
      <stop offset="50%" stop-color="#121212"/>
      <stop offset="100%" stop-color="#0a0a0a"/>
    </linearGradient>
    <linearGradient id="goldGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#fef08a"/>
      <stop offset="45%" stop-color="#c9a227"/>
      <stop offset="85%" stop-color="#9a7818"/>
      <stop offset="100%" stop-color="#6e540d"/>
    </linearGradient>
    <filter id="goldGlow" x="-20%" y="-20%" width="140%" height="140%">
      <feGaussianBlur stdDeviation="6" result="blur" />
      <feComposite in="SourceGraphic" in2="blur" operator="over" />
    </filter>
  </defs>

  <!-- Background Base -->
  <rect width="512" height="512" rx="108" fill="url(#bgGrad)"/>
  <rect width="496" height="496" x="8" y="8" rx="100" fill="none" stroke="url(#goldGrad)" stroke-width="4" stroke-opacity="0.35"/>

  <!-- Subtle Vintage Barber Border -->
  <circle cx="256" cy="256" r="190" fill="none" stroke="url(#goldGrad)" stroke-width="3" stroke-dasharray="8 6" stroke-opacity="0.45"/>
  <circle cx="256" cy="256" r="176" fill="none" stroke="url(#goldGrad)" stroke-width="1.5" stroke-opacity="0.3"/>

  <!-- Central Crest with Scissors & Crown -->
  <g transform="translate(256, 256)" filter="url(#goldGlow)">
    <!-- Small Crown on top -->
    <path d="M -38 -95 L -20 -70 L 0 -92 L 20 -70 L 38 -95 L 30 -58 L -30 -58 Z" fill="url(#goldGrad)"/>
    <circle cx="-38" cy="-97" r="4" fill="#fef08a"/>
    <circle cx="0" cy="-94" r="5" fill="#fef08a"/>
    <circle cx="38" cy="-97" r="4" fill="#fef08a"/>

    <!-- Left Scissor Blade -->
    <path d="M 0 -45 L -75 60 C -82 72 -75 88 -60 88 C -46 88 -38 76 -46 64 L -15 18 L 0 -5 Z" fill="url(#goldGrad)"/>
    <!-- Left Scissor Loop -->
    <circle cx="-60" cy="74" r="26" fill="none" stroke="url(#goldGrad)" stroke-width="9"/>
    <circle cx="-60" cy="74" r="15" fill="#121212"/>

    <!-- Right Scissor Blade -->
    <path d="M 0 -45 L 75 60 C 82 72 75 88 60 88 C 46 88 38 76 46 64 L 15 18 L 0 -5 Z" fill="url(#goldGrad)"/>
    <!-- Right Scissor Loop -->
    <circle cx="60" cy="74" r="26" fill="none" stroke="url(#goldGrad)" stroke-width="9"/>
    <circle cx="60" cy="74" r="15" fill="#121212"/>

    <!-- Center Pivot Pin -->
    <circle cx="0" cy="6" r="8" fill="#fef08a"/>
    <circle cx="0" cy="6" r="4" fill="#121212"/>

    <!-- Est. Star Accents -->
    <path d="M -90 -10 L -86 -2 L -78 -2 L -84 3 L -82 11 L -90 6 L -98 11 L -96 3 L -102 -2 L -94 -2 Z" fill="url(#goldGrad)"/>
    <path d="M 90 -10 L 94 -2 L 102 -2 L 96 3 L 98 11 L 90 6 L 82 11 L 84 3 L 78 -2 L 86 -2 Z" fill="url(#goldGrad)"/>
  </g>

  <!-- Brand Typography -->
  <text x="256" y="405" font-family="'Montserrat', sans-serif" font-weight="800" font-size="28" fill="url(#goldGrad)" text-anchor="middle" letter-spacing="7">BARBERFLOW</text>
  <text x="256" y="428" font-family="'Montserrat', sans-serif" font-weight="600" font-size="12" fill="#e5b83b" text-anchor="middle" letter-spacing="4">BARBEARIA &amp; ESTÉTICA</text>
</svg>`;

// 2. Maskable SVG Icon with 20% safe zone padding around artwork
const svgMaskable = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="512" height="512">
  <defs>
    <linearGradient id="bgGradM" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#1a1a1a"/>
      <stop offset="50%" stop-color="#121212"/>
      <stop offset="100%" stop-color="#0a0a0a"/>
    </linearGradient>
    <linearGradient id="goldGradM" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#fef08a"/>
      <stop offset="45%" stop-color="#c9a227"/>
      <stop offset="85%" stop-color="#9a7818"/>
      <stop offset="100%" stop-color="#6e540d"/>
    </linearGradient>
  </defs>

  <!-- Full-bleed background for Android safe clipping -->
  <rect width="512" height="512" fill="url(#bgGradM)"/>

  <!-- Scaled down to safe zone 75% -->
  <g transform="translate(64, 64) scale(0.75)">
    <circle cx="256" cy="256" r="176" fill="none" stroke="url(#goldGradM)" stroke-width="3" stroke-dasharray="8 6" stroke-opacity="0.45"/>
    <g transform="translate(256, 256)">
      <path d="M -38 -95 L -20 -70 L 0 -92 L 20 -70 L 38 -95 L 30 -58 L -30 -58 Z" fill="url(#goldGradM)"/>
      <circle cx="-38" cy="-97" r="4" fill="#fef08a"/>
      <circle cx="0" cy="-94" r="5" fill="#fef08a"/>
      <circle cx="38" cy="-97" r="4" fill="#fef08a"/>

      <path d="M 0 -45 L -75 60 C -82 72 -75 88 -60 88 C -46 88 -38 76 -46 64 L -15 18 L 0 -5 Z" fill="url(#goldGradM)"/>
      <circle cx="-60" cy="74" r="26" fill="none" stroke="url(#goldGradM)" stroke-width="9"/>
      <circle cx="-60" cy="74" r="15" fill="#121212"/>

      <path d="M 0 -45 L 75 60 C 82 72 75 88 60 88 C 46 88 38 76 46 64 L 15 18 L 0 -5 Z" fill="url(#goldGradM)"/>
      <circle cx="60" cy="74" r="26" fill="none" stroke="url(#goldGradM)" stroke-width="9"/>
      <circle cx="60" cy="74" r="15" fill="#121212"/>

      <circle cx="0" cy="6" r="8" fill="#fef08a"/>
      <circle cx="0" cy="6" r="4" fill="#121212"/>
    </g>
    <text x="256" y="398" font-family="'Montserrat', sans-serif" font-weight="800" font-size="28" fill="url(#goldGradM)" text-anchor="middle" letter-spacing="6">BARBERFLOW</text>
  </g>
</svg>`;

async function buildIcons() {
  fs.writeFileSync(path.join(publicDir, 'icon.svg'), svgStandard);
  fs.writeFileSync(path.join(publicDir, 'icon-maskable.svg'), svgMaskable);

  // 192x192 PNG
  await sharp(Buffer.from(svgStandard))
    .resize(192, 192)
    .png()
    .toFile(path.join(publicDir, 'pwa-192x192.png'));

  // 512x512 PNG
  await sharp(Buffer.from(svgStandard))
    .resize(512, 512)
    .png()
    .toFile(path.join(publicDir, 'pwa-512x512.png'));

  // 512x512 Maskable PNG
  await sharp(Buffer.from(svgMaskable))
    .resize(512, 512)
    .png()
    .toFile(path.join(publicDir, 'pwa-maskable-512x512.png'));

  // 180x180 Apple Touch Icon (Required for iOS Safari PWA)
  await sharp(Buffer.from(svgStandard))
    .resize(180, 180)
    .png()
    .toFile(path.join(publicDir, 'apple-touch-icon.png'));

  // 64x64 favicon.ico (converted to png container or favicon)
  await sharp(Buffer.from(svgStandard))
    .resize(64, 64)
    .png()
    .toFile(path.join(publicDir, 'favicon.ico'));

  console.log('Successfully generated all PWA icons in /public!');
}

buildIcons().catch(err => {
  console.error(err);
  process.exit(1);
});
