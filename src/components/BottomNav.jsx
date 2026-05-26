function truncatePseudo(pseudo) {
  if (!pseudo) return 'Profil'
  return pseudo.length > 12 ? pseudo.slice(0, 12) + '...' : pseudo
}

export default function BottomNav({ activeTab, onTabChange, onReport, user, isNearGPS, pseudo }) {
  return (
    <nav className="bottom-nav">
      <button
        className={`nav-item ${activeTab === 'carte' ? 'active' : ''}`}
        onClick={() => onTabChange('carte')}
      >
        <span className="nav-icon">🗺️</span>
        <span className="nav-label">Carte</span>
      </button>

      <div className="nav-report-wrap">
        <button
          className={`nav-report-btn ${isNearGPS ? '' : 'distant'}`}
          onClick={onReport}
        >
          <span className="nav-report-icon">🦟</span>
          {!isNearGPS && <span className="nav-report-badge">📍</span>}
        </button>
        <span className="nav-report-label">{isNearGPS ? 'Signaler' : 'Signaler ici'}</span>
      </div>

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
