import { useEffect, useMemo, useState } from 'react';
import styled from '@emotion/styled';
import { Alert, CircularProgress, Paper } from '@mui/material';
import { TabList, TabPanel, TabContext } from '@mui/lab';
import { CellProps } from 'react-table';
import { useQuery } from 'react-query';
import { useParams } from 'react-router';
import bytes from 'bytes';
import { getLimitsCellText, Status } from 'bundlemon-utils';
import { getReport } from '@/services/bundlemonService';
import FetchError from '@/services/FetchError';
import Table, { Column } from '@/components/Table';
import { StatusCell, ChangeSizeCell, TabTitle } from './components';
import PathCell from '@/components/PathCell';
import ReportHeader from './components/ReportHeader';

import type { Report, FileDetailsDiff } from 'bundlemon-utils';

const Container = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  align-self: center;
  margin: 0 auto;
  width: 100%;
`;

const ContentContainer = styled(Paper)`
  width: 100%;
  padding: ${({ theme }) => theme.spacing(2)};
`;

const ReportPage = () => {
  const { projectId, reportId } = useParams() as { projectId: string; reportId: string };
  const [report, setReport] = useState<Report | undefined>(undefined);

  const { isLoading, data, error } = useQuery<Report, FetchError>(['projects', projectId, 'reports', reportId], () =>
    getReport(projectId, reportId)
  );

  const [currTab, setCurrTab] = useState<'files' | 'groups'>('files');

  useEffect(() => {
    setReport(data);
  }, [data]);

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
        id: 'path',
        Header: 'Path',
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

  const filesLimitCount = report.files.filter((x) => x.status === Status.Fail).length;
  const groupsLimitCount = report.groups.filter((x) => x.status === Status.Fail).length;

  return (
    <ContentContainer>
      <ReportHeader report={report} setReport={setReport} />
      <TabContext value={currTab}>
        <TabList onChange={handleTabChange}>
          <TabTitle value="files" label="Files" failsCount={filesLimitCount} />
          <TabTitle value="groups" label="Groups" failsCount={groupsLimitCount} />
        </TabList>
        <TabPanel value="files">
          <Table columns={columns} data={report.files} />
        </TabPanel>
        <TabPanel value="groups">
          <Table columns={columns} data={report.groups} />
        </TabPanel>
      </TabContext>
    </ContentContainer>
  );
};

export default ReportPage;
