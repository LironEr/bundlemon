import { useMemo } from 'react';
import { observer } from 'mobx-react-lite';
import { MRT_ColumnDef } from 'material-react-table';
import { DiffChange, FileDetailsDiff, getLimitsCellText, Status } from 'bundlemon-utils';
import { StatusCell, ChangeSizeCell } from './components';
import PathCell from '@/components/PathCell';
import bytes from 'bytes';
import Table from '@/components/Table';

interface ReportTableProps {
  data: FileDetailsDiff[];
}

const ReportTable = observer(({ data }: ReportTableProps) => {
  const columns = useMemo<MRT_ColumnDef<FileDetailsDiff>[]>(
    () => [
      {
        header: 'Status',
        accessorKey: 'status',
        Cell: ({ cell }) => <StatusCell status={cell.getValue<Status>()} />,
        filterVariant: 'multi-select',
        filterSelectOptions: Object.values(Status),
      },
      {
        id: 'state',
        header: 'State',
        accessorKey: 'diff.change',
        filterVariant: 'multi-select',
        filterSelectOptions: Object.values(DiffChange),
      },
      {
        id: 'path',
        header: 'Path',
        accessorKey: 'path',
        Cell: ({ row }) => <PathCell file={row.original} />,
      },
      {
        id: 'size',
        header: 'Size',
        accessorKey: 'size',
        Cell: ({ cell }) => sizeToText(cell.getValue<number>()),
        enableColumnActions: false,
        enableColumnFilter: false,
      },
      {
        id: 'changeSize',
        header: 'Change size',
        accessorKey: 'diff.bytes',
        Cell: ({ row }) => <ChangeSizeCell file={row.original} />,
        enableColumnActions: false,
        enableColumnFilter: false,
        enableSorting: false,
      },
      {
        header: 'Limits',
        Cell: ({ row }) => getLimitsCellText(row.original),
        enableColumnActions: false,
        enableColumnFilter: false,
        enableSorting: false,
      },
    ],
    []
  );

  return <Table columns={columns} data={data} />;
});

export default ReportTable;

function sizeToText(size?: number) {
  return size ? bytes(size) : '-';
}
