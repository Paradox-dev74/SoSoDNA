import { createChart, LineSeries, type IChartApi, type ISeriesApi, type LineData, ColorType } from 'lightweight-charts'
import { useEffect, useRef } from 'react'
import { COLORS } from '@/lib/constants'

interface PriceChartProps {
  data: { time: string; value: number }[]
  height?: number
  markers?: { time: string; position: 'aboveBar' | 'belowBar'; color: string; text: string }[]
}

export function PriceChart({ data, height = 300 }: PriceChartProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const chartRef = useRef<IChartApi | null>(null)
  const seriesRef = useRef<ISeriesApi<'Line'> | null>(null)

  useEffect(() => {
    if (!containerRef.current) return

    const chart = createChart(containerRef.current, {
      height,
      layout: {
        background: { type: ColorType.Solid, color: 'transparent' },
        textColor: '#a1a1aa',
      },
      grid: {
        vertLines: { color: 'rgba(255,255,255,0.04)' },
        horzLines: { color: 'rgba(255,255,255,0.04)' },
      },
      rightPriceScale: { borderColor: 'rgba(255,255,255,0.08)' },
      timeScale: { borderColor: 'rgba(255,255,255,0.08)' },
    })

    const series = chart.addSeries(LineSeries, {
      color: COLORS.gold,
      lineWidth: 2,
    }) as ISeriesApi<'Line'>

    chartRef.current = chart
    seriesRef.current = series

    const resizeObserver = new ResizeObserver(() => {
      if (containerRef.current) {
        chart.applyOptions({ width: containerRef.current.clientWidth })
      }
    })
    resizeObserver.observe(containerRef.current)

    return () => {
      resizeObserver.disconnect()
      chart.remove()
    }
  }, [height])

  useEffect(() => {
    if (!seriesRef.current || !data.length) return
    const formatted: LineData[] = data.map((d) => ({
      time: d.time as LineData['time'],
      value: d.value,
    }))
    seriesRef.current.setData(formatted)
    chartRef.current?.timeScale().fitContent()
  }, [data])

  return <div ref={containerRef} className="w-full rounded-xl overflow-hidden" />
}
