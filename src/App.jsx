import { useState, useEffect, useMemo } from 'react'
import Map from './components/Map'
import ReportModal from './components/ReportModal'
import Badges from './components/Badges'
import BottomNav from './components/BottomNav'
import AuthModal from './components/AuthModal'
import Profile from './components/Profile'
import PlanModal from './components/PlanModal'
import { supabase, getUserId } from './lib/supabase'
import InstallBanner from './components/InstallBanner'
import { NIVEAU_SCORE, haversineM, scoreToLabel, scoreToColor } from './lib/geo'
import useGeolocation from './hooks/useGeolocation'
import useAuth from './hooks/useAuth'
import './App.css'

function formatPeriodFR(planResult) {
  const opts = { month: 'long', year: 'numeric' }
  const start = new Date(planResult.startDate + 'T00:00:00').toLocaleDateString('fr-FR', opts)
  if (planResult.dateType === 'date') return start
  const end = new Date(planResult.endDate + 'T00:00:00').toLocaleDateString('fr-FR', opts)
  return start === end ? start : `${start} → ${end}`
}

export default function App() {
  const [activeTab, setActiveTab]       = useState('carte')
  const [showModal, setShowModal]       = useState(false)
  const [showAuth, setShowAuth]         = useState(null)
  const [showPlan, setShowPlan]         = useState(false)
  const [planResult, setPlanResult]     = useState(null)
  const [reports, setReports]           = useState([])
  const [userReportCount, setUserReportCount] = useState(0)
  const [profile, setProfile]           = useState(null)
  const [newBadge, setNewBadge]         = useState(null)
  const [showAnonUpsell, setShowAnonUpsell] = useState(false)

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
    const { data } = await supabase.from('profiles').select('*').eq('id', user.id).single()
    if (data) setProfile(data)
  }

  async function handleReport(niveau) {
    if (!position) return
    const insertData = { user_id: getUserId(), latitude: position.lat, longitude: position.lng, niveau }
    if (user) insertData.auth_user_id = user.id
    const { error } = await supabase.from('signalements').insert(insertData)
    if (error) throw new Error(error.message)
    setShowModal(false)
    const newCount = userReportCount + 1
    setUserReportCount(newCount)
    fetchReports()
    if (newCount === 1)        setNewBadge({ emoji: '🎖️', title: 'Guerre aux Moustiques' })
    else if (newCount === 20)  setNewBadge({ emoji: '🛡️', title: 'Anti-Moustiques' })
    else if (newCount === 40)  setNewBadge({ emoji: '💥', title: 'Moustique Destructeur' })
    if (!user) { setShowAnonUpsell(true); setTimeout(() => setShowAnonUpsell(false), 8000) }
  }

  function handleTabChange(tab) {
    if (tab === 'profil' && !user && !loading) setShowAuth('login')
    else setActiveTab(tab)
  }

  function handlePlanConfirm(result) {
    setPlanResult(result)
    setShowPlan(false)
    setActiveTab('carte')
  }

  // ─── Filtrage des signalements pour le mode plan ────────────────────────────

  const planStats = useMemo(() => {
    if (!planResult) return null
    const months = new Set(planResult.months)
    const nearby = reports.filter(
      (r) => haversineM(r.latitude, r.longitude, planResult.lat, planResult.lng) <= 200
    )
    const filtered = nearby.filter((r) => months.has(new Date(r.created_at).getMonth() + 1))
    const avgScore  = filtered.length > 0
      ? filtered.reduce((s, r) => s + (NIVEAU_SCORE[r.niveau] ?? 0), 0) / filtered.length
      : null
    return { count: filtered.length, avgScore, filtered }
  }, [reports, planResult])

  const visibleReports = planResult ? (planStats?.filtered ?? []) : reports

  if (loading) {
    return (
      <div className="app loading-screen">
        <span className="loading-mosquito">🦟</span>
      </div>
    )
  }

  return (
    <div className="app">
      {activeTab === 'carte' && <Map reports={visibleReports} position={position} planResult={planResult} />}
      {activeTab === 'badges' && (
        <Badges reportCount={userReportCount} user={user} onSignup={() => setShowAuth('register')} />
      )}
      {activeTab === 'profil' && user && (
        <Profile user={user} profile={profile} reportCount={userReportCount} />
      )}

      {/* ── Bouton pastille Je planifie ── */}
      {activeTab === 'carte' && (
        <button className="plan-pill" onClick={() => setShowPlan(true)}>
          <span>📅</span>
          <span>Je planifie</span>
        </button>
      )}

      {/* ── Bannière résultat plan ── */}
      {activeTab === 'carte' && planResult && planStats && (
        <div className="plan-banner">
          <div className="plan-banner-content">
            <p className="plan-banner-location">📍 {planResult.displayName}</p>
            <p className="plan-banner-period">{formatPeriodFR(planResult)}</p>
            {planStats.count > 0 ? (
              <p className="plan-banner-score">
                🦟 {planStats.count} signalement{planStats.count > 1 ? 's' : ''} — Niveau moyen&nbsp;
                <span
                  className="plan-banner-level"
                  style={{ background: scoreToColor(planStats.avgScore) }}
                >
                  {scoreToLabel(planStats.avgScore)}
                </span>
              </p>
            ) : (
              <p className="plan-banner-score">
                Aucun signalement connu pour cette zone.
                Les données apparaîtront quand des utilisateurs seront sur place.
              </p>
            )}
          </div>
          <div className="plan-banner-actions">
            <button className="plan-banner-clear" onClick={() => setPlanResult(null)}>
              Effacer la recherche ✕
            </button>
          </div>
        </div>
      )}

      {/* ── Modals ── */}
      {showPlan && <PlanModal onClose={() => setShowPlan(false)} onConfirm={handlePlanConfirm} />}

      {showModal && (
        <ReportModal onSubmit={handleReport} onClose={() => setShowModal(false)} hasPosition={!!position} />
      )}

      {showAuth && <AuthModal initialMode={showAuth} onClose={() => setShowAuth(null)} />}

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
          <button className="upsell-btn" onClick={() => { setShowAnonUpsell(false); setShowAuth('register') }}>
            S'inscrire
          </button>
          <button className="upsell-close" onClick={() => setShowAnonUpsell(false)}>✕</button>
        </div>
      )}

      <BottomNav activeTab={activeTab} onTabChange={handleTabChange} onReport={() => setShowModal(true)} user={user} />
      <InstallBanner />
    </div>
  )
}
