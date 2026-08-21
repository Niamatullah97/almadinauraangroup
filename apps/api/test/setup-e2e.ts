process.env.NODE_ENV = 'test';
process.env.DATABASE_URL =
  process.env.DATABASE_URL ??
  'postgresql://kabootar:kabootar_secret@localhost:5432/kabootar?schema=public';
process.env.JWT_SECRET =
  process.env.JWT_SECRET ?? 'test-jwt-secret-with-at-least-32-characters-long';
