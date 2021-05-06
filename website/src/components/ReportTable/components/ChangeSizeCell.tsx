import { FileDetailsDiff, DiffChange, FailReason, textUtils } from 'bundlemon-utils';

interface ChangeSizeCellProps {
  file: FileDetailsDiff;
}

const ChangeSizeCell = ({ file }: ChangeSizeCellProps) => {
  if (file.diff.change !== DiffChange.Update) {
    return <span>-</span>;
  }

  const text = textUtils.getDiffSizeText(file.diff.bytes);

  if (file.failReasons?.includes(FailReason.MaxSize)) {
    return <b>{text}</b>;
  }

  return <span>{text}</span>;
};

export default ChangeSizeCell;
