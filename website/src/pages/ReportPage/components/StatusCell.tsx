import { memo } from 'react';
import { Chip } from '@mui/material';
import { FileDetailsDiff, Status } from 'bundlemon-utils';
import type { CellProps } from 'react-table';

const StatusCell = memo(
  ({ value }: CellProps<FileDetailsDiff, FileDetailsDiff['status']>) => {
    return <Chip color={value === Status.Pass ? 'success' : 'error'} size="small" label={value} />;
  },
  (prevProps, nextProps) => prevProps.value === nextProps.value
);

StatusCell.displayName = 'StatusCell';

export default StatusCell;
