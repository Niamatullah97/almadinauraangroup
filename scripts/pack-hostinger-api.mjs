import { cpSync, existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'fs';
import { join } from 'path';

const root = process.cwd();
const out = join(root, 'deploy', 'hostinger-api');

function readJson(path) {
  return JSON.parse(readFileSync(path, 'utf8'));
}

function writeJson(path, value) {
  writeFileSync(path, JSON.stringify(value, null, 2) + '\n');
}

rmSync(out, { recursive: true, force: true });
mkdirSync(out, { recursive: true });

const apiDist = join(root, 'apps', 'api', 'dist');
const apiAssets = join(root, 'apps', 'api', 'assets');
if (!existsSync(join(apiDist, 'main.js'))) {
  console.error('apps/api/dist/main.js missing — run build first');
  process.exit(1);
}

cpSync(apiDist, join(out, 'dist'), { recursive: true });
if (existsSync(apiAssets)) {
  cpSync(apiAssets, join(out, 'assets'), { recursive: true });
}

// Vendor workspace packages for npm (no workspace: protocol)
const sharedOut = join(out, 'vendor', 'shared');
const databaseOut = join(out, 'vendor', 'database');
mkdirSync(sharedOut, { recursive: true });
mkdirSync(databaseOut, { recursive: true });

cpSync(join(root, 'packages', 'shared', 'dist'), join(sharedOut, 'dist'), { recursive: true });
writeJson(join(sharedOut, 'package.json'), {
  name: '@kabootar/shared',
  version: '0.1.0',
  private: true,
  main: './dist/index.js',
  types: './dist/index.d.ts',
  exports: {
    '.': {
      types: './dist/index.d.ts',
      default: './dist/index.js',
    },
    './constants': {
      types: './dist/constants/index.d.ts',
      default: './dist/constants/index.js',
    },
    './types': {
      types: './dist/types/index.d.ts',
      default: './dist/types/index.js',
    },
  },
});

cpSync(join(root, 'packages', 'database', 'dist'), join(databaseOut, 'dist'), {
  recursive: true,
});
cpSync(join(root, 'packages', 'database', 'prisma'), join(databaseOut, 'prisma'), {
  recursive: true,
});
writeJson(join(databaseOut, 'package.json'), {
  name: '@kabootar/database',
  version: '0.1.0',
  private: true,
  main: './dist/index.js',
  types: './dist/index.d.ts',
  dependencies: {
    '@prisma/adapter-pg': '^6.5.0',
    '@prisma/client': '^6.5.0',
    pg: '^8.16.3',
  },
});

const apiPkg = readJson(join(root, 'apps', 'api', 'package.json'));
const dependencies = { ...apiPkg.dependencies };
dependencies['@kabootar/shared'] = 'file:./vendor/shared';
dependencies['@kabootar/database'] = 'file:./vendor/database';
dependencies.prisma = '^6.5.0';

writeJson(join(out, 'package.json'), {
  name: 'kabootar-api',
  version: apiPkg.version,
  private: true,
  scripts: {
    start: 'node dist/main',
    'start:prod': 'node dist/main',
    postinstall: 'prisma generate --schema=vendor/database/prisma/schema.prisma',
  },
  engines: { node: '>=20.0.0' },
  dependencies,
});

writeFileSync(
  join(out, '.npmrc'),
  [
    'fund=false',
    'audit=false',
    'legacy-peer-deps=true',
    'engine-strict=false',
  ].join('\n') + '\n',
);

console.log('Packed Hostinger API at deploy/hostinger-api (npm-installable, no node_modules)');
