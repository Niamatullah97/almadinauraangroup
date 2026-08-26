import { cpSync, existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from 'fs';
import { join } from 'path';

const root = process.cwd();
const deployRoot = join(root, 'deploy', 'hostinger-api');
const pnpmDir = join(root, 'node_modules', '.pnpm');

function findPrismaClientDir(baseDir) {
  if (!existsSync(baseDir)) return null;
  for (const entry of readdirSync(baseDir)) {
    if (!entry.startsWith('@prisma+client@')) continue;
    const candidate = join(baseDir, entry, 'node_modules', '.prisma', 'client');
    if (existsSync(candidate)) return candidate;
  }
  return null;
}

const source = findPrismaClientDir(pnpmDir);
if (!source) {
  console.error('Could not find generated Prisma client under node_modules/.pnpm');
  process.exit(1);
}

const prismaTarget = join(deployRoot, 'node_modules', '.prisma', 'client');
mkdirSync(prismaTarget, { recursive: true });
cpSync(source, prismaTarget, { recursive: true });
console.log(`Copied Prisma client -> ${prismaTarget}`);

const deployPnpm = join(deployRoot, 'node_modules', '.pnpm');
if (existsSync(deployPnpm)) {
  for (const entry of readdirSync(deployPnpm)) {
    if (!entry.startsWith('@prisma+client@')) continue;
    const nested = join(deployPnpm, entry, 'node_modules', '.prisma', 'client');
    mkdirSync(nested, { recursive: true });
    cpSync(source, nested, { recursive: true });
    console.log(`Copied Prisma client -> ${nested}`);
  }
}

if (!existsSync(join(deployRoot, 'dist', 'main.js'))) {
  console.error('deploy/hostinger-api/dist/main.js is missing');
  process.exit(1);
}

// Hostinger always runs `npm install`. Strip workspace: protocol and ship a
// package.json that installs nothing — node_modules is already in the ZIP.
const pkgPath = join(deployRoot, 'package.json');
const pkg = JSON.parse(readFileSync(pkgPath, 'utf8'));
writeFileSync(
  pkgPath,
  JSON.stringify(
    {
      name: pkg.name,
      version: pkg.version,
      private: true,
      scripts: {
        start: 'node dist/main',
        'start:prod': 'node dist/main',
      },
      engines: {
        node: '>=20.0.0',
      },
      dependencies: {},
      devDependencies: {},
    },
    null,
    2,
  ),
);
console.log('Rewrote package.json for Hostinger (no workspace: deps)');

writeFileSync(
  join(deployRoot, '.npmrc'),
  ['ignore-scripts=true', 'fund=false', 'audit=false'].join('\n') + '\n',
);

writeFileSync(
  join(deployRoot, 'package-lock.json'),
  JSON.stringify(
    {
      name: pkg.name,
      version: pkg.version,
      lockfileVersion: 3,
      requires: true,
      packages: {
        '': {
          name: pkg.name,
          version: pkg.version,
        },
      },
    },
    null,
    2,
  ),
);

console.log('Hostinger bundle finalized');
