import { run } from 'node:test';
import { spec } from 'node:test/reporters';
import { pipeline } from 'node:stream/promises';
import path from 'node:path';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';

const dir = path.dirname(fileURLToPath(import.meta.url));

function findTestFiles(currentDir) {
  const entries = fs.readdirSync(currentDir, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    const fullPath = path.join(currentDir, entry.name);
    if (entry.isDirectory()) {
      files.push(...findTestFiles(fullPath));
    } else if (entry.isFile() && entry.name.endsWith('.test.js')) {
      files.push(fullPath);
    }
  }
  return files;
}

const files = findTestFiles(dir);

const stream = run({ files });

let failed = 0;
stream.on('test:fail', () => { failed++; });

await pipeline(stream.compose(spec), process.stdout);

if (failed > 0) {
  process.stderr.write(`\n${failed} test(s) failed.\n`);
  process.exit(1);
}
