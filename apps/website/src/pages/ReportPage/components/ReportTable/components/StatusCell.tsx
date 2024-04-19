import { Chip } from '@mui/material';
import { Status } from 'bundlemon-utils';

interface StatusCellProps {
  status: Status;
}

const StatusCell = ({ status }: StatusCellProps) => {
  return <Chip color={status === Status.Pass ? 'success' : 'error'} size="small" label={status} />;
};

export default StatusCell;
