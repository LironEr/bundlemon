import styled from '@emotion/styled';
import { FileDetailsDiff, DiffChange, FailReason } from 'bundlemon-utils';
import { getDiffPercentText, getDiffSizeText } from 'bundlemon-utils';

const Text = styled.span<{ $bold?: boolean }>`
  font-weight: ${({ $bold }) => ($bold ? '700' : '400')};
`;

interface ChangeSizeCellProps {
  file: FileDetailsDiff;
}

const ChangeSizeCell = ({ file }: ChangeSizeCellProps) => {
  if (file.diff.change !== DiffChange.Update) {
    return <span>-</span>;
  }

  return (
    <>
      <Text $bold={file.failReasons?.includes(FailReason.MaxSize)}>{getDiffSizeText(file.diff.bytes)}</Text> |{' '}
      <Text $bold={file.failReasons?.includes(FailReason.MaxPercentIncrease)}>
        {getDiffPercentText(file.diff.percent)}
      </Text>
    </>
  );
};

export default ChangeSizeCell;
