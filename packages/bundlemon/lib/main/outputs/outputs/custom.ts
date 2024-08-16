import * as yup from 'yup';
import path from 'path';
import fs from 'fs';
import { Report } from 'bundlemon-utils';
import { createLogger } from '../../../common/logger';
import { validateYup } from '../../utils/validationUtils';
import type { Output } from '../types';

const NAME = 'custom';

const logger = createLogger(`${NAME} output`);

interface CustomOutputOptions {
  path?: string;
}
interface NormalizedCustomOutputOptions {
  path: string;
}

function validateOptions(options: unknown): NormalizedCustomOutputOptions {
  const schema: yup.SchemaOf<CustomOutputOptions, CustomOutputOptions> = yup.object().required().shape({
    path: yup.string().required(),
  });

  const normalizedOptions = validateYup(schema, options, `${NAME} output`);

  if (!normalizedOptions) {
    throw new Error(`validation error in output "${NAME}" options`);
  }

  return normalizedOptions as NormalizedCustomOutputOptions;
}

const output: Output = {
  name: NAME,
  create: async ({ options }) => {
    const normalizedOptions = validateOptions(options);

    const resolvedPath = path.resolve(normalizedOptions.path);

    if (!fs.existsSync(resolvedPath)) {
      throw new Error(`custom output file not found: ${resolvedPath}`);
    }

    logger.debug(`Importing ${resolvedPath}`);
    const customOutput = await import(resolvedPath);

    if (typeof customOutput.default !== 'function') {
      throw new Error('custom output should export default function');
    }

    return {
      generate: async (report: Report): Promise<void> => {
        await customOutput.default(report);
      },
    };
  },
};

export default output;
