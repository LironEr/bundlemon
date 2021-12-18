import styled from '@emotion/styled';
import type { CellProps } from 'react-table';
import type { FileDetailsDiff } from 'bundlemon-utils';

const Container = styled.div`
  max-width: '300px';
  white-space: 'nowrap';
  overflow: 'hidden';
  text-overflow: 'ellipsis';
  direction: 'rtl';
  text-align: 'left';
`;

const PathCell = ({ value }: CellProps<FileDetailsDiff, FileDetailsDiff['path']>) => {
  return <Container title={value}>{value}</Container>;
};

export default PathCell;
