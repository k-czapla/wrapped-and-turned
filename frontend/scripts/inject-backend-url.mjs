import fs from 'node:fs';
import path from 'node:path';

const distIndexPath = path.join(process.cwd(), 'dist', 'index.html');
const backendPlaceholder = '__WT_BACKEND_URL__';
const wrappedPlaceholder = '__WT_FEATURE_WRAPPED__';

const backendUrl =
  (process.env.WT_BACKEND_URL ??
    process.env.BACKEND_URL ??
    process.env.PUBLIC_BACKEND_URL ??
    '')
    .trim()
    .replace(/\/+$/, '');

const wrappedRaw = (process.env.WT_FEATURE_WRAPPED ?? '').trim().toLowerCase();
const wrappedEnabled = wrappedRaw === 'true' || wrappedRaw === '1';

if (!fs.existsSync(distIndexPath)) {
  console.warn(`[inject-backend-url] Missing ${distIndexPath}. Did the build run?`);
  process.exit(0);
}

let input = fs.readFileSync(distIndexPath, 'utf8');

if (!input.includes(backendPlaceholder)) {
  console.warn(`[inject-backend-url] Placeholder ${backendPlaceholder} not found in dist/index.html; skipping.`);
} else {
  input = input.replaceAll(backendPlaceholder, backendUrl);
  console.log(
    `[inject-backend-url] Injected wt-backend-url=${backendUrl ? backendUrl : '(empty; same-origin)'}`
  );
}

if (input.includes(wrappedPlaceholder)) {
  input = input.replaceAll(wrappedPlaceholder, wrappedEnabled ? 'true' : 'false');
  console.log(`[inject-backend-url] Injected wt-feature-wrapped=${wrappedEnabled}`);
}

fs.writeFileSync(distIndexPath, input, 'utf8');

