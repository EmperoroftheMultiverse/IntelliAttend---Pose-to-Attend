'use client';

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

// The component now expects a simple data structure
interface ChartData {
  date: string;
  present: number;
}

interface AttendanceChartProps {
  data: ChartData[];
}

export default function AttendanceChart({ data }: AttendanceChartProps) {
  return (
    <div className="h-80">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={data}
          margin={{ top: 5, right: 20, left: -10, bottom: 5 }}
        >
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="date" />
          <YAxis allowDecimals={false} />
          <Tooltip />
          <Legend />
          <Bar dataKey="present" fill="#4f46e5" name="Students Present" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}