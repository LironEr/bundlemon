import styled from '@emotion/styled';
import { GetCommitRecordsQuery } from '@/services/bundlemonService';
import { useNavigate, useParams } from 'react-router';
import { useQueryParams } from '@/hooks';
import { CommitRecordsQueryResolution } from '@/consts/commitRecords';
import { removeEmptyValuesFromObject } from '@/utils/objectUtils';
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
  const { projectId } = useParams() as { projectId: string };
  const query = useQueryParams();
  const navigate = useNavigate();

  const getCommitRecordsQuery: GetCommitRecordsQuery = {
    subProject: query.get('subProject') ?? undefined,
    branch: query.get('branch') || 'master',
    resolution: (query.get('resolution') as CommitRecordsQueryResolution | null) || CommitRecordsQueryResolution.Days,
  };

  const setGetCommitRecordsQuery = (params: GetCommitRecordsQuery) => {
    navigate({
      search: `?${new URLSearchParams(removeEmptyValuesFromObject(params))}`,
    });
  };

  return (
    <Container spacing={2}>
      <QueryParamsForm projectId={projectId} setParams={setGetCommitRecordsQuery} params={getCommitRecordsQuery} />
      <ReportsResult projectId={projectId} query={getCommitRecordsQuery} />
    </Container>
  );
};

export default ReportsPage;
