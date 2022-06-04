export interface PathRecord {
  friendlyName?: string;
  path: string;
  color: string;
  minSize: number;
  maxSize: number;
  isSelected: boolean;
  latestSize?: number;
}
