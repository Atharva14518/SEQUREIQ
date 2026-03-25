import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Terminal, Skull, Shield } from 'lucide-react'
import { runHackerSimulation } from '../api/secureiq.js'

export default function HackerSimulation({ scanId, findings }) {
  const [state, setState] = useState('idle') // idle | loading | done
  const [sim, setSim] = useState(null)
  const [visibleLines, setVisibleLines] = useState([])
  const bodyRef = useRef()

  const run = async () => {
    setState('loading')
    try {
      const result = await runHackerSimulation(scanId, 'small_business', 2000)
      setSim(result)
      setState('done')
      showLines(result.steps || [])
    } catch {
      setState('idle')
    }
  }

  const showLines = (steps) => {
    steps.forEach((step, i) => {
      setTimeout(() => {
        setVisibleLines(v => [...v, step])
        if (bodyRef.current) bodyRef.current.scrollTop = bodyRef.current.scrollHeight
      }, i * 1200)
    })
  }

  if (state === 'idle') {
    return (
      <motion.div className="card animate-pulse-border cursor-pointer" onClick={run}
        style={{ borderColor: 'rgba(248,81,73,0.4)' }}
        whileHover={{ scale: 1.01 }}>
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl flex items-center justify-center"
            style={{ background: 'rgba(248,81,73,0.12)' }}>
            <Skull size={24} style={{ color: 'var(--red)' }} />
          </div>
          <div>
            <h3 className="font-display font-bold text-xl" style={{ color: 'var(--red)' }}>Run Hacker Simulation</h3>
            <p className="text-sm" style={{ color: 'var(--text-2)' }}>
              See how a real attacker would exploit your vulnerabilities — educational terminal simulation
            </p>
          </div>
        </div>
      </motion.div>
    )
  }

  if (state === 'loading') {
    return (
      <div className="card">
        <div className="flex items-center gap-3 mb-4">
          <Skull size={20} style={{ color: 'var(--red)' }} />
          <span className="font-semibold" style={{ color: 'var(--red)' }}>Generating attack simulation…</span>
        </div>
        <div className="animate-shimmer rounded-xl h-32" />
      </div>
    )
  }

  return (
    <div className="card space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Skull size={20} style={{ color: 'var(--red)' }} />
          <div>
            <h3 className="font-display font-bold text-lg" style={{ color: 'var(--red)' }}>{sim?.simulation_title}</h3>
            <div className="flex gap-2 mt-1">
              <span className="pill-red">⏱ {sim?.total_time_to_breach}</span>
              <span className="pill-red">💸 {sim?.total_damage_estimate}</span>
              <span className="pill-yellow">{sim?.threat_actor}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="terminal-window">
        <div className="terminal-header">
          <div className="terminal-dot" style={{ background: '#F85149' }} />
          <div className="terminal-dot" style={{ background: '#D29922' }} />
          <div className="terminal-dot" style={{ background: '#3FB950' }} />
          <span className="ml-2 text-xs" style={{ color: 'var(--text-2)' }}>kali@attacker:~# [SIMULATION — EDUCATIONAL ONLY]</span>
        </div>
        <div ref={bodyRef} className="terminal-body">
          <AnimatePresence>
            {visibleLines.map((step, i) => (
              <motion.div key={i} initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} className="mb-3">
                <p style={{ color: 'var(--text-2)', fontSize: '11px' }}>[{step.timestamp}] {step.vulnerability_exploited}</p>
                <p className="terminal-line-command">$ {step.command}</p>
                <pre className="terminal-line-output text-xs whitespace-pre-wrap">{step.output}</pre>
                <p className="terminal-line-commentary text-xs">→ {step.commentary}</p>
              </motion.div>
            ))}
          </AnimatePresence>
          {visibleLines.length > 0 && visibleLines.length < (sim?.steps?.length || 0) && (
            <span className="animate-terminal-cursor" style={{ color: 'var(--green)' }}>█</span>
          )}
        </div>
      </div>

      {visibleLines.length === (sim?.steps?.length || 0) && sim?.final_message && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }}
          className="p-4 rounded-xl" style={{ background: 'rgba(248,81,73,0.08)', border: '1px solid rgba(248,81,73,0.2)' }}>
          <p className="text-sm font-semibold" style={{ color: 'var(--red)' }}>⚠️ {sim.final_message}</p>
          <div className="mt-3 p-3 rounded-lg" style={{ background: 'rgba(63,185,80,0.08)', border: '1px solid rgba(63,185,80,0.2)' }}>
            <div className="flex items-center gap-2 mb-1">
              <Shield size={14} style={{ color: 'var(--green)' }} />
              <span className="text-xs font-bold" style={{ color: 'var(--green)' }}>Prevention</span>
            </div>
            <p className="text-xs" style={{ color: 'var(--text-2)' }}>{sim.prevention_summary}</p>
          </div>
        </motion.div>
      )}
    </div>
  )
}
