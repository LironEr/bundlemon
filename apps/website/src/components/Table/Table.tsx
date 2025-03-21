import { observer } from 'mobx-react-lite';
import { MaterialReactTable, MRT_TableOptions } from 'material-react-table';

interface TableProps<D extends Record<string, any> = Record<string, any>> extends MRT_TableOptions<D> {
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
