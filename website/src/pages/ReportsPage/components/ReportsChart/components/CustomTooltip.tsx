import { observer } from 'mobx-react-lite';
import styled from '@emotion/styled';
import { TooltipProps } from 'recharts';
import { CommitRecord } from 'bundlemon-utils';
import { Paper, Stack } from '@mui/material';
import bytes from 'bytes';

const Container = styled(Paper)`
  padding: ${({ theme }) => theme.spacing(2)};
  min-width: 300px;
`;

const Title = styled.span`
  font-weight: 700;
`;

const CommitMsgText = styled.span`
  font-weight: 500;
  overflow: hidden;
  white-space: wrap;
  max-width: 300px;
`;

const CustomTooltip = observer(({ active, payload }: TooltipProps) => {
  if (!active) {
    return null;
  }

  const commitRecord: CommitRecord | undefined = payload?.[0].payload;

  if (!commitRecord) {
    return null;
  }

  return (
    <Container>
      <Stack rowGap={1}>
        <Title>{new Date(commitRecord.creationDate).toLocaleString()}</Title>
        {commitRecord.commitMsg && <CommitMsgText>{commitRecord.commitMsg}</CommitMsgText>}
        {payload?.map((p) => (
          <span key={p.name} style={{ color: p.color }}>
            <b>{p.name}</b>: {bytes(p.value as number)}
          </span>
        ))}
      </Stack>
    </Container>
  );
});

export default CustomTooltip;
