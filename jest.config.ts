module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  testMatch: ['**/tests/**/*.ts', '**/?(*.)+(spec|test).ts?(x)'],
  moduleFileExtensions: ['ts', 'js'],
  testTimeout: 10000,
};
