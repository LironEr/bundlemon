import { FileDetailsDiff, DiffChange, FailReason, textUtils } from 'bundlemon-utils';

interface ChangePercentCellProps {
  file: FileDetailsDiff;
}

const ChangePercentCell = ({ file }: ChangePercentCellProps) => {
  if (file.diff.change !== DiffChange.Update) {
    return <span>-</span>;
  }

  const text = textUtils.getDiffPercentText(file.diff.percent);

  if (file.failReasons?.includes(FailReason.MaxPercentIncrease)) {
    return <b>{text}</b>;
  }

  return <span>{text}</span>;
};

export default ChangePercentCell;
