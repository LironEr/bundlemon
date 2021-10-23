import { TableCell, TableRow as MuiTableRow } from '@mui/material';
import { Row, UseTableInstanceProps } from 'react-table';
import { observer } from 'mobx-react-lite';

interface TableRowProps<D extends Record<string, any>> {
  row: Row<D>;
  prepareRow: UseTableInstanceProps<D>['prepareRow'];
}

const TableRow = observer(function <D extends Record<string, any>>({ row, prepareRow }: TableRowProps<D>) {
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

export default TableRow;
