import { useState, useEffect } from 'react';
import styled from '@emotion/styled';
import { Alert, CircularProgress, Paper, Tabs, Tab } from '@mui/material';
import { useQuery } from 'react-query';
import { getCommitRecords, GetCommitRecordsQuery } from '@/services/bundlemonService';
import FetchError from '@/services/FetchError';
import type { CommitRecord } from 'bundlemon-utils';
import ReportsChart from './ReportsChart';
import { observer } from 'mobx-react-lite';
import ReportsStore from './ReportsChart/ReportsStore';

const Container = styled(Paper)`
  width: 100%;
  padding: ${({ theme }) => theme.spacing(2)};
`;

interface ReportsResultProps {
  projectId: string;
  query: GetCommitRecordsQuery;
}

const ReportsResult = observer(({ projectId, query }: ReportsResultProps) => {
  const [store] = useState(() => new ReportsStore());
  const {
    isLoading,
    data: commitRecords,
    error,
  } = useQuery<CommitRecord[], FetchError>(['projects', projectId, 'reports', query], () =>
    getCommitRecords(projectId, query)
  );

  useEffect(() => {
    store.setCommitRecords(commitRecords ?? []);
  }, [store, commitRecords]);

  const handleTabChange = (_event: React.SyntheticEvent, newTag: 'files' | 'groups') => {
    store.setType(newTag);
  };

  if (isLoading) {
    return <CircularProgress />;
  }

  if (error) {
    return <Alert severity="error">{error.message}</Alert>;
  }

  if (!commitRecords) {
    return <Alert severity="error">Missing results</Alert>;
  }

  if (commitRecords.length === 0) {
    return (
      <Alert severity="warning">
        No records found for project &quot;{projectId}&quot;, branch: &quot;{query.branch}&quot;
      </Alert>
    );
  }

  return (
    <Container>
      <Tabs value={store.type} onChange={handleTabChange}>
        <Tab label="Files" value="files" />
        <Tab label="Groups" value="groups" />
      </Tabs>
      <ReportsChart store={store} />
    </Container>
  );
});

export default ReportsResult;
