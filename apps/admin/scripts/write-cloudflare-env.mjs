import { mkdir, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const apiUrl = process.env.API_URL;
const uploadsUrl = process.env.UPLOADS_URL ?? '';

if (!apiUrl) {
  throw new Error('API_URL is required for the Cloudflare Pages build');
}

for (const [name, value] of [
  ['API_URL', apiUrl],
  ['UPLOADS_URL', uploadsUrl],
]) {
  if (value) {
    new URL(value);
  }
}

const currentDir = dirname(fileURLToPath(import.meta.url));
const outputPath = resolve(currentDir, '../src/environments/environment.cloudflare.generated.ts');
const source = `// Generated during deployment. Do not edit or commit.
export const environment = {
  production: true,
  apiUrl: ${JSON.stringify(apiUrl.replace(/\/$/, ''))},
  uploadsUrl: ${JSON.stringify(uploadsUrl.replace(/\/$/, ''))},
};
`;

await mkdir(dirname(outputPath), { recursive: true });
await writeFile(outputPath, source, 'utf8');
