import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, AlertTriangle } from 'lucide-react'

export default function CrisisAlert({ findings, onDismiss }) {
  const criticals = findings?.filter(f => f.status === 'critical') || []
  if (!criticals.length) return null

  return (
    <motion.div
      initial={{ y: -80, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      exit={{ y: -80, opacity: 0 }}
      className="fixed top-0 left-0 right-0 z-50 animate-pulse-border"
      style={{ background: 'rgba(248,81,73,0.12)', borderBottom: '1px solid rgba(248,81,73,0.4)', backdropFilter: 'blur(12px)' }}
    >
      <div className="max-w-6xl mx-auto px-6 py-3 flex items-center gap-4">
        <AlertTriangle size={18} style={{ color: 'var(--red)', flexShrink: 0 }} />
        <span className="text-sm font-semibold" style={{ color: 'var(--red)' }}>
          {criticals.length} Critical Issue{criticals.length > 1 ? 's' : ''} Require Immediate Attention:
        </span>
        <div className="flex gap-2 flex-wrap flex-1">
          {criticals.slice(0, 4).map((f, i) => (
            <span key={i} className="pill-red text-xs">{f.check}</span>
          ))}
        </div>
        <button onClick={onDismiss} style={{ color: 'var(--text-2)', flexShrink: 0 }}>
          <X size={16} />
        </button>
      </div>
    </motion.div>
  )
}
