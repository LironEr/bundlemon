import { useMemo, useState } from 'react';
import styled from '@emotion/styled';
import { Alert, CircularProgress, Paper, Tab } from '@mui/material';
import { TabList, TabPanel, TabContext } from '@mui/lab';
import { CellProps } from 'react-table';
import { useQuery } from 'react-query';
import { useParams } from 'react-router';
import bytes from 'bytes';
import { getLimitsCellText } from 'bundlemon-utils/lib/esm/textUtils';
import { getReport } from '@/services/bundlemonService';
import FetchError from '@/services/FetchError';
import Table, { Column } from '@/components/Table';
import { StatusCell, PathCell, ChangeSizeCell } from './components';

import type { Report, FileDetailsDiff } from 'bundlemon-utils';

const Container = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  align-self: center;
  margin: 0 auto;
  width: 100%;
`;

const TableContainer = styled(Paper)`
  width: 100%;
  padding: ${({ theme }) => theme.spacing(2)};
`;

const ReportPage = () => {
  const { projectId, reportId } = useParams<{ projectId: string; reportId: string }>();
  const {
    isLoading,
    data: report,
    error,
  } = useQuery<Report, FetchError>(['projects', projectId, 'reports', reportId], () => getReport(projectId, reportId));
  const [currTab, setCurrTab] = useState<'files' | 'groups'>('files');

  const handleTabChange = (_event: React.SyntheticEvent, newTag: 'files' | 'groups') => {
    setCurrTab(newTag);
  };

  const columns = useMemo<Column<FileDetailsDiff>[]>(
    () => [
      {
        Header: 'Status',
        accessor: 'status',
        Cell: StatusCell,
      },
      {
        Header: 'State',
        // @ts-expect-error
        accessor: 'diff.change',
        Cell: ({ value }: CellProps<FileDetailsDiff>) => value,
      },
      {
        Header: 'Path',
        accessor: 'path',
        Cell: PathCell,
      },
      {
        id: 'size',
        Header: 'Size',
        accessor: 'size',
        Cell: ({ value }) => (value ? bytes(value) : '-'),
      },
      {
        id: 'changeSize',
        Header: 'Change size',
        // @ts-expect-error
        accessor: 'diff.bytes',
        Cell: ChangeSizeCell,
      },
      {
        Header: 'Limits',
        Cell: ({ row }: CellProps<FileDetailsDiff>) => getLimitsCellText(row.original),
        disableSortBy: true,
      },
    ],
    []
  );

  if (isLoading) {
    return (
      <Container>
        <CircularProgress />
      </Container>
    );
  }

  if (error) {
    return (
      <Container>
        <Alert severity="error">{error.message}</Alert>
      </Container>
    );
  }

  if (!report) {
    return <Alert severity="error">Missing report</Alert>;
  }

  return (
    <TableContainer>
      <TabContext value={currTab}>
        <TabList onChange={handleTabChange}>
          <Tab label="Files" value="files" />
          <Tab label="Groups" value="groups" />
        </TabList>
        <TabPanel value="files">
          <Table columns={columns} data={report.files} />
        </TabPanel>
        <TabPanel value="groups">
          <Table columns={columns} data={report.groups} />
        </TabPanel>
      </TabContext>
    </TableContainer>
  );
};

export default ReportPage;
