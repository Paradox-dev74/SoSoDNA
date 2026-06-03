import { useQuery } from '@tanstack/react-query'
import { AiReasoningStream } from '@/components/ai/AiReasoningStream'
import { ForensicInsightCard } from '@/components/ai/ForensicInsightCard'
import { getInsights } from '@/lib/api/insights'

export function AiPanel() {
  const { data: insights } = useQuery({ queryKey: ['insights'], queryFn: getInsights })

  return (
    <div className="flex h-full w-80 flex-col bg-bg-surface/80 p-4 backdrop-blur-xl">
      <h3 className="mb-4 text-sm font-semibold text-text-primary">Intelligence Stream</h3>
      <AiReasoningStream isActive />
      <div className="mt-4 flex-1 space-y-2 overflow-y-auto">
        {insights?.slice(0, 4).map((insight, i) => (
          <ForensicInsightCard key={insight.id} insight={insight} index={i} />
        ))}
      </div>
    </div>
  )
}
