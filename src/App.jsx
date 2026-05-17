import { useState, useEffect } from 'react'
import Map from './components/Map'
import ReportModal from './components/ReportModal'
import Badges from './components/Badges'
import BottomNav from './components/BottomNav'
import AuthModal from './components/AuthModal'
import Profile from './components/Profile'
import { supabase, getUserId } from './lib/supabase'
import useGeolocation from './hooks/useGeolocation'
import useAuth from './hooks/useAuth'
import './App.css'

export default function App() {
  const [activeTab, setActiveTab] = useState('carte')
  const [showModal, setShowModal] = useState(false)
  const [showAuth, setShowAuth] = useState(null) // 'login' | 'register' | null
  const [reports, setReports] = useState([])
  const [userReportCount, setUserReportCount] = useState(0)
  const [profile, setProfile] = useState(null)
  const [newBadge, setNewBadge] = useState(null)
  const [showAnonUpsell, setShowAnonUpsell] = useState(false)

  const position = useGeolocation()
  const { user, loading } = useAuth()

  useEffect(() => {
    fetchReports()
  }, [])

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
    if (tab === 'profil' && !user && !loading) {
      setShowAuth('login')
    } else {
      setActiveTab(tab)
    }
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
      {activeTab === 'carte' && <Map reports={reports} position={position} />}
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

      {showModal && (
        <ReportModal
          onSubmit={handleReport}
          onClose={() => setShowModal(false)}
          hasPosition={!!position}
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
        user={user}
      />
    </div>
  )
}
