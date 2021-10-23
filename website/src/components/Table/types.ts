import { Column as RTColumn, UseSortByOptions } from 'react-table';

export type Column<D extends Record<string, any> = Record<string, any>> = RTColumn<D> & UseSortByOptions<D>;

export interface TableProps<D extends Record<string, any> = Record<string, any>> {
  columns: Column<D>[];
  data: D[];
  maxHeight?: number;
}
