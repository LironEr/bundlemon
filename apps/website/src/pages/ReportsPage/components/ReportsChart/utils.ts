import bytes from 'bytes';

import type { CommitRecord } from 'bundlemon-utils';

export const stringToColor = function (str: string): string {
  let hash = 0;

  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }

  let color = '#';
  for (let i = 0; i < 3; i++) {
    const value = (hash >> (i * 8)) & 0xff;
    color += ('00' + value.toString(16)).substr(-2);
  }
  return color;
};

export const getVal =
  (path: string, type: 'files' | 'groups') =>
  (value: CommitRecord): number | undefined =>
    value[type].find((f) => f.path === path)?.size;

export const bytesTickFormatter = (value: number) => bytes(value);
export const dateTickFormatter = (value: string) => new Date(value).toLocaleDateString();
