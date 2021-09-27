/* eslint-disable @typescript-eslint/no-var-requires */
const path = require('path');
const base = require('../jest.config.base.js');

module.exports.getJestConfig = function (dirname) {
  const packageJSON = require(`${dirname}/package`);
  return {
    ...base,
    displayName: packageJSON.name,
    name: packageJSON.name,
    rootDir: path.resolve(__dirname, '..'),
    testMatch: [`${dirname}/**/__tests__/**/*.spec.ts`],
  };
};
