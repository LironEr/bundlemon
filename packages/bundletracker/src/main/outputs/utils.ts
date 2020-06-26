import * as bytes from 'bytes';
import { NormalizedConfig } from '../types';

export function parseOutput(output: NormalizedConfig['reportOutput'][0]): { name: string; options: unknown } {
  if (Array.isArray(output)) {
    return { name: output?.[0], options: output?.[1] };
  }

  return { name: output, options: undefined };
}

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
