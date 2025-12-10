const fs = require('fs');
const path = require('path');

const files = [
  'app/api/jobs/list/route.ts',
  'app/api/jobs/repeat/route.ts',
  'app/api/ratings/create/route.ts',
  'app/api/providers/stats/route.ts',
  'app/api/providers/jobs/update-status/route.ts',
  'app/api/payouts/by-provider/route.ts'
];

files.forEach(file => {
  const filePath = path.join(__dirname, file);
  if (fs.existsSync(filePath)) {
    let content = fs.readFileSync(filePath, 'utf8');
    
    // Add db null check after userId extraction
    content = content.replace(
      /(const userId = decodedToken\.uid;\s+const userEmail = decodedToken\.email;)/g,
      '$1\n\n    if (!db) {\n      return NextResponse.json(\n        { ok: false, error: \'Database not available\' },\n        { status: 500 }\n      );\n    }'
    );
    
    fs.writeFileSync(filePath, content);
    console.log(`Fixed ${file}`);
  }
});














