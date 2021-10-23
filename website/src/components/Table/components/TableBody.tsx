import { observer } from 'mobx-react-lite';
import { TableBody as MuiTableBody } from '@mui/material';
import TableRow from './TableRow';

import type { Row } from 'react-table';

interface TableBodyProps<D extends Record<string, any>> {
  rows: Row<D>[];
  prepareRow: (row: Row<D>) => void;
}

const TableBody = observer(function <D extends Record<string, any>>({ rows, prepareRow }: TableBodyProps<D>) {
  return (
    <MuiTableBody>
      {rows.map((row) => (
        <TableRow key={row.id} row={row} prepareRow={prepareRow} />
      ))}
    </MuiTableBody>
  );
});

export default TableBody;
