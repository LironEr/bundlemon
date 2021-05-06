/* eslint-disable react/display-name */
import { useMemo } from 'react';
import bytes from 'bytes';
import { MUIDataTableColumn } from 'mui-datatables';
import { createMuiTheme, MuiThemeProvider } from '@material-ui/core/styles';
import Table, { TableProps } from '../../Table';
import Icon from './Icon';

const muiTheme = createMuiTheme({
  overrides: {
    MuiTableCell: {
      root: {
        padding: 0,
      },
    },
  },
});

export type Row = {
  path: string;
  color: string;
  minSize: number;
  maxSize: number;
  latestSize?: number;
};

interface LegendDataTableProps {
  data: Row[];
  selectedIndexes: number[];
  setSelectedIndexes: (indexes: number[]) => void;
  setVisibleIndexes: (indexes: number[]) => void;
}

const LegendDataTable = ({ data, selectedIndexes, setSelectedIndexes, setVisibleIndexes }: LegendDataTableProps) => {
  const columns = useMemo(
    (): MUIDataTableColumn[] => [
      {
        name: 'color',
        label: ' ',
        options: {
          filter: false,
          customBodyRenderLite: (index) => {
            return <Icon color={data[index].color} />;
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
        name: 'minSize',
        label: 'Min',
        options: {
          filter: false,
          customBodyRenderLite: (index) => {
            return bytes(data[index].minSize);
          },
        },
      },
      {
        name: 'maxSize',
        label: 'Max',
        options: {
          filter: false,
          customBodyRenderLite: (index) => {
            return bytes(data[index].maxSize);
          },
        },
      },
      {
        name: 'latestSize',
        label: 'Latest',
        options: {
          filter: false,
          customBodyRenderLite: (index) => {
            const size = data[index]?.latestSize;

            return size ? bytes(size) : '-';
          },
        },
      },
    ],
    [data]
  );

  const tableProps: TableProps = {
    columns,
    data,
    options: {
      print: false,
      pagination: false,
      responsive: 'simple',
      selectableRows: 'multiple',
      fixedHeader: true,
      download: false,
      sortOrder: {
        name: 'path',
        direction: 'desc',
      },
      tableBodyMaxHeight: '200px',
      elevation: 0,
      selectToolbarPlacement: 'none',
      rowsSelected: selectedIndexes,
      selectableRowsOnClick: true,
      search: false,
      viewColumns: false,
      onTableChange: (action, { displayData, selectedRows }) => {
        if (action === 'rowSelectionChange') {
          // @ts-ignore
          setSelectedIndexes(selectedRows.data.map(({ dataIndex }) => dataIndex));
        } else if (action === 'filterChange') {
          setVisibleIndexes(displayData.map(({ dataIndex }) => dataIndex));
        }
      },
    },
  };

  return (
    <MuiThemeProvider theme={muiTheme}>
      <Table {...tableProps} />
    </MuiThemeProvider>
  );
};

export default LegendDataTable;
