import { Area, AreaChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { COLORS } from '@/lib/constants'

interface BehaviorChartProps {
  data: { name: string; value: number }[]
  color?: string
}

export function BehaviorChart({ data, color = COLORS.blue }: BehaviorChartProps) {
  return (
    <ResponsiveContainer width="100%" height={200}>
      <AreaChart data={data}>
        <defs>
          <linearGradient id="behaviorGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity={0.3} />
            <stop offset="100%" stopColor={color} stopOpacity={0} />
          </linearGradient>
        </defs>
        <XAxis dataKey="name" tick={{ fill: '#71717a', fontSize: 10 }} axisLine={false} tickLine={false} />
        <YAxis tick={{ fill: '#71717a', fontSize: 10 }} axisLine={false} tickLine={false} domain={[0, 1]} />
        <Tooltip
          contentStyle={{ background: '#111114', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 8 }}
          labelStyle={{ color: '#a1a1aa' }}
        />
        <Area type="monotone" dataKey="value" stroke={color} fill="url(#behaviorGrad)" strokeWidth={2} />
      </AreaChart>
    </ResponsiveContainer>
  )
}
