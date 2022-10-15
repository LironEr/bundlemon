import styled from '@emotion/styled';
import { textEllipsis } from '@/utils/textUtils';

import type { FileDetailsDiff } from 'bundlemon-utils';
import type { PathRecord } from '@/pages/ReportsPage/components/types';

const Container = styled.div`
  max-width: 300px;
`;

interface PathCellProps {
  file: FileDetailsDiff | PathRecord;
}

const PathCell = ({ file }: PathCellProps) => {
  const path = <span title={file.path}>{textEllipsis(file.path, 45)}</span>;

  return (
    <Container>
      {file.friendlyName ? (
        <>
          {file.friendlyName}
          <br />
          {path}
        </>
      ) : (
        path
      )}
    </Container>
  );
};

export default PathCell;
