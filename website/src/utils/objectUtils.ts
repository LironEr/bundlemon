export function removeEmptyValuesFromObject(obj: Record<string, any>) {
  const newObj = { ...obj };

  for (const key in newObj) {
    if (!newObj[key]) {
      delete newObj[key];
    }
  }

  return newObj;
}
