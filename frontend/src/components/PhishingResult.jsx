import { motion } from 'framer-motion'
const VERDICT_CONFIG = {
  SAFE: { color: 'var(--green)' }, SUSPICIOUS: { color: 'var(--yellow)' },
  PHISHING: { color: 'var(--red)' }, CRITICAL_THREAT: { color: 'var(--red)' },
}
export default function PhishingResult({ analysis }) {
  const vc = VERDICT_CONFIG[analysis.verdict] || VERDICT_CONFIG.SUSPICIOUS
  return (
    <div className="p-3 rounded-xl border flex items-center gap-3"
      style={{ background: 'var(--bg-card)', borderColor: `${vc.color}30` }}>
      <span className="pill text-xs" style={{ background: `${vc.color}15`, color: vc.color, border: `1px solid ${vc.color}30` }}>
        {analysis.verdict}
      </span>
      <span className="pill-blue text-xs">{analysis.message_type}</span>
      <p className="text-xs flex-1 truncate" style={{ color: 'var(--text-2)' }}>{analysis.message_preview}</p>
      <p className="text-xs flex-shrink-0" style={{ color: 'var(--text-2)' }}>
        {new Date(analysis.analyzed_at).toLocaleDateString('en-IN')}
      </p>
    </div>
  )
}
