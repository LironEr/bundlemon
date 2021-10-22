/* eslint-disable react/jsx-key */
import TableCell from '@mui/material/TableCell';
import MuiTableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import TableSortLabel from '@mui/material/TableSortLabel';
import { HeaderGroup, UseSortByColumnProps } from 'react-table';

interface TableHeadProps<D extends Record<string, unknown> = Record<string, unknown>> {
  headerGroups: EnhancedHeaderGroup<D>[];
}

export interface EnhancedHeaderGroup<D extends Record<string, unknown> = Record<string, unknown>>
  extends HeaderGroup<D>,
    UseSortByColumnProps<D> {
  headers: EnhancedHeaderGroup<D>[];
}

const TableHead = <D extends Record<string, unknown> = Record<string, unknown>>({
  headerGroups,
}: TableHeadProps<D>) => {
  return (
    <MuiTableHead>
      {headerGroups.map((headerGroup) => (
        <TableRow {...headerGroup.getHeaderGroupProps()}>
          {headerGroup.headers.map((column: EnhancedHeaderGroup<D>) => (
            <TableCell {...column.getHeaderProps(column.getSortByToggleProps())}>
              {column.render('Header')}
              <TableSortLabel
                active={column.isSorted}
                // TODO: react-table has a unsorted state which is not treated here
                direction={column.isSortedDesc ? 'desc' : 'asc'}
              />
            </TableCell>
          ))}
        </TableRow>
      ))}
    </MuiTableHead>
  );
};

export default TableHead;
