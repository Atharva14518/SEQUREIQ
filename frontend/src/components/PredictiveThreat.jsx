import { useEffect, useState } from 'react'
import { predictThreat } from '../api/secureiq.js'

function threatColor(threatScore) {
  if (threatScore >= 75) return '#DC9F85'
  if (threatScore >= 45) return '#B6A596'
  return '#DC9F85'
}

export default function PredictiveThreat({ scanResult, userProfile }) {
  const [prediction, setPrediction] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  useEffect(() => {
    let cancelled = false

    const run = async () => {
      if (!scanResult) return
      setLoading(true)
      setError(null)
      try {
        const res = await predictThreat({
          domain: scanResult.domain,
          business_type: userProfile?.website_type || 'other',
          findings: scanResult.findings || [],
          score: scanResult.score || 50,
        })
        if (!cancelled) setPrediction(res?.error ? null : res)
      } catch (e) {
        if (!cancelled) setError('Prediction unavailable')
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    run()
    return () => {
      cancelled = true
    }
  }, [scanResult, userProfile?.website_type])

  if (!scanResult) return null

  return (
    <section className="border-t pt-8" style={{ borderColor: '#35211A' }}>
      <p className="label-accent mb-6">- 30-DAY PREDICTIVE THREAT</p>

      {loading && (
        <div className="card">
          <p className="body-copy">Running predictive scoring…</p>
        </div>
      )}

      {error && (
        <div className="card">
          <p className="label-sm" style={{ color: '#DC9F85' }}>
            {error}
          </p>
        </div>
      )}

      {prediction && (
        <div className="space-y-6">
          <div className="card" style={{ borderColor: prediction.threat_probability >= 75 ? '#DC9F85' : '#35211A' }}>
            <div className="flex items-start justify-between gap-6">
              <div>
                <p className="label-sm" style={{ color: 'var(--text-2)' }}>PREDICTED THREAT SCORE</p>
                <p className="display-lg" style={{ color: threatColor(prediction.threat_probability) }}>
                  {prediction.threat_probability}
                </p>
                <p className="label-sm" style={{ color: '#B6A596' }}>Primary threat: {prediction.primary_threat}</p>
              </div>
              <div style={{ flex: 1, minWidth: 180 }}>
                <p className="label-sm mb-2">TRAJECTORY BAR</p>
                <div className="h-px" style={{ background: '#35211A' }}>
                  <div
                    className="h-px"
                    style={{
                      width: `${Math.max(0, Math.min(100, prediction.threat_probability))}%`,
                      background: threatColor(prediction.threat_probability),
                      height: 2,
                    }}
                  />
                </div>
                <p className="label-sm text-right mt-2" style={{ color: 'var(--text-2)' }}>Likely attack window: {prediction.days_until_likely_attack || 30} days</p>
              </div>
            </div>
          </div>

          <div className="card">
            <p className="label-accent mb-3">KEY DRIVERS</p>
            <p className="body-copy mb-4">{prediction.threat_description}</p>
            {prediction.active_campaigns?.length ? (
              <div className="space-y-2">
                {prediction.active_campaigns.map((campaign, idx) => (
                  <div
                    key={`${campaign.campaign_name}-${idx}`}
                    className="p-3 rounded-xl"
                    style={{ background: 'var(--bg-card-2)', border: '1px solid var(--border)' }}
                  >
                    <div className="flex justify-between gap-4">
                      <p className="label-sm" style={{ color: '#EBDCC4' }}>
                        {campaign.campaign_name || 'Unknown'}
                      </p>
                      <p className="label-sm" style={{ color: '#DC9F85' }}>
                        {campaign.businesses_hit || 0} HIT
                      </p>
                    </div>
                    <p className="label-sm mt-1" style={{ color: '#B6A596' }}>{campaign.method}</p>
                    <p className="label-sm mt-1" style={{ color: 'var(--text-2)' }}>{campaign.relevance}</p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="body-copy">No active campaigns returned. Priorities: {(prediction.protection_priority || []).join(', ')}</p>
            )}
          </div>
        </div>
      )}
    </section>
  )
}
