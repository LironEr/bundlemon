/* eslint-disable @typescript-eslint/no-var-requires */

const fs = require('node:fs');
const path = require('node:path');
const { execSync } = require('node:child_process');
const { createGenerator } = require('ts-json-schema-generator');

const startTime = Date.now();

const TMP_OUTPUT_PATH = '.tmp/schemas.ts';
const OUTPUT_PATH = './src/consts/schemas.ts';

// Create output directory
fs.mkdirSync(path.dirname(TMP_OUTPUT_PATH), { recursive: true });
fs.rmSync(TMP_OUTPUT_PATH, { force: true });

const schema = createGenerator({
  path: './src/types/schemas/**/*.ts',
  tsconfig: './tsconfig.json',
}).createSchema('*');

let fileString = '';

for (let name of Object.keys(schema.definitions)) {
  console.log(`create ${name} schema`);
  fileString += `export const ${name} = ${JSON.stringify(
    { $id: `#/definitions/${name}`, ...schema.definitions[name] },
    null,
    2
  )};\n\n`;
}

fs.writeFileSync(TMP_OUTPUT_PATH, fileString);

if (!process.env.CI) {
  execSync(`yarn prettier --write "${TMP_OUTPUT_PATH}"`, { cwd: path.join(__dirname, '../'), stdio: 'inherit' });
}

console.log(`move ${TMP_OUTPUT_PATH} to ${OUTPUT_PATH}`);
fs.renameSync(TMP_OUTPUT_PATH, OUTPUT_PATH);

console.log(`Done - ${Date.now() - startTime}ms`);
