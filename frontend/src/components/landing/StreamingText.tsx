import { motion } from 'framer-motion'
import { useEffect, useState } from 'react'

interface StreamingTextProps {
  lines: string[]
  className?: string
}

export function StreamingText({ lines, className }: StreamingTextProps) {
  const [visibleLines, setVisibleLines] = useState(0)
  const [charIndex, setCharIndex] = useState(0)

  useEffect(() => {
    if (visibleLines >= lines.length) return

    const currentLine = lines[visibleLines]
    if (charIndex < currentLine.length) {
      const t = setTimeout(() => setCharIndex((c) => c + 1), 28)
      return () => clearTimeout(t)
    }

    const t = setTimeout(() => {
      setVisibleLines((v) => v + 1)
      setCharIndex(0)
    }, 400)
    return () => clearTimeout(t)
  }, [visibleLines, charIndex, lines])

  return (
    <div className={className}>
      {lines.slice(0, visibleLines + 1).map((line, i) => (
        <motion.p
          key={i}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="font-mono text-xs leading-relaxed text-text-muted"
        >
          <span className="text-blue/80 mr-2">›</span>
          {i < visibleLines ? line : line.slice(0, charIndex)}
          {i === visibleLines && charIndex < line.length && (
            <motion.span
              animate={{ opacity: [1, 0] }}
              transition={{ duration: 0.5, repeat: Infinity }}
              className="ml-0.5 inline-block h-3 w-1.5 bg-gold/60"
            />
          )}
        </motion.p>
      ))}
    </div>
  )
}
