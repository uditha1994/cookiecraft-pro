module.exports = {
  testEnvironment: 'jsdom',
  setupFilesAfterEnv: ['./tests/setup.js'],
  moduleNameMapper: {
    '^../utils/(.*)$': '<rootDir>/utils/$1',
    '^../components/(.*)$': '<rootDir>/components/$1'
  },
  testMatch: ['**/tests/**/*.test.js'],
  collectCoverageFrom: [
    'utils/**/*.js',
    'components/**/*.js',
    'popup/**/*.js',
    'background/**/*.js'
  ],
  coverageThreshold: {
    global: {
      branches: 70,
      functions: 70,
      lines: 70,
      statements: 70
    }
  }
};