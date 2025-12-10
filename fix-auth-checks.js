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
    
    // Add auth null check before verifyIdToken
    content = content.replace(
      /(\s+)(\/\/ Verify the ID token\s+let decodedToken;\s+try\s+\{)/g,
      '$1// Verify the ID token\n$1if (!auth) {\n$1  return NextResponse.json(\n$1    { ok: false, error: \'Authentication not available\' },\n$1    { status: 500 }\n$1  );\n$1}\n$1\n$1let decodedToken;\n$1try {'
    );
    
    fs.writeFileSync(filePath, content);
    console.log(`Fixed ${file}`);
  }
});














