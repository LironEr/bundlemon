import bytes from 'bytes';

interface SizeCellProps {
  size?: number;
}

const SizeCell = ({ size }: SizeCellProps) => {
  return <span>{size ? bytes(size) : '-'}</span>;
};

export default SizeCell;
