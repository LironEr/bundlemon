import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import IconButton from '@mui/material/IconButton';
import CloseIcon from '@mui/icons-material/Close';
import { useState } from 'react';
import { FormControl, FormControlLabel, Radio, RadioGroup, Tooltip, useMediaQuery } from '@mui/material';
import { CommitRecordReviewResolution, Report } from 'bundlemon-utils';
import { LoadingButton } from '@mui/lab';
import { useSnackbar } from 'notistack';
import { reviewCommitRecord } from '@/services/bundlemonService';
import { userStore } from '@/stores/UserStore';
import { useTheme } from '@emotion/react';

export interface ModalTitleProps {
  children?: React.ReactNode;
  onClose: () => void;
}

const ModalTitle = (props: ModalTitleProps) => {
  const { children, onClose } = props;

  return (
    <DialogTitle sx={{ m: 0, p: 2 }}>
      {children}
      {onClose ? (
        <IconButton
          aria-label="close"
          onClick={onClose}
          sx={{
            position: 'absolute',
            right: 8,
            top: 8,
            color: (theme) => theme.palette.grey[500],
          }}
        >
          <CloseIcon />
        </IconButton>
      ) : null}
    </DialogTitle>
  );
};

interface ReviewReportModalProps {
  report: Report;
  setReport: (r: Report) => void;
}

export default function ReviewReportModal({ report, setReport }: ReviewReportModalProps) {
  const { enqueueSnackbar } = useSnackbar();
  const [isLoading, setIsLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [action, setAction] = useState(CommitRecordReviewResolution.Approved);
  const theme = useTheme();
  const openInFullScreen = useMediaQuery(theme.breakpoints.down('sm'));
  const isLoggedIn = !!userStore.user;

  const handleClickOpen = () => {
    setOpen(true);
  };
  const handleClose = () => {
    setOpen(false);
  };

  const handleSubmit = async () => {
    if (!report.metadata.record) {
      enqueueSnackbar('missing record data', { variant: 'error' });
      return;
    }

    const { projectId, id: commitRecordId } = report.metadata.record;

    try {
      setIsLoading(true);

      const r = await reviewCommitRecord(projectId, commitRecordId, action, '');

      enqueueSnackbar('Review successfully created', { variant: 'success' });
      setReport(r);
      handleClose();
    } catch (ex) {
      enqueueSnackbar((ex as Error).message, { variant: 'error' });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div>
      <Tooltip title={isLoggedIn ? 'Add your review' : 'Login required'}>
        <div>
          <Button variant="outlined" onClick={handleClickOpen} disabled={!isLoggedIn}>
            Review
          </Button>
        </div>
      </Tooltip>
      <Dialog onClose={isLoading ? undefined : handleClose} open={open} fullScreen={openInFullScreen} maxWidth="md">
        <ModalTitle onClose={handleClose}>Review</ModalTitle>
        <DialogContent dividers>
          <FormControl>
            <RadioGroup
              name="action"
              value={action}
              onChange={(e) => {
                setAction(e.target.value as CommitRecordReviewResolution);
              }}
            >
              <ReviewResolutionOption
                resolution={CommitRecordReviewResolution.Approved}
                label="Approve"
                description="Mark the report as passing, even if one of the limits exceeded"
              />
              <ReviewResolutionOption
                resolution={CommitRecordReviewResolution.Rejected}
                label="Reject"
                description="Mark the report as failing, even if no limits exceeded"
              />
              <ReviewResolutionOption
                resolution={CommitRecordReviewResolution.Reset}
                label="Reset"
                description="Mark the report in accordance to the overall pass/failure of the limits (back to the default status)"
              />
            </RadioGroup>
          </FormControl>
        </DialogContent>
        <DialogActions>
          <LoadingButton loading={isLoading} onClick={handleSubmit}>
            Submit
          </LoadingButton>
        </DialogActions>
      </Dialog>
    </div>
  );
}

interface ReviewResolutionOptionProps {
  label: string;
  resolution: CommitRecordReviewResolution;
  description: string;
}

const ReviewResolutionOption = ({ label, resolution, description }: ReviewResolutionOptionProps) => {
  return (
    <FormControlLabel
      value={resolution}
      control={<Radio />}
      label={
        <>
          <b>{label}</b>
          <br />
          {description}
        </>
      }
    />
  );
};
