/** @type {import('jest').Config} */
module.exports = {
  moduleFileExtensions: ['js', 'json', 'ts'],
  rootDir: 'src',
  testRegex: '.*\\.spec\\.ts$',
  transform: {
    '^.+\\.(t|j)s$': 'ts-jest',
  },
  collectCoverageFrom: [
    '**/application/**/*.service.ts',
    '!**/*.spec.ts',
  ],
  coverageThreshold: {
    global: {
      branches: 35,
      functions: 74,
      lines: 70,
      statements: 70,
    },
  },
  testEnvironment: 'node',
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/$1',
    '^bcrypt$': '<rootDir>/../test/mocks/bcrypt.mock.ts',
  },
  testPathIgnorePatterns: ['/node_modules/', '/dist/'],
};
