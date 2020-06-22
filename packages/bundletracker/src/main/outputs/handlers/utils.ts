import * as bytes from 'bytes';

function getSignText(num: number): string {
  return num > 0 ? '+' : '';
}

export function getDiffSizeText(size: number): string {
  return `${getSignText(size)}${bytes(size)}`;
}

export function getDiffPercentText(percent: number | null): string {
  if (percent === null) {
    return '';
  }

  return `${getSignText(percent)}${percent}%`;
}
