import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

const STEPS = [
  'Resolving DNS records',
  'Checking SSL certificate',
  'Scanning email security (SPF/DMARC/DKIM)',
  'Checking security headers',
  'Discovering exposed subdomains',
  'Running AI analysis & generating insights',
]

const COMMENTARY = [
  '🔍 Looking up your domain\'s nameservers and hosting…',
  '🔒 Connecting to port 443, verifying certificate chain…',
  '📧 Querying DNS for SPF, DMARC, and DKIM records…',
  '🌐 Fetching HTTP response headers from your server…',
  '🗺️ Checking 16 common subdomains for exposure…',
  '🤖 Local AI is generating plain-English explanations…',
]

export default function ScanProgress({ isScanning }) {
  const [activeStep, setActiveStep] = useState(0)
  const [feed, setFeed] = useState([])

  useEffect(() => {
    if (!isScanning) { setActiveStep(0); setFeed([]); return }
    let i = 0
    setFeed([COMMENTARY[0]])
    const interval = setInterval(() => {
      i++
      if (i >= STEPS.length) { clearInterval(interval); return }
      setActiveStep(i)
      setFeed(f => [...f, COMMENTARY[i]])
    }, 2200)
    return () => clearInterval(interval)
  }, [isScanning])

  if (!isScanning) return null

  return (
    <div className="card space-y-6">
      <h3 className="font-semibold" style={{ color: 'var(--text-1)' }}>🔍 Scanning in progress…</h3>
      <div className="flex flex-wrap gap-2">
        {STEPS.map((step, i) => (
          <div key={i} className="flex items-center gap-2 px-3 py-1.5 rounded-full text-xs transition-all"
            style={{
              background: i < activeStep ? 'rgba(63,185,80,0.12)' : i === activeStep ? 'rgba(88,166,255,0.12)' : 'var(--bg-card-2)',
              color: i < activeStep ? 'var(--green)' : i === activeStep ? 'var(--blue)' : 'var(--text-2)',
              border: `1px solid ${i < activeStep ? 'rgba(63,185,80,0.3)' : i === activeStep ? 'rgba(88,166,255,0.3)' : 'var(--border)'}`,
            }}>
            {i < activeStep ? '✓' : i === activeStep ? '⟳' : '○'} {step}
          </div>
        ))}
      </div>
      <div className="terminal-window">
        <div className="terminal-header">
          <div className="terminal-dot" style={{ background: '#F85149' }} />
          <div className="terminal-dot" style={{ background: '#D29922' }} />
          <div className="terminal-dot" style={{ background: '#3FB950' }} />
          <span className="ml-2 text-xs" style={{ color: 'var(--text-2)' }}>SecureIQ Scanner</span>
        </div>
        <div className="terminal-body">
          <AnimatePresence>
            {feed.map((line, i) => (
              <motion.p key={i} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}
                className="terminal-line-output mb-1">{line}</motion.p>
            ))}
          </AnimatePresence>
          <span className="animate-terminal-cursor" style={{ color: 'var(--green)' }}>█</span>
        </div>
      </div>
    </div>
  )
}
