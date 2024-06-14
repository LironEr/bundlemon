import * as yup from 'yup';
import logger from '../../common/logger';

export function validateYup<T, U>(
  schema: yup.SchemaOf<T, U>,
  value: unknown,
  configName: string
): yup.Asserts<typeof schema> | undefined {
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
