const fs = require('fs');
const path = require('path');

const workerPath = path.join(__dirname, '../.vercel/output/static/_worker.js/index.js');
if (!fs.existsSync(workerPath)) {
  console.error('Worker file does not exist at:', workerPath);
  process.exit(1);
}

let content = fs.readFileSync(workerPath, 'utf8');
const target = "import('node:buffer')";
const idx = content.indexOf(target);
if (idx === -1) {
  console.error('Target not found in worker!');
  process.exit(1);
}
const cleanBody = content.slice(idx);

// Parse .env
const envContent = fs.readFileSync(path.join(__dirname, '../.env'), 'utf8');
const envVars = {};
for (const line of envContent.split('\n')) {
  const trimmed = line.trim();
  if (!trimmed || trimmed.startsWith('#') || !trimmed.includes('=')) continue;
  const i = trimmed.indexOf('=');
  const key = trimmed.slice(0, i).trim();
  let val = trimmed.slice(i + 1).trim();
  if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
    val = val.slice(1, -1);
  }
  envVars[key] = val;
}

const domParserPolyfill = `if (typeof globalThis.DOMParser === "undefined") {
  globalThis.Node = { ELEMENT_NODE: 1, TEXT_NODE: 3 };
  globalThis.DOMParser = class DOMParser {
    parseFromString(xmlString) {
      function parseXml(xml) {
        const clean = (xml || "").replace(/<\\?[^>]*\\?>/g, "").trim();
        const tagMatch = clean.match(/^<([a-zA-Z0-9_\\-]+)[^>]*>([\\s\\S]*)<\\/\\1>$/);
        if (!tagMatch) {
          return { nodeType: 1, nodeName: "root", attributes: [], childNodes: [] };
        }
        const tagName = tagMatch[1];
        const inner = tagMatch[2].trim();
        const childNodes = [];
        const childRegex = /<([a-zA-Z0-9_\\-]+)[^>]*>([\\s\\S]*?)<\\/\\1>/g;
        let match;
        let hasChildren = false;
        while ((match = childRegex.exec(inner)) !== null) {
          hasChildren = true;
          childNodes.push(parseXml(match[0]));
        }
        if (!hasChildren && inner) {
          childNodes.push({ nodeType: 3, nodeName: "#text", textContent: inner });
        }
        return { nodeType: 1, nodeName: tagName, attributes: [], childNodes };
      }
      const rootNode = parseXml(xmlString || "<root/>");
      return {
        documentElement: rootNode,
        getElementsByTagName: (tag) => [],
        nodeType: 1,
        nodeName: "#document",
        attributes: [],
        childNodes: [rootNode]
      };
    }
  };
}
globalThis.__EMBEDDED_ENV__ = ${JSON.stringify(envVars)};
`;

let finalContent = domParserPolyfill + '\n\t\t' + cleanBody;
if (!finalContent.includes('globalThis.__EMBEDDED_ENV__,')) {
  finalContent = finalContent.replace(
    /s\.run\(\{\.\.\.e,/g,
    's.run({...globalThis.__EMBEDDED_ENV__, ...e,'
  );
}

fs.writeFileSync(workerPath, finalContent, 'utf8');
console.log(`✅ Successfully injected clean DOMParser polyfill and ${Object.keys(envVars).length} env variables!`);
