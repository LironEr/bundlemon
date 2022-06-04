import styled from '@emotion/styled';

import type { CellProps } from 'react-table';
import type { FileDetailsDiff } from 'bundlemon-utils';
import type { PathRecord } from '@/pages/ReportsPage/components/types';

const Container = styled.div`
  max-width: 300px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  direction: rtl;
  text-align: left;
`;

const PathCell = ({ row: { original: file } }: CellProps<FileDetailsDiff | PathRecord>) => {
  return (
    <Container title={file.path}>
      {file.friendlyName ? (
        <>
          {file.friendlyName}
          <br />
          {file.path}
        </>
      ) : (
        file.path
      )}
    </Container>
  );
};

export default PathCell;
