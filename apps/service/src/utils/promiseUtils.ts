// tasks: Record<string, Promise<T>>
export async function promiseAllObject<T>(tasks: any) {
  const items = await Promise.all(
    Object.keys(tasks).map(async (key) => {
      const val = await Promise.resolve(tasks[key]);

      return { key, val };
    })
  );

  const result: Record<keyof typeof tasks, T> = {};

  items.forEach((item) => {
    result[item.key] = item.val;
  });

  return result;
}
