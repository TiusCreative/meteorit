const fs = require('fs');
const path = require('path');

function processDir(dir) {
  const files = fs.readdirSync(dir, { withFileTypes: true });
  for (const file of files) {
    const fullPath = path.join(dir, file.name);
    if (file.isDirectory()) {
      processDir(fullPath);
    } else if (file.name.endsWith('.ts') || file.name.endsWith('.tsx') || file.name.endsWith('.js')) {
      let content = fs.readFileSync(fullPath, 'utf8');
      if (content.includes('cache:') && content.includes('no-store')) {
        let updated = content
          .replace(/,\s*\{\s*cache:\s*['"]no-store['"]\s*\}/g, '')
          .replace(/\{\s*cache:\s*['"]no-store['"]\s*\}/g, '{}')
          .replace(/cache:\s*['"]no-store['"],?\n?/g, '');
        if (updated !== content) {
          fs.writeFileSync(fullPath, updated, 'utf8');
          console.log(`Updated: ${fullPath}`);
        }
      }
    }
  }
}

processDir(path.join(__dirname, '../src'));
console.log('Finished updating files.');

