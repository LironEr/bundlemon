/* eslint-disable react/display-name */
import { useMemo } from 'react';
import bytes from 'bytes';
import { FileDetailsDiff, DiffChange, textUtils } from 'bundlemon-utils';
import Table, { TableProps } from '../Table';
import { ChangePercentCell, ChangeSizeCell } from './components';

import type { MUIDataTableColumn } from 'mui-datatables';

const flatten = (obj: Record<string, any>, prefix = '', res: Record<string, any> = {}): Omit<Data, '_original'> =>
  Object.entries(obj).reduce((r, [key, val]) => {
    const k = `${prefix}${key}`;
    if (typeof val === 'object') {
      flatten(val, `${k}.`, r);
    } else {
      res[k] = val;
    }
    return r;
  }, res) as any;

type Data = {
  _original: FileDetailsDiff;
  status: FileDetailsDiff['status'];
  path: FileDetailsDiff['path'];
  size: FileDetailsDiff['size'];
  'diff.change': FileDetailsDiff['diff']['change'];
  'diff.bytes': FileDetailsDiff['diff']['bytes'];
  'diff.percent': FileDetailsDiff['diff']['percent'];
};

interface ReportTableProps {
  files: FileDetailsDiff[];
}

const ReportTable = ({ files }: ReportTableProps) => {
  const data = useMemo(() => {
    const arr: Data[] = [];

    files.forEach((f) => {
      arr.push({ _original: f, ...flatten(f) });
    });

    return arr;
  }, [files]);

  const columns = useMemo(
    (): MUIDataTableColumn[] => [
      {
        name: 'status',
        label: 'Status',
        options: {
          filter: true,
          filterType: 'dropdown',
          customFilterListOptions: {
            render: (v) => `Status: ${v}`,
          },
        },
      },
      {
        name: 'diff.change',
        label: 'Change',
        options: {
          filter: true,
          filterType: 'multiselect',
          filterList: [DiffChange.Add, DiffChange.Remove, DiffChange.Update],
          customFilterListOptions: {
            render: (v) => `Change: ${v}`,
          },
        },
      },
      {
        name: 'path',
        label: 'Path',
        options: {
          filter: true,
          filterType: 'textField',
          customFilterListOptions: {
            render: (v) => `Path: ${v}`,
          },
          customBodyRenderLite: (index) => {
            const { path } = data[index];

            return (
              <div
                style={{
                  maxWidth: '300px',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  direction: 'rtl',
                  textAlign: 'left',
                }}
                title={path}
              >
                {path}
              </div>
            );
          },
        },
      },
      {
        name: 'size',
        label: 'Size',
        options: {
          filter: false,
          customBodyRenderLite: (index) => {
            return bytes(data[index].size);
          },
        },
      },
      {
        name: 'diff.bytes',
        label: 'Change size',
        options: {
          filter: false,
          customBodyRenderLite: (index) => {
            const file = data[index]._original;

            return <ChangeSizeCell file={file} />;
          },
        },
      },
      {
        name: 'diff.percent',
        label: 'Change percent',
        options: {
          filter: false,
          customBodyRenderLite: (index) => {
            const file = data[index]._original;

            return <ChangePercentCell file={file} />;
          },
        },
      },
      {
        name: 'limits',
        label: 'Limits',
        options: {
          filter: false,
          sort: false,
          customBodyRenderLite: (index) => {
            const file = data[index]._original;

            return textUtils.getLimitsCellText(file);
          },
        },
      },
    ],
    [data]
  );

  const tableProps: TableProps = {
    title: 'Report',
    columns,
    data,
    options: {
      print: false,
      pagination: false,
      responsive: 'simple',
      selectableRows: 'none',
      fixedHeader: true,
      download: false,
      sortOrder: {
        name: 'diff.percent',
        direction: 'desc',
      },
    },
  };

  return <Table {...tableProps} />;
};

export default ReportTable;
