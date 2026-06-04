import { cn } from '@/lib/utils'

const SIZES = {
  xs: 'h-6 w-6',
  sm: 'h-8 w-8',
  md: 'h-10 w-10',
  lg: 'h-14 w-14',
  xl: 'h-16 w-16',
} as const

interface LogoProps {
  size?: keyof typeof SIZES
  showText?: boolean
  className?: string
  textClassName?: string
}

export function Logo({ size = 'sm', showText = true, className, textClassName }: LogoProps) {
  return (
    <div className={cn('flex items-center gap-2.5', className)}>
      <img
        src="/soso-dna-logo.png"
        alt="SOSO DNA"
        className={cn(SIZES[size], 'shrink-0 object-contain')}
        draggable={false}
      />
      {showText && (
        <span className={cn('text-sm font-semibold tracking-tight text-text-primary', textClassName)}>
          SOSO <span className="text-gold">DNA</span>
        </span>
      )}
    </div>
  )
}
