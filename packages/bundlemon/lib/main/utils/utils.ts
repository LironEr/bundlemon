export const getEnvVar = (name: string): string | undefined => {
  const value = process.env[name];

  // Convert empty string to undefined
  return value || undefined;
};

type ObjectFromList<T extends ReadonlyArray<string>> = {
  [K in T extends ReadonlyArray<infer U> ? U : never]: string | undefined;
};

export function envVarsListToObject<T extends ReadonlyArray<string>>(envVars: T): ObjectFromList<T> {
  return envVars.reduce(
    (acc, envVar) => {
      acc[envVar] = getEnvVar(envVar);
      return acc;
    },
    {} as Record<string, string | undefined>
  ) as ObjectFromList<T>;
}
