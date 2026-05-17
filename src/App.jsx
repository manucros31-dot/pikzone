import { useState, useEffect } from 'react'
import Map from './components/Map'
import ReportModal from './components/ReportModal'
import Badges from './components/Badges'
import BottomNav from './components/BottomNav'
import AuthModal from './components/AuthModal'
import Profile from './components/Profile'
import ContestModal from './components/ContestModal'
import { supabase, getUserId } from './lib/supabase'
import useGeolocation from './hooks/useGeolocation'
import useAuth from './hooks/useAuth'
import './App.css'

function ContestDisclaimer({ onDone, onCancel }) {
  return (
    <div className="disclaimer-overlay">
      <div className="disclaimer-box">
        <p className="disclaimer-text">
          Les informations affichées sur PICZONE sont exclusivement issues de
          signalements volontaires de la communauté d'utilisateurs. Elles reflètent
          un ressenti subjectif à un instant donné et ne constituent en aucun cas
          une expertise scientifique, sanitaire ou commerciale.{' '}
          <strong>[Nom de votre société]</strong> ne peut être tenu responsable des
          décisions prises sur la base de ces informations. Toute donnée peut être
          contestée via le bouton "Contester".
        </p>
        <div className="disclaimer-actions">
          <button className="cancel-btn" onClick={onCancel}>Annuler</button>
          <button className="submit-btn" style={{ flex: 1 }} onClick={onDone}>
            J'ai compris
          </button>
        </div>
      </div>
    </div>
  )
}

export default function App() {
  const [activeTab, setActiveTab] = useState('carte')
  const [showModal, setShowModal] = useState(false)
  const [showAuth, setShowAuth] = useState(null)
  const [reports, setReports] = useState([])
  const [userReportCount, setUserReportCount] = useState(0)
  const [profile, setProfile] = useState(null)
  const [newBadge, setNewBadge] = useState(null)
  const [showAnonUpsell, setShowAnonUpsell] = useState(false)
  const [contestMode, setContestMode] = useState(false)
  const [contestZone, setContestZone] = useState(null)
  const [contestToast, setContestToast] = useState(false)
  const [showContestDisclaimer, setShowContestDisclaimer] = useState(false)

  const position = useGeolocation()
  const { user, loading } = useAuth()

  useEffect(() => { fetchReports() }, [])
  useEffect(() => {
    fetchUserCount()
    if (user) fetchProfile()
    else setProfile(null)
  }, [user])

  async function fetchReports() {
    const { data } = await supabase
      .from('signalements')
      .select('*')
      .order('created_at', { ascending: false })
    if (data) setReports(data)
  }

  async function fetchUserCount() {
    if (user) {
      const { count } = await supabase
        .from('signalements')
        .select('*', { count: 'exact', head: true })
        .eq('auth_user_id', user.id)
      if (count !== null) setUserReportCount(count)
    } else {
      const { count } = await supabase
        .from('signalements')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', getUserId())
      if (count !== null) setUserReportCount(count)
    }
  }

  async function fetchProfile() {
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single()
    if (data) setProfile(data)
  }

  async function handleReport(niveau) {
    if (!position) return
    const insertData = {
      user_id: getUserId(),
      latitude: position.lat,
      longitude: position.lng,
      niveau,
    }
    if (user) insertData.auth_user_id = user.id

    const { error } = await supabase.from('signalements').insert(insertData)
    if (error) throw new Error(error.message)

    setShowModal(false)
    const newCount = userReportCount + 1
    setUserReportCount(newCount)
    fetchReports()

    if (newCount === 1) setNewBadge({ emoji: '🎖️', title: 'Guerre aux Moustiques' })
    else if (newCount === 20) setNewBadge({ emoji: '🛡️', title: 'Anti-Moustiques' })
    else if (newCount === 40) setNewBadge({ emoji: '💥', title: 'Moustique Destructeur' })

    if (!user) {
      setShowAnonUpsell(true)
      setTimeout(() => setShowAnonUpsell(false), 8000)
    }
  }

  function handleTabChange(tab) {
    setContestMode(false)
    if (tab === 'profil' && !user && !loading) {
      setShowAuth('login')
    } else {
      setActiveTab(tab)
    }
  }

  function handleContestToggle() {
    if (contestMode) {
      setContestMode(false)
      return
    }
    setActiveTab('carte')
    setShowContestDisclaimer(true)
  }

  function dismissDisclaimerAndActivate() {
    setShowContestDisclaimer(false)
    setContestMode(true)
  }

  function handleZoneSelect(zone) {
    setContestZone(zone)
    setContestMode(false)
  }

  function handleContestSuccess() {
    setContestToast(true)
    setTimeout(() => setContestToast(false), 5000)
  }

  if (loading) {
    return (
      <div className="app loading-screen">
        <span className="loading-mosquito">🦟</span>
      </div>
    )
  }

  return (
    <div className="app">
      {activeTab === 'carte' && (
        <Map
          reports={reports}
          position={position}
          contestMode={contestMode}
          onZoneSelect={handleZoneSelect}
        />
      )}
      {activeTab === 'badges' && (
        <Badges
          reportCount={userReportCount}
          user={user}
          onSignup={() => setShowAuth('register')}
        />
      )}
      {activeTab === 'profil' && user && (
        <Profile user={user} profile={profile} reportCount={userReportCount} />
      )}

      {contestMode && (
        <div className="contest-banner">
          <span>⚠️</span>
          <span>Appuyez sur la zone à contester</span>
          <button className="contest-banner-cancel" onClick={() => setContestMode(false)}>✕</button>
        </div>
      )}

      {showModal && (
        <ReportModal
          onSubmit={handleReport}
          onClose={() => setShowModal(false)}
          hasPosition={!!position}
        />
      )}

      {contestZone && (
        <ContestModal
          zone={contestZone}
          onClose={() => setContestZone(null)}
          onSuccess={handleContestSuccess}
        />
      )}

      {showAuth && (
        <AuthModal
          initialMode={showAuth}
          onClose={() => setShowAuth(null)}
        />
      )}

      {newBadge && (
        <div className="badge-toast" onClick={() => setNewBadge(null)}>
          <span className="toast-emoji">{newBadge.emoji}</span>
          <div>
            <p className="toast-label">Badge débloqué !</p>
            <p className="toast-title">{newBadge.title}</p>
          </div>
        </div>
      )}

      {contestToast && (
        <div className="badge-toast contest-toast" onClick={() => setContestToast(false)}>
          <span className="toast-emoji">✅</span>
          <div>
            <p className="toast-title">Contestation envoyée</p>
            <p className="toast-label">Nous l'examinerons sous 72h</p>
          </div>
        </div>
      )}

      {showContestDisclaimer && (
        <ContestDisclaimer
          onDone={dismissDisclaimerAndActivate}
          onCancel={() => setShowContestDisclaimer(false)}
        />
      )}

      {showAnonUpsell && (
        <div className="anon-upsell">
          <span>🏅 Créez un compte pour sauvegarder vos badges et suivre votre impact !</span>
          <button
            className="upsell-btn"
            onClick={() => { setShowAnonUpsell(false); setShowAuth('register') }}
          >
            S'inscrire
          </button>
          <button className="upsell-close" onClick={() => setShowAnonUpsell(false)}>✕</button>
        </div>
      )}

      <BottomNav
        activeTab={activeTab}
        onTabChange={handleTabChange}
        onReport={() => setShowModal(true)}
        onContest={handleContestToggle}
        contestMode={contestMode}
        user={user}
      />
    </div>
  )
}
