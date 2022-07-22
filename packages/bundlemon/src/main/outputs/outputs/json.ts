import * as yup from 'yup';
import fs from 'node:fs';
import { Report } from 'bundlemon-utils';
import { createLogger } from '../../../common/logger';
import { validateYup } from '../../utils/validationUtils';
import type { Output, OutputInstance } from '../types';

const NAME = 'json';
const DEFAULT_FILENAME = 'bundlemon-results.json';

const logger = createLogger(`${NAME} output`);

interface JsonOutputOptions {
  fileName: string;
}

function validateOptions(options: unknown): JsonOutputOptions | undefined {
  const schema: yup.SchemaOf<JsonOutputOptions, JsonOutputOptions> = yup
    .object()
    .required()
    .shape({
      fileName: yup.string().optional().default(DEFAULT_FILENAME),
    });

  return validateYup(schema, options, `${NAME} output`);
}

const saveAsJson = (filename: string, payload: Report) => {
  try {
    fs.writeFileSync(`${filename}`, JSON.stringify(payload, null, 2));
  } catch (error) {
    logger.error(`Could not save a file ${filename}`);
    throw error;
  }
};

const output: Output = {
  name: NAME,
  create: ({ options }): OutputInstance | Promise<OutputInstance | undefined> | undefined => {
    const normalizedOptions = validateOptions(options);

    if (!normalizedOptions) {
      throw new Error(`validation error in output "${NAME}" options`);
    }
    return {
      generate: (report: Report): void => {
        saveAsJson(normalizedOptions.fileName, report);
      },
    };
  },
};

export default output;
