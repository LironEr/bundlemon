import { observer } from 'mobx-react-lite';
import { CommitRecordReview } from 'bundlemon-utils';
import { capitalize } from '@mui/material';

interface ReviewRecordProps {
  review: CommitRecordReview;
}

const ReviewRecord = observer(
  ({
    review: {
      user: { name },
      createdAt,
      resolution,
    },
  }: ReviewRecordProps) => {
    return (
      <div>
        {capitalize(resolution)} by <b>{name}</b> at {new Date(createdAt).toLocaleString()}
      </div>
    );
  }
);

export default ReviewRecord;
