'use client'

import { useRouter } from 'next/navigation'
import { Status } from '@prisma/client'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend, Cell } from 'recharts'

const STATUS_COLORS: Record<string, string> = {
  OVERDUE: '#f87171',
  FOLLOW_UP_DUE: '#fbbf24',
  WAITING: '#60a5fa',
}

const STATUS_LABELS: Record<string, string> = {
  OVERDUE: 'Overdue',
  FOLLOW_UP_DUE: 'Follow-up Due',
  WAITING: 'Waiting',
}

interface Props {
  range: string
  stats: {
    created: number
    completed: number
    open: number
    avgDaysToComplete: number | null
  }
  buckets: { label: string; created: number; completed: number }[]
  statusCounts: { status: Status; count: number }[]
  categoryBreakdown: { name: string; color: string; completed: number; created: number }[]
  timeToComplete: { name: string; color: string; avgDays: number }[]
  followUpDist: { label: string; count: number }[]
}

function StatCard({ label, value, sub }: { label: string; value: string | number; sub?: string }) {
  return (
    <div className="bg-white border border-gray-200 rounded-lg px-5 py-4">
      <p className="text-xs text-gray-500 uppercase tracking-wider">{label}</p>
      <p className="text-3xl font-bold text-gray-900 mt-1">{value}</p>
      {sub && <p className="text-xs text-gray-400 mt-0.5">{sub}</p>}
    </div>
  )
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="text-sm font-semibold uppercase tracking-wider text-gray-400 mb-3">
      {children}
    </h2>
  )
}

export function DashboardClient({
  range,
  stats,
  buckets,
  statusCounts,
  categoryBreakdown,
  timeToComplete,
  followUpDist,
}: Props) {
  const router = useRouter()

  const rangeOptions = [
    { value: 'day', label: 'Today' },
    { value: 'week', label: 'This Week' },
    { value: 'month', label: 'Last 30 Days' },
  ]

  return (
    <div className="space-y-8">
      {/* Header + range filter */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <div className="flex rounded-lg border border-gray-200 overflow-hidden text-sm">
          {rangeOptions.map((opt) => (
            <button
              key={opt.value}
              onClick={() => router.push(`/dashboard?range=${opt.value}`)}
              className={`px-4 py-1.5 transition-colors ${
                range === opt.value
                  ? 'bg-indigo-600 text-white'
                  : 'bg-white text-gray-600 hover:bg-gray-50'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* Summary stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <StatCard label="Created" value={stats.created} />
        <StatCard label="Completed" value={stats.completed} />
        <StatCard label="Open" value={stats.open} sub="all statuses" />
        <StatCard
          label="Avg. to Complete"
          value={stats.avgDaysToComplete !== null ? `${stats.avgDaysToComplete}d` : '—'}
          sub="days from created"
        />
      </div>

      {/* Volume over time */}
      {buckets.some((b) => b.created > 0 || b.completed > 0) && (
        <div>
          <SectionTitle>Volume Over Time</SectionTitle>
          <div className="bg-white border border-gray-200 rounded-lg p-4">
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={buckets} barGap={2}>
                <XAxis
                  dataKey="label"
                  tick={{ fontSize: 11 }}
                  interval="preserveStartEnd"
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis
                  allowDecimals={false}
                  tick={{ fontSize: 11 }}
                  tickLine={false}
                  axisLine={false}
                  width={24}
                />
                <Tooltip />
                <Legend wrapperStyle={{ fontSize: 12 }} />
                <Bar dataKey="created" name="Created" fill="#818cf8" radius={[2, 2, 0, 0]} />
                <Bar dataKey="completed" name="Completed" fill="#34d399" radius={[2, 2, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        {/* Status breakdown */}
        <div>
          <SectionTitle>Open Tasks by Status</SectionTitle>
          <div className="bg-white border border-gray-200 rounded-lg p-4 space-y-3">
            {statusCounts.every((s) => s.count === 0) ? (
              <p className="text-sm text-gray-400">No open tasks.</p>
            ) : (
              statusCounts.map(({ status, count }) => {
                const total = statusCounts.reduce((s, x) => s + x.count, 0)
                const pct = total > 0 ? Math.round((count / total) * 100) : 0
                return (
                  <div key={status}>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-gray-700">{STATUS_LABELS[status]}</span>
                      <span className="font-medium text-gray-900">{count}</span>
                    </div>
                    <div className="h-2 rounded-full bg-gray-100 overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all"
                        style={{ width: `${pct}%`, backgroundColor: STATUS_COLORS[status] }}
                      />
                    </div>
                  </div>
                )
              })
            )}
          </div>
        </div>

        {/* Follow-up distribution */}
        <div>
          <SectionTitle>Follow-ups per Completed Task</SectionTitle>
          <div className="bg-white border border-gray-200 rounded-lg p-4">
            {followUpDist.every((d) => d.count === 0) ? (
              <p className="text-sm text-gray-400">No completed tasks in range.</p>
            ) : (
              <ResponsiveContainer width="100%" height={150}>
                <BarChart data={followUpDist} barSize={40}>
                  <XAxis
                    dataKey="label"
                    tick={{ fontSize: 12 }}
                    tickLine={false}
                    axisLine={false}
                  />
                  <YAxis
                    allowDecimals={false}
                    tick={{ fontSize: 11 }}
                    tickLine={false}
                    axisLine={false}
                    width={24}
                  />
                  <Tooltip />
                  <Bar dataKey="count" name="Tasks" radius={[3, 3, 0, 0]}>
                    {followUpDist.map((_, i) => (
                      <Cell key={i} fill={['#34d399', '#60a5fa', '#fbbf24', '#f87171'][i]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
      </div>

      {/* Category breakdown */}
      {categoryBreakdown.length > 0 && (
        <div>
          <SectionTitle>Activity by Category</SectionTitle>
          <div className="bg-white border border-gray-200 rounded-lg p-4">
            <ResponsiveContainer width="100%" height={Math.max(120, categoryBreakdown.length * 44)}>
              <BarChart data={categoryBreakdown} layout="vertical" barGap={2}>
                <XAxis
                  type="number"
                  allowDecimals={false}
                  tick={{ fontSize: 11 }}
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis
                  type="category"
                  dataKey="name"
                  tick={{ fontSize: 12 }}
                  tickLine={false}
                  axisLine={false}
                  width={90}
                />
                <Tooltip />
                <Legend wrapperStyle={{ fontSize: 12 }} />
                <Bar dataKey="created" name="Created" fill="#818cf8" radius={[0, 2, 2, 0]} />
                <Bar dataKey="completed" name="Completed" fill="#34d399" radius={[0, 2, 2, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Time to complete by category */}
      {timeToComplete.length > 0 && (
        <div>
          <SectionTitle>Avg. Days to Complete by Category</SectionTitle>
          <div className="bg-white border border-gray-200 rounded-lg p-4">
            <ResponsiveContainer width="100%" height={Math.max(120, timeToComplete.length * 44)}>
              <BarChart data={timeToComplete} layout="vertical">
                <XAxis
                  type="number"
                  tick={{ fontSize: 11 }}
                  tickLine={false}
                  axisLine={false}
                  unit="d"
                />
                <YAxis
                  type="category"
                  dataKey="name"
                  tick={{ fontSize: 12 }}
                  tickLine={false}
                  axisLine={false}
                  width={90}
                />
                <Tooltip formatter={(v) => [`${v} days`, 'Avg. to complete']} />
                <Bar dataKey="avgDays" name="Avg. days" radius={[0, 3, 3, 0]}>
                  {timeToComplete.map((entry, i) => (
                    <Cell key={i} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}
    </div>
  )
}
