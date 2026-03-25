import { motion } from 'framer-motion'
import { Skull, AlertTriangle } from 'lucide-react'

export default function AttackChain({ chain }) {
  if (!chain?.has_chain) return null
  const colors = ['rgba(248,81,73,0.08)', 'rgba(248,81,73,0.12)', 'rgba(248,81,73,0.18)', 'rgba(248,81,73,0.24)', 'rgba(248,81,73,0.3)']

  return (
    <div className="card space-y-4" style={{ borderColor: 'rgba(248,81,73,0.3)', background: 'rgba(248,81,73,0.03)' }}>
      <div className="flex items-center gap-3">
        <Skull size={20} style={{ color: 'var(--red)' }} />
        <div>
          <h3 className="font-display font-bold text-xl" style={{ color: 'var(--red)' }}>{chain.chain_title}</h3>
          <div className="flex gap-2 mt-1 flex-wrap">
            <span className="pill-red">{chain.chain_severity}</span>
            <span className="pill-yellow">⏱ {chain.time_to_compromise}</span>
            <span className="pill-red">Weakest: {chain.weakest_link}</span>
          </div>
        </div>
      </div>

      <div className="space-y-2">
        {(chain.steps || []).map((step, i) => (
          <motion.div key={i} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.1 }}
            className="flex gap-3 p-3 rounded-xl"
            style={{ background: colors[Math.min(i, colors.length - 1)] }}>
            <div className="w-7 h-7 rounded-full flex-shrink-0 flex items-center justify-center text-xs font-bold"
              style={{ background: 'var(--red)', color: 'white' }}>{step.step_number}</div>
            <div className="flex-1">
              <p className="text-sm font-semibold" style={{ color: 'var(--text-1)' }}>{step.action}</p>
              <p className="text-xs mt-0.5" style={{ color: 'var(--text-2)' }}>
                Tool: <span style={{ color: 'var(--yellow)' }}>{step.hacker_tool}</span> · Exploits: {step.vulnerability_used}
              </p>
              <p className="text-xs mt-1" style={{ color: 'var(--red)' }}>Impact: {step.business_impact}</p>
            </div>
          </motion.div>
        ))}
      </div>

      {chain.chain_summary && (
        <div className="p-3 rounded-xl" style={{ background: 'rgba(210,153,34,0.08)', border: '1px solid rgba(210,153,34,0.2)' }}>
          <p className="text-sm" style={{ color: 'var(--yellow)' }}>⚠️ {chain.chain_summary}</p>
        </div>
      )}

      {chain.priority_fix && (
        <div className="p-3 rounded-xl" style={{ background: 'rgba(63,185,80,0.08)', border: '1px solid rgba(63,185,80,0.2)' }}>
          <p className="text-sm font-semibold" style={{ color: 'var(--green)' }}>🔐 Break this chain: {chain.priority_fix}</p>
        </div>
      )}
    </div>
  )
}
