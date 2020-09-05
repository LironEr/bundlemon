export const getEnvVar = (name: string): string | undefined => {
  const value = process.env[name];

  return value || undefined;
};
