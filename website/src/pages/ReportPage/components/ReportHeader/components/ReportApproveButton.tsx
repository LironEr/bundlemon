import { observer } from 'mobx-react-lite';
import { Report, Status } from 'bundlemon-utils';
import { Button, Tooltip } from '@mui/material';
import { approveCommitRecord } from '@/services/bundlemonService';
import { useSnackbar } from 'notistack';
import { userStore } from '@/stores/UserStore';

interface ReportApproveButtonProps {
  report: Report;
  setReport: (r: Report) => void;
}

const ReportApproveButton = observer(({ report, setReport }: ReportApproveButtonProps) => {
  const { enqueueSnackbar } = useSnackbar();

  const isLoggedIn = !!userStore.user;
  const approvers = report.metadata.record?.approvers;
  const isApprovedByMe =
    isLoggedIn &&
    !!approvers?.find(
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      (a) => a.approver.provider === userStore.user!.provider && a.approver.name === userStore.user!.name
    );

  if (report.status === Status.Pass && !approvers?.length) {
    return null;
  }

  const handleClick = async () => {
    if (!report.metadata.record) {
      enqueueSnackbar('missing record data', { variant: 'error' });
      return;
    }

    const { projectId, id: commitRecordId } = report.metadata.record;
    try {
      if (isApprovedByMe) {
        enqueueSnackbar('Will be implemented soon...', { variant: 'info' });
      } else {
        const r = await approveCommitRecord(projectId, commitRecordId);

        enqueueSnackbar('Approved', { variant: 'success' });
        setReport(r);
      }
    } catch (ex) {
      enqueueSnackbar((ex as Error).message, { variant: 'error' });
    }
  };

  const button = (
    <Button
      onClick={handleClick}
      disabled={!isLoggedIn}
      variant="outlined"
      color={isApprovedByMe ? 'error' : 'success'}
      size="small"
    >
      {isApprovedByMe ? 'Disapprove' : 'Approve'}
    </Button>
  );

  if (isLoggedIn) {
    return button;
  }

  return (
    <Tooltip title="Login required">
      <div>{button}</div>
    </Tooltip>
  );
});

export default ReportApproveButton;
