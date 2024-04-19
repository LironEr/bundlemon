/* eslint-disable @typescript-eslint/no-var-requires */

const { writeFileSync } = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const { createGenerator } = require('ts-json-schema-generator');

const startTime = Date.now();

const output_path = './src/consts/schemas.ts';

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

writeFileSync(output_path, fileString);

if (!process.env.CI) {
  execSync(`yarn eslint "${output_path}" --fix`, { cwd: path.join(__dirname, '../'), stdio: 'inherit' });
}

console.log(`Done - ${Date.now() - startTime}ms`);
