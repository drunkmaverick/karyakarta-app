const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Create a simple HTML file to render the splash screen
const createSplashHTML = (isDark = false) => {
  const bgColor = isDark ? '#1f2937' : '#ffffff';
  const textColor = isDark ? '#ffffff' : '#1f2937';
  const accentColor = '#2563eb';
  
  return `<!DOCTYPE html>
<html>
<head>
  <style>
    body {
      margin: 0;
      padding: 0;
      width: 2732px;
      height: 2732px;
      background: linear-gradient(135deg, ${accentColor}10, ${accentColor}05);
      background-color: ${bgColor};
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      font-family: system-ui, -apple-system, sans-serif;
    }
    .logo {
      width: 160px;
      height: 160px;
      background: ${accentColor};
      border-radius: 50%;
      margin-bottom: 40px;
      display: flex;
      align-items: center;
      justify-content: center;
      color: white;
      font-size: 48px;
      font-weight: bold;
    }
    .app-name {
      font-size: 96px;
      font-weight: bold;
      color: ${textColor};
      margin-bottom: 20px;
    }
    .tagline {
      font-size: 40px;
      color: ${textColor};
      opacity: 0.7;
    }
  </style>
</head>
<body>
  <div class="logo">K</div>
  <div class="app-name">Karyakarta</div>
  <div class="tagline">Home Services</div>
</body>
</html>`;
};

// Generate assets
const generateAssets = () => {
  const assetsDir = path.join(__dirname, '..', 'apps', 'mobile', 'assets');
  
  // Ensure directory exists
  if (!fs.existsSync(assetsDir)) {
    fs.mkdirSync(assetsDir, { recursive: true });
  }
  
  // Create light splash HTML
  const lightHTML = createSplashHTML(false);
  fs.writeFileSync(path.join(assetsDir, 'splash-light.html'), lightHTML);
  
  // Create dark splash HTML  
  const darkHTML = createSplashHTML(true);
  fs.writeFileSync(path.join(assetsDir, 'splash-dark.html'), darkHTML);
  
  console.log('✅ Splash HTML files created:');
  console.log('  - apps/mobile/assets/splash-light.html');
  console.log('  - apps/mobile/assets/splash-dark.html');
  
  // For now, we'll create a simple PNG using the existing icon
  // In a real scenario, you'd use a tool like Puppeteer to convert HTML to PNG
  console.log('📝 Note: HTML files created. To convert to PNG, use a tool like Puppeteer or wkhtmltoimage');
};

generateAssets();
