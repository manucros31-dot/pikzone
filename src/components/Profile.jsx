import { supabase } from '../lib/supabase'

const BADGES = [
  { emoji: '🎖️', title: 'Guerre aux Moustiques', threshold: 1, color: '#16a34a', bg: '#dcfce7' },
  { emoji: '🛡️', title: 'Anti-Moustiques', threshold: 20, color: '#2563eb', bg: '#dbeafe' },
  { emoji: '💥', title: 'Moustique Destructeur', threshold: 40, color: '#dc2626', bg: '#fee2e2' },
]

function nextBadge(count) {
  return BADGES.find((b) => count < b.threshold) ?? null
}

function ProgressBar({ value, max, color }) {
  const pct = Math.min(100, (value / max) * 100)
  return (
    <div className="progress-track">
      <div className="progress-fill" style={{ width: `${pct}%`, background: color }} />
    </div>
  )
}

export default function Profile({ user, profile, reportCount }) {
  const unlockedBadges = BADGES.filter((b) => reportCount >= b.threshold)
  const next = nextBadge(reportCount)

  async function handleLogout() {
    await supabase.auth.signOut()
  }

  if (!user || !profile) return null

  return (
    <div className="profile-page">
      <div className="profile-header">
        <div className="profile-avatar">{profile.pseudo?.[0]?.toUpperCase() ?? '?'}</div>
        <p className="profile-pseudo">@{profile.pseudo}</p>
        <p className="profile-name">{profile.prenom} {profile.nom}</p>
        <p className="profile-email">{user.email}</p>
      </div>

      <div className="profile-stat-card">
        <span className="stat-number">{reportCount}</span>
        <span className="stat-label">signalement{reportCount !== 1 ? 's' : ''}</span>
      </div>

      {next && (
        <div className="profile-next-badge">
          <p className="next-badge-label">Prochain badge : <strong>{next.title}</strong></p>
          <ProgressBar value={reportCount} max={next.threshold} color={next.color} />
          <p className="next-badge-progress">{reportCount} / {next.threshold}</p>
        </div>
      )}

      <div className="profile-badges-section">
        <h2 className="section-title">Mes badges</h2>
        {unlockedBadges.length === 0 ? (
          <p className="profile-empty">Faites votre premier signalement pour débloquer un badge !</p>
        ) : (
          unlockedBadges.map((badge) => (
            <div
              key={badge.title}
              className="badge-card unlocked"
              style={{ '--badge-bg': badge.bg, '--badge-color': badge.color }}
            >
              <div className="badge-emoji">{badge.emoji}</div>
              <div className="badge-info">
                <p className="badge-title">{badge.title}</p>
                <p className="badge-desc">Débloqué ✓</p>
              </div>
              <div className="badge-check">✓</div>
            </div>
          ))
        )}
      </div>

      <button className="logout-btn" onClick={handleLogout}>
        Se déconnecter
      </button>
    </div>
  )
}
