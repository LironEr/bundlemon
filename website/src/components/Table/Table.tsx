import { memo } from 'react';
import { Table as MuiTable, TableContainer, TableBody, TableCell, TableRow as MuiTableRow } from '@mui/material';
import { useGlobalFilter, useSortBy, useTable, Row, UseTableInstanceProps } from 'react-table';
import TableHead, { EnhancedHeaderGroup } from './components/TableHead';
import { TableProps } from './types';

const Table = <D extends Record<string, any> = Record<string, any>>({ columns, data }: TableProps<D>) => {
  const { getTableProps, headerGroups, prepareRow, rows } = useTable<D>(
    {
      columns,
      data,
    },
    useGlobalFilter,
    useSortBy
  );

  return (
    <TableContainer>
      <MuiTable {...getTableProps()}>
        <TableHead headerGroups={headerGroups as EnhancedHeaderGroup<D>[]} />
        <TableBody>
          {rows.map((row) => (
            // @ts-expect-error
            <TableRow key={row.id} row={row} prepareRow={prepareRow} />
          ))}
        </TableBody>
      </MuiTable>
    </TableContainer>
  );
};

export default Table;

interface TableRowProps<D extends Record<string, unknown>> {
  row: Row<D>;
  prepareRow: UseTableInstanceProps<D>['prepareRow'];
}

const TableRow = memo(function <D extends Record<string, unknown>>({ row, prepareRow }: TableRowProps<D>) {
  prepareRow(row);

  return (
    <MuiTableRow {...row.getRowProps()}>
      {row.cells.map((cell) => {
        // eslint-disable-next-line react/jsx-key
        return <TableCell {...cell.getCellProps()}>{cell.render('Cell')}</TableCell>;
      })}
    </MuiTableRow>
  );
});

TableRow.displayName = 'TableRow';
