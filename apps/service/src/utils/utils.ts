export function roundDecimals(num: number, decimals: number) {
  return Number(Math.round(Number(num + 'e' + decimals)) + 'e-' + decimals);
}
