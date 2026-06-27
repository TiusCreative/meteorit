const fs = require('fs');
const path = require('path');

const staticDir = path.join(process.cwd(), '.next', 'static');
const marker = ['eval', 'source', 'map'].join('-');

function removeEmptyParents(dir) {
  let current = dir;
  while (current.startsWith(staticDir) && current !== staticDir) {
    try {
      if (fs.readdirSync(current).length > 0) return;
      fs.rmdirSync(current);
      current = path.dirname(current);
    } catch {
      return;
    }
  }
}

function scan(dir) {
  if (!fs.existsSync(dir)) return;

  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const fullPath = path.join(dir, entry.name);

    if (entry.isDirectory()) {
      scan(fullPath);
      removeEmptyParents(fullPath);
      continue;
    }

    if (!entry.isFile() || !entry.name.endsWith('.js')) continue;

    const content = fs.readFileSync(fullPath, 'utf8');
    if (content.includes(marker)) {
      fs.unlinkSync(fullPath);
      removeEmptyParents(path.dirname(fullPath));
    }
  }
}

scan(staticDir);
