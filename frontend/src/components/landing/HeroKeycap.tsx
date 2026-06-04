import { motion } from 'framer-motion'

/**
 * Pixel DNA helix — white 1×1 rects on blue keycap (Dovetail peace-sign style).
 * 16×12 grid, crisp pixel edges.
 */
function PixelDnaIcon() {
  const pixels: [number, number][] = [
    // Left strand (S-curve)
    [2, 0], [3, 1], [2, 2], [3, 3], [2, 4], [3, 5], [2, 6], [3, 7], [2, 8], [3, 9],
    // Right strand
    [12, 0], [11, 1], [12, 2], [11, 3], [12, 4], [11, 5], [12, 6], [11, 7], [12, 8], [11, 9],
    // Horizontal rungs
    [4, 1], [5, 1], [6, 1], [7, 1], [8, 1], [9, 1], [10, 1],
    [4, 4], [5, 4], [6, 4], [7, 4], [8, 4], [9, 4], [10, 4],
    [4, 7], [5, 7], [6, 7], [7, 7], [8, 7], [9, 7], [10, 7],
  ]

  return (
    <svg
      viewBox="0 0 15 10"
      className="relative z-10"
      width="58%"
      height="58%"
      shapeRendering="crispEdges"
      aria-hidden
    >
      {pixels.map(([x, y], i) => (
        <rect key={i} x={x} y={y} width={1} height={1} fill="#ffffff" />
      ))}
    </svg>
  )
}

export function HeroKeycap() {
  return (
    <motion.span
      initial={{ opacity: 0, scale: 0.8, y: 10 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      transition={{ duration: 0.75, delay: 0.38, ease: [0.22, 1, 0.36, 1] }}
      className="hero-keycap relative mx-1 inline-flex shrink-0 items-center justify-center align-middle sm:mx-2"
      style={{ width: '1.05em', height: '1.05em', minWidth: 60, minHeight: 60 }}
      aria-hidden
    >
      {/* Drop shadow */}
      <span
        className="absolute rounded-[22%]"
        style={{
          top: '14%',
          left: '4%',
          right: '4%',
          bottom: '-6%',
          background: '#0c2040',
          opacity: 0.7,
          filter: 'blur(4px)',
        }}
      />

      {/* Key side / depth */}
      <span
        className="absolute rounded-[22%]"
        style={{
          top: '10%',
          left: '2%',
          right: '2%',
          bottom: '-2%',
          background: 'linear-gradient(180deg, #2a5faa 0%, #153870 100%)',
        }}
      />

      {/* Key top face */}
      <span
        className="relative flex h-full w-full items-center justify-center rounded-[22%]"
        style={{
          background: 'linear-gradient(160deg, #8ec8ff 0%, #5da9ff 22%, #4a8ef0 55%, #3570d4 100%)',
          boxShadow:
            '0 6px 28px rgba(74,142,240,0.5), inset 0 3px 8px rgba(255,255,255,0.45), inset 0 -4px 10px rgba(15,40,90,0.25)',
          transform: 'perspective(400px) rotateX(6deg)',
        }}
      >
        {/* Specular highlight */}
        <span
          className="pointer-events-none absolute left-[14%] right-[14%] top-[10%] h-[32%] rounded-[50%]"
          style={{ background: 'linear-gradient(180deg, rgba(255,255,255,0.42) 0%, transparent 100%)' }}
        />
        <PixelDnaIcon />
      </span>
    </motion.span>
  )
}
