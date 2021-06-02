import * as yup from 'yup';
import logger from '../../common/logger';

export function validateYup<T>(schema: yup.Schema<T>, value: unknown, configName: string): T | undefined {
  try {
    return schema.validateSync(value, { abortEarly: false, strict: false });
  } catch (err) {
    let error = err;

    if (err instanceof yup.ValidationError) {
      error = err.errors;
    }

    logger.error(`Validation error in ${configName} config`, error);
  }

  return undefined;
}
