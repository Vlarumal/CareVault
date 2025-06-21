import type { Config } from 'jest';
import { createDefaultEsmPreset,
  //  pathsToModuleNameMapper,
   } from 'ts-jest';
// import tsconfig from './tsconfig.jest.json';

// const { compilerOptions } = tsconfig;

const config: Config = {
  preset: 'ts-jest',
  ...createDefaultEsmPreset(),
  testEnvironment: 'node',
  setupFilesAfterEnv: ['<rootDir>/src/setupTests.ts'],
  setupFiles: ['tsconfig-paths/register'],
  // moduleNameMapper: pathsToModuleNameMapper(compilerOptions.paths, { prefix: '<rootDir>/' }),
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
  //   '^shared/(.*)$': '<rootDir>/../shared/$1',
  //   '^@shared$': '<rootDir>/../../shared/',
  //   '^@shared/(.*)$': '<rootDir>/../../shared/$1',
  },
  moduleDirectories: ['node_modules', '<rootDir>'],
  testPathIgnorePatterns: ['/node_modules/', '/dist/'],
  collectCoverage: true,
  coverageDirectory: 'coverage',
  coverageProvider: 'v8',
  testTimeout: 30000,
  globalSetup: '<rootDir>/src/tests/globalSetup.ts',
  globalTeardown: '<rootDir>/src/tests/globalTeardown.ts',
};

export default config;
