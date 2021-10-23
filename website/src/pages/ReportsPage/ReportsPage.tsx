import styled from '@emotion/styled';
import { GetCommitRecordsQuery } from '@/services/bundlemonService';
import { useHistory, useParams } from 'react-router';
import { useQueryParams } from '@/hooks';
import { CommitRecordsQueryResolution } from '@/consts/commitRecords';
import QueryParamsForm from './components/QueryParamsForm';
import ReportsResult from './components/ReportsResult';
import { Stack } from '@mui/material';

const Container = styled(Stack)`
  display: flex;
  flex-direction: column;
  align-items: center;
  align-self: center;
  margin: 0 auto;
  width: 100%;
`;

const ReportsPage = () => {
  const { projectId } = useParams<{ projectId: string }>();
  const query = useQueryParams();
  const history = useHistory();

  const getCommitRecordsQuery: GetCommitRecordsQuery = {
    branch: query.get('branch') || 'master',
    resolution: (query.get('resolution') as CommitRecordsQueryResolution | null) || CommitRecordsQueryResolution.Days,
  };

  const setGetCommitRecordsQuery = (params: GetCommitRecordsQuery) => {
    history.push({ pathname: history.location.pathname, search: `?${new URLSearchParams(params as any)}` });
  };

  return (
    <Container spacing={2}>
      <QueryParamsForm setParams={setGetCommitRecordsQuery} params={getCommitRecordsQuery} />
      <ReportsResult projectId={projectId} query={getCommitRecordsQuery} />
    </Container>
  );
};

export default ReportsPage;
