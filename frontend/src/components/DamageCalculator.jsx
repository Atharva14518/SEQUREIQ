import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'

function CountUp({ target, prefix = '' }) {
  const [val, setVal] = useState(0)
  useEffect(() => {
    let start = 0
    const step = target / 60
    const t = setInterval(() => {
      start += step
      if (start >= target) { setVal(target); clearInterval(t) }
      else setVal(Math.floor(start))
    }, 16)
    return () => clearInterval(t)
  }, [target])
  return <span>{prefix}{val.toLocaleString('en-IN')}</span>
}

export default function DamageCalculator({ damage }) {
  if (!damage || !damage.total_financial_risk) return null

  return (
    <div className="card space-y-6">
      <div className="p-4 rounded-2xl text-center" style={{ background: 'rgba(248,81,73,0.06)', border: '1px solid rgba(248,81,73,0.2)' }}>
        <p className="text-sm mb-1" style={{ color: 'var(--text-2)' }}>Total Financial Risk Exposure</p>
        <p className="font-display font-extrabold text-5xl" style={{ color: 'var(--red)' }}>
          <CountUp target={damage.total_financial_risk} prefix="₹" />
        </p>
        <p className="text-sm mt-1" style={{ color: 'var(--text-2)' }}>{damage.formatted_total} estimated potential loss</p>
      </div>

      <div className="space-y-3">
        {(damage.finding_costs || []).map((fc, i) => (
          <div key={i} className="p-3 rounded-xl" style={{ background: 'var(--bg-card-2)', border: '1px solid var(--border)' }}>
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className={`status-${fc.status}`}>{fc.status}</span>
                  <span className="text-sm font-semibold" style={{ color: 'var(--text-1)' }}>{fc.label}</span>
                </div>
                <p className="text-xs" style={{ color: 'var(--text-2)' }}>{fc.check}</p>
                <div className="flex flex-wrap gap-1 mt-2">
                  {fc.risks?.slice(0, 2).map((r, j) => (
                    <span key={j} className="text-xs px-2 py-0.5 rounded-full" style={{ background: 'rgba(248,81,73,0.08)', color: 'var(--red)' }}>{r}</span>
                  ))}
                </div>
              </div>
              <div className="text-right flex-shrink-0">
                <p className="font-bold text-lg" style={{ color: 'var(--red)' }}>{fc.formatted_cost}</p>
                <p className="text-xs" style={{ color: 'var(--text-2)' }}>{fc.affected_customers?.toLocaleString('en-IN')} customers at risk</p>
              </div>
            </div>
            <div className="mt-2 w-full rounded-full h-1" style={{ background: 'var(--border)' }}>
              <motion.div className="h-full rounded-full" style={{ background: 'var(--red)' }}
                initial={{ width: 0 }}
                animate={{ width: `${Math.min((fc.estimated_cost / damage.total_financial_risk) * 100, 100)}%` }}
                transition={{ duration: 1, delay: i * 0.1 }} />
            </div>
          </div>
        ))}
      </div>

      <div className="p-4 rounded-xl" style={{ background: 'rgba(63,185,80,0.06)', border: '1px solid rgba(63,185,80,0.2)' }}>
        <p className="text-sm" style={{ color: 'var(--green)' }}>💡 {damage.prevention_message}</p>
        <p className="text-xs mt-1" style={{ color: 'var(--text-2)' }}>⏱ Estimated time to fix: {damage.time_to_fix_all}</p>
      </div>
    </div>
  )
}
