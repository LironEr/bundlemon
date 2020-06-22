const base = require('../jest.config.base.js');

module.exports.getJestConfig = function (packageJSON) {
  return {
    ...base,
    displayName: packageJSON.name,
    name: packageJSON.name,
    rootDir: '../..',
    testMatch: [`<rootDir>/packages/${packageJSON.name}/**/__tests__/**/*.spec.ts`],
  };
};
