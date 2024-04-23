export default {
  displayName: 'service',
  preset: '../../jest.preset.js',
  coverageDirectory: '../../coverage/apps/service',
  setupFilesAfterEnv: ['<rootDir>/tests/hooks.ts'],
};
