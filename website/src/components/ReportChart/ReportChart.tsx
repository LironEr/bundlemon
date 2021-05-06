import { CommitRecord } from 'bundlemon-utils';
import { useState, useMemo } from 'react';
import bytes from 'bytes';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import CustomLegend from './components/CustomLegend';
import { PathRecord } from './components/types';

const stringToColor = function (str: string): string {
  let hash = 0;

  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }

  let color = '#';
  for (let i = 0; i < 3; i++) {
    const value = (hash >> (i * 8)) & 0xff;
    color += ('00' + value.toString(16)).substr(-2);
  }
  return color;
};

const getVal =
  (path: string, type: 'files' | 'groups') =>
  (value: CommitRecord): number | undefined =>
    value[type].find((f) => f.path === path)?.size;

const bytesTickFormatter = (value: number) => bytes(value);
const dateTickFormatter = (value: string) => new Date(value).toLocaleDateString();

interface ReportChartProps {
  reports: CommitRecord[];
  type: 'files' | 'groups';
}

const ReportChart = ({ reports, type }: ReportChartProps) => {
  const sortedReports = useMemo(
    () => reports.sort((a, b) => new Date(a.creationDate).getTime() - new Date(b.creationDate).getTime()),
    [reports]
  );

  const pathRecords: PathRecord[] = useMemo(() => {
    const m: Record<string, PathRecord> = {};

    reports.forEach((r) => {
      (type === 'files' ? r.files : r.groups).forEach((f) => {
        if (!m[f.path]) {
          m[f.path] = { path: f.path, minSize: f.size, maxSize: f.size, color: stringToColor(f.path) };
        } else {
          m[f.path].minSize = Math.min(m[f.path].minSize, f.size);
          m[f.path].maxSize = Math.max(m[f.path].maxSize, f.size);
        }
      });
    });

    const latestReport = reports[reports.length - 1];

    (type === 'files' ? latestReport.files : latestReport.groups).forEach((f) => {
      if (m[f.path]) {
        m[f.path].latestSize = f.size;
      }
    });

    return Object.values(m);
  }, [reports, type]);

  const [selectedIndexes, setSelectedIndexes] = useState<number[]>(() => pathRecords.map((_, index) => index));
  const [visibleIndexes, setVisibleIndexes] = useState<number[]>(() => pathRecords.map((_, index) => index));

  return (
    <div style={{ display: 'flex', flexDirection: 'column', flex: '1', width: '100%' }}>
      <ResponsiveContainer height={500}>
        <LineChart
          data={sortedReports}
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
          <Tooltip formatter={(value: number) => bytes(value)} />
          <Legend
            content={
              <CustomLegend
                pathRecords={pathRecords}
                selectedIndexes={selectedIndexes}
                setSelectedIndexes={setSelectedIndexes}
                setVisibleIndexes={setVisibleIndexes}
              />
            }
          />
          {pathRecords.map((p, index) => (
            <Line
              key={p.path}
              type="monotone"
              name={p.path}
              dataKey={getVal(p.path, type) as any}
              stroke={p.color}
              hide={!selectedIndexes.includes(index) || !visibleIndexes.includes(index)}
              isAnimationActive={false}
            />
          ))}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};

export default ReportChart;
