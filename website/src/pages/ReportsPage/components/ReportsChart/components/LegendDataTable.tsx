import { useMemo } from 'react';
import { observer } from 'mobx-react-lite';
import bytes from 'bytes';
import ColorCell from './ColorCell';
import PathCell from '@/components/PathCell';
import { MRT_ColumnDef } from 'material-react-table';
import Table from '@/components/Table';

import type { PathRecord } from '../../types';
import type ReportsStore from '../ReportsStore';

interface LegendDataTableProps {
  store: ReportsStore;
}

const LegendDataTable = observer(({ store }: LegendDataTableProps) => {
  const columns = useMemo<MRT_ColumnDef<PathRecord>[]>(
    () => [
      {
        header: '',
        accessorKey: 'color',
        Cell: ({ cell }) => <ColorCell color={cell.getValue<string>()} />,
        enableSorting: false,
        enableColumnActions: false,
        enableColumnFilter: false,
        maxSize: 14,
      },
      {
        header: 'Path',
        accessorKey: 'path',
        Cell: ({ row }) => <PathCell file={row.original} />,
      },
      {
        header: 'Min Size',
        accessorKey: 'minSize',
        Cell: ({ cell }) => sizeToText(cell.getValue<number>()),
        enableColumnActions: false,
        enableColumnFilter: false,
      },
      {
        header: 'Max Size',
        accessorKey: 'maxSize',
        Cell: ({ cell }) => sizeToText(cell.getValue<number>()),
        enableColumnActions: false,
        enableColumnFilter: false,
      },
      {
        header: 'Latest Size',
        accessorKey: 'latestSize',
        Cell: ({ cell }) => sizeToText(cell.getValue<number>()),
        enableColumnActions: false,
        enableColumnFilter: false,
      },
    ],
    []
  );

  return (
    <Table
      columns={columns}
      data={store.pathRecords}
      maxHeight={250}
      enableRowSelection
      getRowId={(row) => row.path}
      onRowSelectionChange={store.setRowSelection}
      state={{ rowSelection: store.rowSelectionState }}
      //clicking anywhere on the row will select it
      muiTableBodyRowProps={({ row }) => ({
        onClick: row.getToggleSelectedHandler(),
        sx: {
          cursor: 'pointer',
          '&.Mui-selected': {
            backgroundColor: 'inherit',
          },
        },
      })}
    />
  );
});

export default LegendDataTable;

function sizeToText(size?: number) {
  return size ? bytes(size) : '-';
}
