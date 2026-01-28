import fs from 'node:fs';
import path from 'node:path';

const distIndexPath = path.join(process.cwd(), 'dist', 'index.html');
const placeholder = '__WT_BACKEND_URL__';

const backendUrl =
  (process.env.WT_BACKEND_URL ??
    process.env.BACKEND_URL ??
    process.env.PUBLIC_BACKEND_URL ??
    '')
    .trim()
    .replace(/\/+$/, '');

if (!fs.existsSync(distIndexPath)) {
  console.warn(`[inject-backend-url] Missing ${distIndexPath}. Did the build run?`);
  process.exit(0);
}

const input = fs.readFileSync(distIndexPath, 'utf8');

if (!input.includes(placeholder)) {
  console.warn(`[inject-backend-url] Placeholder ${placeholder} not found in dist/index.html; skipping.`);
  process.exit(0);
}

const output = input.replaceAll(placeholder, backendUrl);
fs.writeFileSync(distIndexPath, output, 'utf8');

console.log(
  `[inject-backend-url] Injected wt-backend-url=${backendUrl ? backendUrl : '(empty; same-origin)'}`
);

