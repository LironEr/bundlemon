import { memo } from 'react';
import { LegendProps } from 'recharts';
import LegendDataTable from './LegendDataTable';
import { PathRecord } from './types';

interface CustomLegendProps extends LegendProps {
  selectedIndexes: number[];
  setSelectedIndexes: (indexes: number[]) => void;
  setVisibleIndexes: (indexes: number[]) => void;
  pathRecords: PathRecord[];
}

const CustomLegend = memo(
  ({ payload, onMouseEnter, onMouseLeave, onClick, pathRecords, ...rest }: CustomLegendProps) => {
    return <LegendDataTable data={pathRecords} {...rest} />;
  },
  (prevProps, nextProps) =>
    prevProps.pathRecords === nextProps.pathRecords && prevProps.selectedIndexes === nextProps.selectedIndexes
);

CustomLegend.displayName = 'CustomLegend';

export default CustomLegend;
