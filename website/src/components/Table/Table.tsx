import { observer } from 'mobx-react-lite';
import MaterialReactTable, { MaterialReactTableProps } from 'material-react-table';

interface TableProps<D extends Record<string, any> = Record<string, any>> extends MaterialReactTableProps<D> {
  maxHeight?: number;
}

const Table = observer(
  <D extends Record<string, any> = Record<string, any>>({ maxHeight, initialState, ...rest }: TableProps<D>) => {
    return (
      <MaterialReactTable
        enablePagination={false}
        enableDensityToggle={false}
        enableTopToolbar={false}
        enableBottomToolbar={false}
        enableHiding={false}
        enableTableFooter={false}
        enableStickyHeader
        initialState={{
          density: 'compact',
          pagination: {
            pageSize: 10000,
            pageIndex: 0,
          },
          ...initialState,
        }}
        muiTableContainerProps={{ sx: { maxHeight } }}
        {...rest}
      />
    );
  }
);

export default Table;
