import * as yup from 'yup';
import logger from '../../common/logger';

export function validateYup<T>(schema: yup.Schema<T>, value: T, configName: string): asserts value is T {
  try {
    schema.validateSync(value, { abortEarly: false, strict: true });
  } catch (err) {
    let error = err;

    if (err instanceof yup.ValidationError) {
      error = err.errors;
    }

    logger.error(`Validation error in ${configName} config`, error);

    process.exit(1);
  }
}
