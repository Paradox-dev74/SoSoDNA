import { useQuery } from '@tanstack/react-query'
import { AiReasoningStream } from '@/components/ai/AiReasoningStream'
import { ForensicInsightCard } from '@/components/ai/ForensicInsightCard'
import { getInsights } from '@/lib/api/insights'

export function AiInsightsPage() {
  const { data: insights } = useQuery({ queryKey: ['insights'], queryFn: getInsights })

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-text-primary">AI Forensic Insights</h1>
        <p className="text-sm text-text-muted">Evidence-bound behavioral intelligence — not generic summaries</p>
      </div>

      <AiReasoningStream isActive />

      <div className="grid gap-4 md:grid-cols-2">
        {insights?.length ? (
          insights.map((insight, i) => <ForensicInsightCard key={insight.id} insight={insight} index={i} />)
        ) : (
          <div className="panel rounded-xl p-6 text-sm text-text-muted md:col-span-2">
            No saved insights yet. The stream above generates live forensic analysis from your synced trades and SoSoValue context.
          </div>
        )}
      </div>
    </div>
  )
}
