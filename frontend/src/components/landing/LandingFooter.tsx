import { Logo } from '@/components/brand/Logo'

const links = {
  Platform: ['Intelligence', 'Forensics', 'Replay Engine', 'Risk Guard', 'Metrics'],
  Integrations: ['SoDEX Testnet', 'SoSoValue API', 'AI Engine', 'WebSocket Feed'],
  Company: ['About', 'Docs', 'Pricing', 'Contact'],
}

export function LandingFooter() {
  return (
    <footer className="relative overflow-hidden" style={{ borderTop: '1px solid rgba(255,255,255,0.05)' }}>
      <div className="absolute inset-x-0 top-0 h-px divider-subtle" />

      {/* Top section */}
      <div className="mx-auto max-w-7xl px-6 py-16 lg:px-8 lg:py-20">
        <div className="grid gap-12 lg:grid-cols-[2fr,1fr,1fr,1fr]">
          {/* Brand */}
          <div>
            <div className="mb-4">
              <Logo size="md" />
            </div>
            <p className="text-sm leading-relaxed text-text-muted max-w-xs">
              Institutional-grade behavioral intelligence for SoDEX traders.
              Decode the patterns behind your PNL — with evidence-only AI insights.
            </p>
            <div className="mt-6 flex items-center gap-2">
              <div className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-[11px] text-text-muted">Live on SoDEX Testnet</span>
            </div>
          </div>

          {/* Links */}
          {Object.entries(links).map(([category, items]) => (
            <div key={category}>
              <p className="mb-4 text-[11px] font-semibold uppercase tracking-[0.12em] text-text-muted">{category}</p>
              <ul className="space-y-2.5">
                {items.map((item) => (
                  <li key={item}>
                    <a
                      href="#"
                      className="text-sm text-text-muted/70 transition-colors hover:text-text-muted"
                    >
                      {item}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>

      {/* Bottom bar */}
      <div style={{ borderTop: '1px solid rgba(255,255,255,0.04)' }}>
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 px-6 py-6 text-[11px] text-text-muted/50 sm:flex-row lg:px-8">
          <p>© 2026 SOSO DNA. All rights reserved.</p>
          <div className="flex items-center gap-6">
            <span>Powered by SoDEX · SoSoValue · AI Intelligence</span>
          </div>
        </div>
      </div>
    </footer>
  )
}
