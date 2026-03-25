import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { CheckCircle, AlertTriangle, XCircle, Info } from 'lucide-react'

const icons = { success: CheckCircle, error: XCircle, warning: AlertTriangle, info: Info }
const colors = { success: 'var(--green)', error: 'var(--red)', warning: 'var(--yellow)', info: 'var(--blue)' }
const bgs = {
  success: 'rgba(63,185,80,0.1)',
  error: 'rgba(248,81,73,0.1)',
  warning: 'rgba(210,153,34,0.1)',
  info: 'rgba(88,166,255,0.1)',
}

export default function Toast({ toasts, onRemove }) {
  return (
    <div className="fixed bottom-6 left-6 z-50 flex flex-col gap-2">
      <AnimatePresence>
        {(toasts || []).map(t => {
          const Icon = icons[t.type] || Info
          return (
            <motion.div key={t.id}
              initial={{ x: -100, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: -100, opacity: 0 }}
              className="flex items-center gap-3 px-4 py-3 rounded-2xl shadow-xl"
              style={{
                background: bgs[t.type],
                border: `1px solid ${colors[t.type]}30`,
                backdropFilter: 'blur(12px)',
                minWidth: 280,
              }}>
              <Icon size={16} style={{ color: colors[t.type], flexShrink: 0 }} />
              <span className="text-sm flex-1" style={{ color: 'var(--text-1)' }}>{t.message}</span>
            </motion.div>
          )
        })}
      </AnimatePresence>
    </div>
  )
}

let _id = 0
export function useToast() {
  const [toasts, setToasts] = useState([])
  const add = (message, type = 'info') => {
    const id = ++_id
    setToasts(t => [...t, { id, message, type }])
    setTimeout(() => setToasts(t => t.filter(x => x.id !== id)), 3000)
  }
  return { toasts, add }
}
