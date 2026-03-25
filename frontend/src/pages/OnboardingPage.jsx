import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useUser } from '@clerk/clerk-react'
import { ChevronLeft } from 'lucide-react'
import { initUserProfile, saveOnboardingData, completeOnboarding } from '../api/secureiq.js'

const WEBSITE_TYPES = [
  { id: 'ecommerce', name: 'E-COMMERCE' },
  { id: 'saas', name: 'SAAS / APP' },
  { id: 'restaurant', name: 'RESTAURANT / FOOD' },
  { id: 'healthcare', name: 'HEALTHCARE' },
  { id: 'education', name: 'EDUCATION' },
  { id: 'fintech', name: 'FINTECH' },
]

const VISITOR_OPTIONS = ['under_1k', '1k_10k', '10k_100k', '100k_plus']
const VISITOR_LABELS = { under_1k: '<1K / month', '1k_10k': '1K–10K', '10k_100k': '10K–100K', '100k_plus': '100K+' }
const TEAM_OPTIONS = ['solo', '2_5', '6_20', '20_plus']
const TEAM_LABELS = { solo: 'Just me', '2_5': '2–5', '6_20': '6–20', '20_plus': '20+' }
const TECH_LEVELS = [
  { id: 'non_tech', emoji: '🙋', label: 'Not Technical', desc: 'No coding knowledge' },
  { id: 'basic', emoji: '🔧', label: 'Basic', desc: 'Edit websites, use tools' },
  { id: 'intermediate', emoji: '💻', label: 'Intermediate', desc: 'Some coding experience' },
  { id: 'advanced', emoji: '🚀', label: 'Advanced', desc: 'Developer / engineer' },
]
const CONCERNS = ['Data Theft', 'Ransomware', 'Phishing', 'Account Takeover', 'Compliance', 'Reputation Damage']
const HOSTING_OPTIONS = ['Cloudflare', 'AWS', 'GoDaddy', 'Hostinger', 'BigRock', 'SiteGround', 'Vercel', 'Netlify', 'DigitalOcean', 'Other / Not Sure']

export default function OnboardingPage() {
  const { user } = useUser()
  const navigate = useNavigate()
  const [step, setStep] = useState(1)
  const [done, setDone] = useState(false)
  const [loading, setLoading] = useState(false)
  const [answers, setAnswers] = useState({
    website_type: '',
    monthly_visitors: '',
    team_size: '',
    tech_comfort_level: '',
    has_customer_data: null,
    has_payment_processing: null,
    has_user_login: null,
    previous_security_audit: null,
    biggest_concern: '',
    hosting_provider: '',
    business_name: '',
    website_url: '',
  })

  const set = (k, v) => setAnswers(a => ({ ...a, [k]: v }))

  useEffect(() => {
    if (user) {
      initUserProfile(user.id, user.primaryEmailAddress?.emailAddress, user.fullName).catch(() => {})
    }
  }, [user])

  const canProceed = () => {
    if (step === 1) return !!answers.website_type
    if (step === 2) return !!answers.monthly_visitors && !!answers.team_size && !!answers.tech_comfort_level
    if (step === 3) return !!answers.hosting_provider
    return true
  }

  const handleNext = async () => {
    if (step < 4) {
      await saveOnboardingData({ clerk_user_id: user?.id, ...answers }).catch(() => {})
      setStep(s => s + 1)
    } else {
      setLoading(true)
      await saveOnboardingData({ clerk_user_id: user?.id, ...answers }).catch(() => {})
      await completeOnboarding(user?.id).catch(() => {})
      setLoading(false)
      setDone(true)
      setTimeout(() => navigate('/dashboard'), 2000)
    }
  }

  if (done) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center" style={{ background: '#181818' }}>
        <h2 className="display-md headline-depth" data-text="SETUP COMPLETE"><span>SETUP COMPLETE</span></h2>
        <p className="body-copy mt-3">Redirecting to your dashboard...</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen" style={{ background: '#181818' }}>
      <div className="flex items-center justify-between px-12 py-6">
        <p className="label-sm">SECUREIQ</p>
        <p className="label-sm" style={{ color: '#35211A' }}>STEP {step} - OF 4</p>
      </div>

      <div className="w-full h-px" style={{ background: '#35211A' }}>
        <div className="h-px transition-all duration-400" style={{ width: `${(step / 4) * 100}%`, background: '#DC9F85' }} />
      </div>

      <div className="max-w-5xl mx-auto px-12 py-12">
        {step === 1 && (
          <div>
            <h2 className="display-lg headline-depth mb-8" data-text={'SELECT\nBUSINESS TYPE'} style={{ whiteSpace: 'pre-line' }}>
              <span>{'SELECT\nBUSINESS TYPE'}</span>
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-1">
              {WEBSITE_TYPES.map((t, idx) => {
                const selected = answers.website_type === t.id
                return (
                  <button
                    key={t.id}
                    onClick={() => set('website_type', t.id)}
                    className="text-left p-5 border rounded"
                    style={{
                      background: '#1E1E1E',
                      borderColor: selected ? '#DC9F85' : '#35211A',
                      borderRadius: 4,
                    }}
                  >
                    <p className="label-sm" style={{ color: selected ? '#DC9F85' : '#35211A' }}>{String(idx + 1).padStart(2, '0')}</p>
                    <p className="label-sm mt-3" style={{ color: selected ? '#EBDCC4' : '#B6A596' }}>{t.name}</p>
                    {selected && <div className="mt-4 h-px" style={{ background: '#DC9F85' }} />}
                  </button>
                )
              })}
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-10">
            <h2 className="display-lg headline-depth" data-text={'BUSINESS\nSCALE'} style={{ whiteSpace: 'pre-line' }}><span>{'BUSINESS\nSCALE'}</span></h2>
            <div>
              <p className="label-sm mb-3">MONTHLY VISITORS</p>
              <div className="flex gap-2 flex-wrap">
                {VISITOR_OPTIONS.map(v => (
                  <button
                    key={v}
                    onClick={() => set('monthly_visitors', v)}
                    className="px-4 py-2 border rounded label-sm"
                    style={{
                      borderRadius: 4,
                      borderColor: answers.monthly_visitors === v ? '#DC9F85' : '#35211A',
                      color: answers.monthly_visitors === v ? '#DC9F85' : '#B6A596',
                    }}
                  >
                    {VISITOR_LABELS[v]}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <p className="label-sm mb-3">TEAM SIZE</p>
              <div className="flex gap-2 flex-wrap">
                {TEAM_OPTIONS.map(v => (
                  <button
                    key={v}
                    onClick={() => set('team_size', v)}
                    className="px-4 py-2 border rounded label-sm"
                    style={{
                      borderRadius: 4,
                      borderColor: answers.team_size === v ? '#DC9F85' : '#35211A',
                      color: answers.team_size === v ? '#DC9F85' : '#B6A596',
                    }}
                  >
                    {TEAM_LABELS[v]}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <p className="label-sm mb-3">TECH COMFORT</p>
              <div className="flex gap-2 flex-wrap">
                {TECH_LEVELS.map(t => (
                  <button
                    key={t.id}
                    onClick={() => set('tech_comfort_level', t.id)}
                    className="px-4 py-2 border rounded label-sm"
                    style={{
                      borderRadius: 4,
                      borderColor: answers.tech_comfort_level === t.id ? '#DC9F85' : '#35211A',
                      color: answers.tech_comfort_level === t.id ? '#DC9F85' : '#B6A596',
                    }}
                  >
                    {t.label.toUpperCase()}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-8">
            <h2 className="display-lg headline-depth" data-text={'SECURITY\nCONTEXT'} style={{ whiteSpace: 'pre-line' }}><span>{'SECURITY\nCONTEXT'}</span></h2>
            <div>
              <p className="label-sm mb-2">HOSTING PROVIDER</p>
              <select className="input-field" value={answers.hosting_provider} onChange={e => set('hosting_provider', e.target.value)}>
                <option value="">SELECT</option>
                {HOSTING_OPTIONS.map(h => <option key={h} value={h}>{h}</option>)}
              </select>
            </div>
            <div>
              <p className="label-sm mb-2">BIGGEST CONCERN</p>
              <div className="flex gap-2 flex-wrap">
                {CONCERNS.map(c => (
                  <button
                    key={c}
                    onClick={() => set('biggest_concern', c)}
                    className="px-4 py-2 border rounded label-sm"
                    style={{
                      borderRadius: 4,
                      borderColor: answers.biggest_concern === c ? '#DC9F85' : '#35211A',
                      color: answers.biggest_concern === c ? '#DC9F85' : '#B6A596',
                    }}
                  >
                    {c.toUpperCase()}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {step === 4 && (
          <div className="space-y-6">
            <h2 className="display-lg headline-depth" data-text={'FINAL\nDETAILS'} style={{ whiteSpace: 'pre-line' }}><span>{'FINAL\nDETAILS'}</span></h2>
            <div>
              <p className="label-sm mb-2">BUSINESS NAME</p>
              <input className="input-field" value={answers.business_name} onChange={e => set('business_name', e.target.value)} />
            </div>
            <div>
              <p className="label-sm mb-2">WEBSITE URL</p>
              <input className="input-field" value={answers.website_url} onChange={e => set('website_url', e.target.value)} />
            </div>
          </div>
        )}

        <div className="flex items-center justify-between mt-12">
          <button onClick={() => setStep(s => Math.max(1, s - 1))} disabled={step === 1} className="btn-ghost flex items-center gap-2">
            <ChevronLeft size={14} /> - BACK
          </button>
          <button onClick={handleNext} disabled={!canProceed() || loading} className="btn-primary">
            {loading ? 'SETTING UP...' : step === 4 ? 'CONTINUE -' : 'CONTINUE -'}
          </button>
        </div>
      </div>
    </div>
  )
}
