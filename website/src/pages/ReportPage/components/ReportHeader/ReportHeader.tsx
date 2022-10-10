import { observer } from 'mobx-react-lite';
import { getReportConclusionText, Report, Status } from 'bundlemon-utils';
import { Alert, AlertColor } from '@mui/material';
import { ReviewReportModal, ReviewRecord } from './components';

interface ReportHeaderProps {
  report: Report;
  setReport: (r: Report) => void;
}

const ReportHeader = observer(({ report, setReport }: ReportHeaderProps) => {
  const conclusionText = getReportConclusionText(report);
  let severity: AlertColor = 'info';

  if (report.status === Status.Fail) {
    severity = 'error';
  } else if (report.status === Status.Pass) {
    if (report.metadata.record?.reviews?.length) {
      severity = 'warning';
    } else {
      severity = 'success';
    }
  }

  return (
    <Alert
      severity={severity}
      action={report.metadata.record?.prNumber && <ReviewReportModal report={report} setReport={setReport} />}
    >
      {conclusionText}
      {report.metadata.record?.reviews?.length &&
        report.metadata.record?.reviews.map((review, index) => <ReviewRecord key={index} review={review} />)}
    </Alert>
  );
});

export default ReportHeader;
