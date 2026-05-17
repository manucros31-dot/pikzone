const BADGES = [
  {
    id: 'first',
    emoji: '🎖️',
    title: 'Guerre aux Moustiques',
    desc: 'Premier signalement effectué',
    threshold: 1,
    color: '#16a34a',
    bg: '#dcfce7',
  },
  {
    id: 'anti',
    emoji: '🛡️',
    title: 'Anti-Moustiques',
    desc: '20 signalements effectués',
    threshold: 20,
    color: '#2563eb',
    bg: '#dbeafe',
  },
  {
    id: 'destroyer',
    emoji: '💥',
    title: 'Moustique Destructeur',
    desc: '40 signalements effectués',
    threshold: 40,
    color: '#dc2626',
    bg: '#fee2e2',
  },
]

function ProgressBar({ value, max, color }) {
  const pct = Math.min(100, (value / max) * 100)
  return (
    <div className="progress-track">
      <div className="progress-fill" style={{ width: `${pct}%`, background: color }} />
    </div>
  )
}

export default function Badges({ reportCount, user, onSignup }) {
  return (
    <div className="badges-page">
      <div className="badges-header">
        <span className="badges-icon">🦟</span>
        <h1 className="badges-title">Mes badges</h1>
        <p className="badges-count">
          <strong>{reportCount}</strong> signalement{reportCount !== 1 ? 's' : ''}
        </p>
        {!user && (
          <p className="badges-anon-note">
            Progression locale — non sauvegardée
          </p>
        )}
      </div>

      {!user && (
        <div className="badges-save-cta">
          <p>Créez un compte pour sauvegarder vos badges et suivre votre impact !</p>
          <button className="cta-btn" onClick={onSignup}>S'inscrire gratuitement</button>
        </div>
      )}

      <div className="badges-list">
        {BADGES.map((badge) => {
          const unlocked = reportCount >= badge.threshold
          return (
            <div
              key={badge.id}
              className={`badge-card ${unlocked ? 'unlocked' : 'locked'}`}
              style={unlocked ? { '--badge-bg': badge.bg, '--badge-color': badge.color } : {}}
            >
              <div className="badge-emoji">{unlocked ? badge.emoji : '🔒'}</div>
              <div className="badge-info">
                <p className="badge-title">{badge.title}</p>
                <p className="badge-desc">{badge.desc}</p>
                {!unlocked && (
                  <>
                    <ProgressBar value={reportCount} max={badge.threshold} color={badge.color} />
                    <p className="badge-progress">{reportCount}/{badge.threshold}</p>
                  </>
                )}
              </div>
              {unlocked && <div className="badge-check">✓</div>}
            </div>
          )
        })}
      </div>
    </div>
  )
}
