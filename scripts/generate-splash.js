const fs = require('fs');
const path = require('path');

// Create a simple SVG splash screen
const createSplashSVG = (width, height, isDark = false) => {
  const bgColor = isDark ? '#1f2937' : '#ffffff'; // gray-800 for dark, white for light
  const textColor = isDark ? '#ffffff' : '#1f2937';
  const accentColor = '#2563eb'; // blue-600
  
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="bgGradient" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:${accentColor};stop-opacity:0.1" />
      <stop offset="100%" style="stop-color:${accentColor};stop-opacity:0.05" />
    </linearGradient>
  </defs>
  
  <!-- Background -->
  <rect width="100%" height="100%" fill="${bgColor}"/>
  <rect width="100%" height="100%" fill="url(#bgGradient)"/>
  
  <!-- Center content -->
  <g transform="translate(${width/2}, ${height/2})">
    <!-- Logo circle -->
    <circle cx="0" cy="-40" r="80" fill="${accentColor}" opacity="0.1"/>
    <circle cx="0" cy="-40" r="60" fill="${accentColor}" opacity="0.2"/>
    <circle cx="0" cy="-40" r="40" fill="${accentColor}"/>
    
    <!-- App name -->
    <text x="0" y="60" text-anchor="middle" font-family="system-ui, -apple-system, sans-serif" 
          font-size="48" font-weight="bold" fill="${textColor}">Karyakarta</text>
    
    <!-- Tagline -->
    <text x="0" y="100" text-anchor="middle" font-family="system-ui, -apple-system, sans-serif" 
          font-size="20" font-weight="400" fill="${textColor}" opacity="0.7">Home Services</text>
    
    <!-- Loading indicator -->
    <circle cx="0" cy="160" r="4" fill="${accentColor}" opacity="0.6">
      <animate attributeName="opacity" values="0.6;1;0.6" dur="1.5s" repeatCount="indefinite"/>
    </circle>
    <circle cx="-20" cy="160" r="4" fill="${accentColor}" opacity="0.4">
      <animate attributeName="opacity" values="0.4;1;0.4" dur="1.5s" repeatCount="indefinite" begin="0.2s"/>
    </circle>
    <circle cx="20" cy="160" r="4" fill="${accentColor}" opacity="0.4">
      <animate attributeName="opacity" values="0.4;1;0.4" dur="1.5s" repeatCount="indefinite" begin="0.4s"/>
    </circle>
  </g>
</svg>`;
};

// Create splash screens
const createSplashScreens = () => {
  const assetsDir = path.join(__dirname, '..', 'apps', 'mobile', 'assets');
  
  // Ensure directory exists
  if (!fs.existsSync(assetsDir)) {
    fs.mkdirSync(assetsDir, { recursive: true });
  }
  
  // Create light splash (2732x2732 minimum)
  const lightSplash = createSplashSVG(2732, 2732, false);
  fs.writeFileSync(path.join(assetsDir, 'splash-light.svg'), lightSplash);
  
  // Create dark splash (2732x2732 minimum)
  const darkSplash = createSplashSVG(2732, 2732, true);
  fs.writeFileSync(path.join(assetsDir, 'splash-dark.svg'), darkSplash);
  
  // Create a standard splash (2732x2732)
  const standardSplash = createSplashSVG(2732, 2732, false);
  fs.writeFileSync(path.join(assetsDir, 'splash.png'), standardSplash);
  
  console.log('✅ Splash screens created:');
  console.log('  - apps/mobile/assets/splash-light.svg (2732x2732)');
  console.log('  - apps/mobile/assets/splash-dark.svg (2732x2732)');
  console.log('  - apps/mobile/assets/splash.png (2732x2732)');
};

// Run the script
createSplashScreens();
