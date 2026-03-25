import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Award, Lock, Download, CheckCircle } from 'lucide-react'
import { checkCertificateEligibility, downloadCertificate } from '../api/secureiq.js'

export default function SecurityCertificate({ scanId, domain, score }) {
  const [eligibility, setEligibility] = useState(null)
  const [downloading, setDownloading] = useState(false)

  useEffect(() => {
    if (scanId) {
      checkCertificateEligibility(scanId).then(setEligibility).catch(() => {})
    }
  }, [scanId])

  const download = async () => {
    setDownloading(true)
    try {
      const blob = await downloadCertificate(scanId)
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `secureiq-cert-${domain}.pdf`
      a.click()
      URL.revokeObjectURL(url)
    } catch (e) {
      alert('Certificate download failed. Ensure score is 70+.')
    }
    setDownloading(false)
  }

  if (!eligibility) return null

  if (!eligibility.eligible) {
    return (
      <div className="card" style={{ opacity: 0.7 }}>
        <div className="flex items-center gap-3 mb-3">
          <Lock size={20} style={{ color: 'var(--text-2)' }} />
          <h3 className="font-display font-bold text-xl" style={{ color: 'var(--text-2)' }}>Security Certificate</h3>
        </div>
        <p className="text-sm mb-3" style={{ color: 'var(--text-2)' }}>
          Score {score}/100 — need {eligibility.gap} more points to unlock
        </p>
        <div className="w-full rounded-full h-2" style={{ background: 'var(--border)' }}>
          <div className="h-full rounded-full" style={{ width: `${score}%`, background: 'var(--yellow)' }} />
        </div>
        <p className="text-xs mt-2" style={{ color: 'var(--text-2)' }}>Fix {eligibility.gap} points worth of issues to earn your certificate</p>
      </div>
    )
  }

  return (
    <motion.div
      initial={{ scale: 0.95, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      className="card"
      style={{ borderColor: 'rgba(63,185,80,0.4)', background: 'linear-gradient(135deg, var(--bg-card) 0%, rgba(63,185,80,0.05) 100%)' }}
    >
      <div className="flex items-center gap-3 mb-3">
        <Award size={20} style={{ color: 'var(--green)' }} />
        <h3 className="font-display font-bold text-xl" style={{ color: 'var(--green)' }}>Security Certificate Unlocked!</h3>
      </div>
      <p className="text-sm mb-4" style={{ color: 'var(--text-2)' }}>
        {eligibility.message}
      </p>
      <div className="flex gap-3">
        <button onClick={download} disabled={downloading} className="btn-green">
          <Download size={16} />
          {downloading ? 'Generating PDF…' : 'Download Certificate PDF'}
        </button>
      </div>
    </motion.div>
  )
}
