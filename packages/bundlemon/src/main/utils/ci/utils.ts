export const getEnvVar = (name: string): string | undefined => {
  const value = process.env[name];

  // Convert empty string to undefined
  return value || undefined;
};
