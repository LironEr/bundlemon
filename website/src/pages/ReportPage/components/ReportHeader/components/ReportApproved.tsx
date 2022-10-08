import { observer } from 'mobx-react-lite';
import { CommitRecordApprover } from 'bundlemon-utils';

interface ReportApprovedProps {
  approver: CommitRecordApprover;
}

const ReportApproved = observer(
  ({
    approver: {
      approver: { name },
      approveDate,
    },
  }: ReportApprovedProps) => {
    return (
      <div>
        Approved by <b>{name}</b> at {new Date(approveDate).toLocaleString()}
      </div>
    );
  }
);

export default ReportApproved;
