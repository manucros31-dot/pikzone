function truncatePseudo(pseudo) {
  if (!pseudo) return 'Profil'
  return pseudo.length > 12 ? pseudo.slice(0, 12) + '...' : pseudo
}

export default function BottomNav({ activeTab, onTabChange, onReport, onReportBlocked, user, isNearGPS, pseudo }) {
  return (
    <nav className="bottom-nav">
      <button
        className={`nav-item ${activeTab === 'carte' ? 'active' : ''}`}
        onClick={() => onTabChange('carte')}
      >
        <span className="nav-icon">🗺️</span>
        <span className="nav-label">Carte</span>
      </button>

      <button
        className={`nav-report-btn ${!isNearGPS ? 'locked' : ''}`}
        onClick={isNearGPS ? onReport : onReportBlocked}
      >
        <span className="nav-report-icon">{isNearGPS ? '🦟' : '🔒'}</span>
      </button>

      <button
        className={`nav-item ${activeTab === 'profil' ? 'active' : ''}`}
        onClick={() => onTabChange('profil')}
      >
        <span className="nav-icon">{user ? '👤' : '🔑'}</span>
        <span className="nav-label">{user ? truncatePseudo(pseudo) : 'Connexion'}</span>
      </button>

      <button
        className={`nav-item ${activeTab === 'badges' ? 'active' : ''}`}
        onClick={() => onTabChange('badges')}
      >
        <span className="nav-icon">🏆</span>
        <span className="nav-label">Badges</span>
      </button>
    </nav>
  )
}
