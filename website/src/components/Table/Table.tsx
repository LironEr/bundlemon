import { Table as MuiTable, TableContainer } from '@mui/material';
import { useGlobalFilter, useSortBy, useTable } from 'react-table';
import TableHead, { EnhancedHeaderGroup } from './components/TableHead';
import TableBody from './components/TableBody';
import { TableProps } from './types';
import { observer } from 'mobx-react-lite';

const Table = observer(
  <D extends Record<string, any> = Record<string, any>>({ columns, data, maxHeight }: TableProps<D>) => {
    const { getTableProps, headerGroups, prepareRow, rows } = useTable<D>(
      {
        columns,
        data,
      },
      useGlobalFilter,
      useSortBy
    );

    return (
      <TableContainer sx={{ maxHeight }}>
        <MuiTable {...getTableProps()} size="small" stickyHeader={!!maxHeight}>
          <TableHead headerGroups={headerGroups as EnhancedHeaderGroup<D>[]} />
          <TableBody rows={rows} prepareRow={prepareRow} />
        </MuiTable>
      </TableContainer>
    );
  }
);

export default Table;
