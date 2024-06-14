import { observer } from 'mobx-react-lite';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import LegendDataTable from './components/LegendDataTable';
import { getVal, bytesTickFormatter, dateTickFormatter } from './utils';
import CustomTooltip from './components/CustomTooltip';

import type ReportsStore from './ReportsStore';

interface ReportsChartProps {
  store: ReportsStore;
}

const toolTipStyle = {
  zIndex: '3',
};

const ReportsChart = observer(({ store }: ReportsChartProps) => {
  return (
    <>
      <ResponsiveContainer height={300}>
        <LineChart
          data={store.commitRecords}
          margin={{
            top: 5,
            right: 30,
            left: 20,
            bottom: 5,
          }}
        >
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="creationDate" tickFormatter={dateTickFormatter} />
          <YAxis tickFormatter={bytesTickFormatter} domain={['auto', 'auto']} />
          <Tooltip wrapperStyle={toolTipStyle} content={<CustomTooltip />} />
          {store.pathRecords.map((record) => (
            <Line
              key={record.path}
              type="monotone"
              name={record.path}
              dataKey={getVal(record.path, store.type) as any}
              stroke={record.color}
              hide={!record.isSelected}
              isAnimationActive={false}
            />
          ))}
        </LineChart>
      </ResponsiveContainer>
      <LegendDataTable store={store} />
    </>
  );
});

export default ReportsChart;
