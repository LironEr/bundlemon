import { makeStyles } from '@material-ui/core/styles';
import Alert from '@material-ui/lab/Alert';
import { Report, Status, textUtils } from 'bundlemon-utils';

const useStyles = makeStyles(() => ({
  root: {
    width: '100%',
  },
}));

interface ReportSummaryProps {
  report: Report;
}

const ReportSummary = ({ report }: ReportSummaryProps) => {
  const classes = useStyles();

  const isPass = report.status === Status.Pass;

  return (
    <div className={classes.root}>
      <Alert severity={isPass ? 'success' : 'error'}>{textUtils.getReportConclusionText(report)}</Alert>
    </div>
  );
};

export default ReportSummary;
