import React from 'react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Cell,
} from 'recharts';
import { BarChart3, AlertCircle } from 'lucide-react';

const DIFFICULTY_COLORS = {
  easy: '#10b981', // Emerald
  medium: '#f59e0b', // Amber
  hard: '#6366f1', // Indigo
};

function CustomTooltip({ active, payload }) {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <div className="rounded-xl border border-slate-200 bg-white p-3 shadow-lg dark:border-slate-800 dark:bg-slate-900 text-xs space-y-1">
        <p className="font-bold text-slate-900 dark:text-white">{data.topic}</p>
        <p className="text-slate-600 dark:text-slate-300">
          Coverage: <span className="font-mono font-bold text-indigo-600 dark:text-indigo-400">{data.coverage}%</span>
        </p>
        <div className="flex items-center gap-1.5 pt-1">
          <span className="text-slate-500">Difficulty:</span>
          <span
            className="rounded px-1.5 py-0.5 text-[10px] font-bold uppercase text-white"
            style={{ backgroundColor: DIFFICULTY_COLORS[data.difficulty] || '#6366f1' }}
          >
            {data.difficulty}
          </span>
        </div>
      </div>
    );
  }
  return null;
}

export function TopicBreakdownChart({ topicBreakdown = [] }) {
  if (!topicBreakdown || topicBreakdown.length === 0) {
    return (
      <div className="flex min-h-[300px] flex-col items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-white p-8 text-center dark:border-slate-800 dark:bg-slate-900/50">
        <BarChart3 className="h-10 w-10 text-slate-300 dark:text-slate-600 mb-3" />
        <h3 className="text-base font-bold text-slate-800 dark:text-slate-200">
          No Topic Breakdown Data
        </h3>
        <p className="mt-1 max-w-sm text-xs text-slate-500 dark:text-slate-400">
          Generate a study kit to visualize curriculum coverage and difficulty depth.
        </p>
      </div>
    );
  }

  // Calculate stats
  const averageCoverage = Math.round(
    topicBreakdown.reduce((acc, t) => acc + (t.coverage || 0), 0) / topicBreakdown.length
  );

  return (
    <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900 space-y-6">
      {/* Chart Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500">
            Analytics Engine
          </span>
          <h2 className="text-lg font-bold text-slate-900 dark:text-white mt-0.5">
            Topic Coverage & Difficulty Depth
          </h2>
        </div>

        {/* Legend */}
        <div className="flex items-center gap-3 text-xs">
          <span className="flex items-center gap-1.5 text-slate-600 dark:text-slate-400">
            <span className="h-2.5 w-2.5 rounded-full bg-emerald-500" />
            Easy
          </span>
          <span className="flex items-center gap-1.5 text-slate-600 dark:text-slate-400">
            <span className="h-2.5 w-2.5 rounded-full bg-amber-500" />
            Medium
          </span>
          <span className="flex items-center gap-1.5 text-slate-600 dark:text-slate-400">
            <span className="h-2.5 w-2.5 rounded-full bg-indigo-500" />
            Hard
          </span>
          <span className="border-l border-slate-200 dark:border-slate-700 pl-3 font-semibold text-slate-700 dark:text-slate-300">
            Avg: {averageCoverage}%
          </span>
        </div>
      </div>

      {/* Recharts Bar Chart */}
      <div className="h-72 w-full pt-2">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={topicBreakdown}
            layout="vertical"
            margin={{ top: 5, right: 30, left: 40, bottom: 5 }}
          >
            <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#e2e8f0" opacity={0.5} />
            <XAxis
              type="number"
              domain={[0, 100]}
              tick={{ fontSize: 11, fill: '#94a3b8' }}
              unit="%"
            />
            <YAxis
              type="category"
              dataKey="topic"
              tick={{ fontSize: 12, fill: '#64748b' }}
              width={110}
            />
            <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(99, 102, 241, 0.05)' }} />
            <Bar dataKey="coverage" radius={[0, 6, 6, 0]} barSize={18}>
              {topicBreakdown.map((entry) => (
                <Cell
                  key={entry.id}
                  fill={DIFFICULTY_COLORS[entry.difficulty] || '#6366f1'}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

