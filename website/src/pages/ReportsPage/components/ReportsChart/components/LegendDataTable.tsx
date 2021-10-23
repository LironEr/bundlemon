import { useMemo } from 'react';
import { observer } from 'mobx-react-lite';
import Table, { Column } from '@/components/Table';
import { Checkbox } from '@mui/material';
import bytes from 'bytes';
import ColorCell from './ColorCell';

import type { CellProps } from 'react-table';
import type { PathRecord } from '../../types';
import type ReportsStore from '../ReportsStore';

interface LegendDataTableProps {
  store: ReportsStore;
}

const LegendDataTable = observer(({ store }: LegendDataTableProps) => {
  const columns = useMemo<Column<PathRecord>[]>(
    () => [
      {
        id: 'selection',
        Header: observer(() => <Checkbox checked={store.isAllSelected} onClick={() => store.toggleAllSelection()} />),
        Cell: observer(({ row }: CellProps<PathRecord>) => (
          <Checkbox checked={row.original.isSelected} onClick={() => store.toggleRowSelection(row.index)} />
        )),
      },
      {
        accessor: 'color',
        Cell: ColorCell,
        disableSortBy: true,
      },
      {
        Header: 'Path',
        accessor: 'path',
      },
      {
        id: 'minSize',
        Header: 'Min Size',
        accessor: 'minSize',
        Cell: ({ value }) => bytes(value),
      },
      {
        id: 'maxSize',
        Header: 'Max Size',
        accessor: 'maxSize',
        Cell: ({ value }) => bytes(value),
      },
      {
        id: 'latestSize',
        Header: 'Latest Size',
        accessor: 'latestSize',
        Cell: ({ value }) => (value ? bytes(value) : '-'),
      },
    ],
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  );

  return <Table columns={columns} data={store.pathRecords} maxHeight={250} />;
});

export default LegendDataTable;
