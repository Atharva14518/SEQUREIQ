export default function ScoreGauge({ score }) {
  const color = score < 40 ? '#DC9F85' : score < 70 ? '#B6A596' : '#EBDCC4'
  return (
    <div className="w-full">
      <p className="label-sm mb-3" style={{ color: 'var(--text-2)' }}>SECURITY SCORE</p>
      <p className="display-lg leading-none" style={{ color }}>{score}</p>
      <div className="mt-4 h-px w-full" style={{ background: '#35211A' }}>
        <div
          className="h-px"
          style={{
            width: `${Math.max(0, Math.min(100, score))}%`,
            background: '#DC9F85',
            transition: 'width 1s cubic-bezier(0.16,1,0.3,1)',
          }}
        />
      </div>
      <p className="label-sm text-right mt-2" style={{ color: 'var(--text-2)' }}>/ 100</p>
    </div>
  )
}
