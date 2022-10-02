import { observer } from 'mobx-react-lite';
import { getReportConclusionText, Report, Status } from 'bundlemon-utils';
import { Alert, AlertColor } from '@mui/material';
import { ReportApproveButton, ReportApproved } from './components';

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
    if (report.metadata.record?.approvers?.length) {
      severity = 'warning';
    } else {
      severity = 'success';
    }
  }

  return (
    <Alert severity={severity} action={<ReportApproveButton report={report} setReport={setReport} />}>
      {conclusionText}
      {report.metadata.record?.approvers?.length &&
        report.metadata.record?.approvers.map((approver, index) => <ReportApproved key={index} approver={approver} />)}
    </Alert>
  );
});

export default ReportHeader;
