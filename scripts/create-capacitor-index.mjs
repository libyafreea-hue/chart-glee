import { readdir, readFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';

const clientDir = join(process.cwd(), 'dist', 'client');
const assetsDir = join(clientDir, 'assets');
const files = await readdir(assetsDir);

const styles = files.filter((file) => file.endsWith('.css')).sort();
const indexScripts = files.filter((file) => /^index-[\w-]+\.js$/.test(file));

let entry = '';
for (const file of indexScripts) {
  const source = await readFile(join(assetsDir, file), 'utf8');
  if (source.includes('hydrateRoot') || source.includes('StartClient')) {
    entry = file;
    break;
  }
}

if (!entry) {
  const candidates = await Promise.all(
    indexScripts.map(async (file) => ({ file, size: (await readFile(join(assetsDir, file))).byteLength })),
  );
  entry = candidates.sort((a, b) => b.size - a.size)[0]?.file ?? '';
}

if (!entry) {
  throw new Error('Could not find Capacitor browser entry script in dist/client/assets.');
}

const html = `<!doctype html>
<html lang="en" class="dark">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
    <meta name="theme-color" content="#0a0a1a" />
    <title>Crypto Gem Hunter</title>
    ${styles.map((file) => `<link rel="stylesheet" href="./assets/${file}" />`).join('\n    ')}
  </head>
  <body>
    <script type="module" src="./assets/${entry}"></script>
  </body>
</html>
`;

await writeFile(join(clientDir, 'index.html'), html);
console.log(`Created dist/client/index.html for Capacitor using ${entry}`);
