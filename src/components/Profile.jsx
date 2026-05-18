import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { haversineM } from '../lib/geo'

// ─── Badges ───────────────────────────────────────────────────────────────────

const BADGES = [
  { emoji: '⚔️', title: 'Guerre aux Moustiques', min: 1,  max: 19, color: '#16a34a', bg: '#dcfce7' },
  { emoji: '🛡️', title: 'Anti-Moustiques',        min: 20, max: 39, color: '#2563eb', bg: '#dbeafe' },
  { emoji: '💀', title: 'Moustique Destructeur',  min: 40, max: Infinity, color: '#dc2626', bg: '#fee2e2' },
]

function currentBadge(count) {
  if (count >= 40) return BADGES[2]
  if (count >= 20) return BADGES[1]
  if (count >= 1)  return BADGES[0]
  return null
}

function getProgress(count) {
  if (count < 1)  return { pct: 0, label: 'Faites votre premier signalement !' }
  if (count < 20) {
    const n = 20 - count
    return { pct: (count / 20) * 100, label: `Plus que ${n} signalement${n > 1 ? 's' : ''} pour le badge suivant` }
  }
  if (count < 40) {
    const n = 40 - count
    return { pct: ((count - 20) / 20) * 100, label: `Plus que ${n} signalement${n > 1 ? 's' : ''} pour le badge suivant` }
  }
  return { pct: 100, label: '🏆 Badge maximum atteint !' }
}

function congratsText(pseudo, count) {
  if (count >= 40) return `Légendaire ${pseudo} ! Tu es un pilier de PikZone. Tu protèges des milliers de personnes !`
  if (count >= 20) return `Impressionnant ${pseudo} ! Tu es un vrai combattant anti-moustiques. La communauté te remercie !`
  return `Bravo ${pseudo} ! Tu as rejoint la communauté PikZone. Chaque signalement compte pour protéger ta communauté !`
}

function formatTime(minutes) {
  if (!minutes || minutes < 1) return '< 1 min'
  if (minutes < 60) return `${minutes} min`
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  return m > 0 ? `${h}h${m}` : `${h}h`
}

function countDistinctZones(reports) {
  const clusters = []
  for (const r of reports) {
    let merged = false
    for (const c of clusters) {
      if (haversineM(r.latitude, r.longitude, c.lat, c.lng) <= 200) { merged = true; break }
    }
    if (!merged) clusters.push({ lat: r.latitude, lng: r.longitude })
  }
  return clusters.length
}

// ─── Astuces (statique) ───────────────────────────────────────────────────────

const TIPS = [
  {
    icon: '🪤', title: 'Pièges naturels', color: '#B71C1C',
    items: [
      'Piège à CO₂ DIY : mélange eau + sucre + levure dans une bouteille coupée, retourner le haut, couvrir de noir. Attire les femelles qui pondent.',
      'Piège pondoir : récipient sombre avec eau + paille en décomposition. Vider chaque semaine pour éliminer les larves.',
      'Bac à Gambusie : ces petits poissons mangent les larves, parfait pour les bassins de jardin.',
    ],
  },
  {
    icon: '🌿', title: 'Plantes répulsives', color: '#1E6B2E',
    items: [
      'Citronnelle (Cymbopogon nardus) : la plus efficace, en pot sur la terrasse',
      'Basilic : double usage cuisine + répulsif',
      'Lavande : répulsive ET décorative',
      'Géranium rosat : huile essentielle naturelle très efficace',
      'Menthe poivrée : en bordure de jardin',
    ],
  },
  {
    icon: '🏪', title: 'Solutions boutique', color: '#E65100',
    items: [
      'Diffuseur à ultrasons : efficace en intérieur, silencieux',
      'Lampe UV à LED : attire et électrocute, sans produit chimique',
      'Bracelet répulsif à l\'eucalyptus : pratique pour les enfants',
      'Moustiquaire imprégnée de perméthrine : pour les fenêtres et le lit',
      'Spray répulsif DEET 20-30% : le plus efficace pour les zones très infestées',
    ],
  },
  {
    icon: '💧', title: 'Éliminer les gîtes larvaires', color: '#1565C0',
    items: [
      'Vider les soucoupes de pots de fleurs chaque semaine',
      'Changer l\'eau des vases tous les 3 jours',
      'Couvrir les récupérateurs d\'eau de pluie',
      'Nettoyer les gouttières (eau stagnante !)',
      'Mettre du sable humide dans les soucoupes plutôt que de l\'eau',
    ],
  },
  {
    icon: '🏠', title: 'Protéger sa maison', color: '#6A1B9A',
    items: [
      'Installer des moustiquaires aux fenêtres et portes',
      'Utiliser un ventilateur : les moustiques volent mal dans le vent',
      'Climatisation : les moustiques détestent le froid',
      'Habiller les enfants en couleurs claires (les moustiques sont attirés par le sombre)',
      'Éviter les parfums forts le soir (les moustiques sont attirés par les odeurs)',
    ],
  },
]

// ─── Composant ────────────────────────────────────────────────────────────────

export default function Profile({ user, profile, reportCount }) {
  const [stats, setStats] = useState(null)

  useEffect(() => {
    if (!user) return
    fetchStats()
  }, [user?.id, reportCount])

  async function fetchStats() {
    // 1. Premier signalement (date d'inscription effective)
    const { data: firstData } = await supabase
      .from('signalements')
      .select('created_at')
      .eq('auth_user_id', user.id)
      .order('created_at', { ascending: true })
      .limit(1)

    // 2. Tous les signalements pour les zones distinctes
    const { data: allReports } = await supabase
      .from('signalements')
      .select('latitude, longitude')
      .eq('auth_user_id', user.id)

    // 3. Signalements ce mois-ci
    const startOfMonth = new Date()
    startOfMonth.setDate(1); startOfMonth.setHours(0, 0, 0, 0)
    const { count: monthCount } = await supabase
      .from('signalements')
      .select('*', { count: 'exact', head: true })
      .eq('auth_user_id', user.id)
      .gte('created_at', startOfMonth.toISOString())

    // 4. Temps total depuis les sessions
    const { data: sessionData } = await supabase
      .from('sessions')
      .select('duration_minutes')
      .eq('user_id', user.id)
    const totalMinutes = (sessionData ?? []).reduce((s, r) => s + (r.duration_minutes ?? 0), 0)

    // 5. Classement communauté (tous les auth_user_ids avec leurs comptes)
    const { data: rankData } = await supabase
      .from('signalements')
      .select('auth_user_id')
      .not('auth_user_id', 'is', null)

    let ranking = null
    if (rankData) {
      const counts = {}
      for (const r of rankData) counts[r.auth_user_id] = (counts[r.auth_user_id] ?? 0) + 1
      const allCounts = Object.values(counts)
      const total = allCounts.length
      if (total > 0) {
        const withMore = allCounts.filter(c => c > reportCount).length
        const pct = Math.round((withMore / total) * 100)
        ranking = pct === 0 ? 'Top 1% 🏆' : `Top ${pct + 1}%`
      }
    }

    setStats({
      firstReport: firstData?.[0]?.created_at ?? null,
      totalMinutes,
      distinctZones: countDistinctZones(allReports ?? []),
      monthCount: monthCount ?? 0,
      ranking,
    })
  }

  async function handleLogout() {
    await supabase.auth.signOut()
  }

  if (!user || !profile) return null

  const badge    = currentBadge(reportCount)
  const progress = getProgress(reportCount)

  return (
    <div className="profile-page">

      {/* ── En-tête ── */}
      <div className="profile-header">
        <div className="profile-avatar">{profile.pseudo?.[0]?.toUpperCase() ?? '?'}</div>
        <p className="profile-pseudo">@{profile.pseudo}</p>
        <p className="profile-name">{profile.prenom} {profile.nom}</p>
        <p className="profile-email">{user.email}</p>
      </div>

      {/* ── Deux colonnes ── */}
      <div className="profile-columns">

        {/* ── COLONNE GAUCHE : badge + stats ── */}
        <div className="profile-col">

          {/* Badge actuel */}
          {badge && (
            <div className="prof-badge-card" style={{ background: badge.bg, borderColor: badge.color }}>
              <div className="prof-badge-emoji">{badge.emoji}</div>
              <div className="prof-badge-title" style={{ color: badge.color }}>{badge.title}</div>
              <p className="prof-badge-congrats">{congratsText(profile.pseudo, reportCount)}</p>
              <div className="prof-progress-wrap">
                <div className="prof-progress-track">
                  <div className="prof-progress-fill" style={{ width: `${progress.pct}%`, background: badge.color }} />
                </div>
                <p className="prof-progress-label">{progress.label}</p>
              </div>
            </div>
          )}

          {/* Statistiques */}
          <h3 className="prof-section-title">Mes statistiques</h3>
          <div className="prof-stats-grid">
            <div className="prof-stat-card">
              <span className="prof-stat-icon">🦟</span>
              <span className="prof-stat-value">{reportCount}</span>
              <span className="prof-stat-label">signalements</span>
            </div>
            <div className="prof-stat-card">
              <span className="prof-stat-icon">📆</span>
              <span className="prof-stat-value">{stats?.monthCount ?? '—'}</span>
              <span className="prof-stat-label">ce mois-ci</span>
            </div>
            <div className="prof-stat-card">
              <span className="prof-stat-icon">📍</span>
              <span className="prof-stat-value">{stats?.distinctZones ?? '—'}</span>
              <span className="prof-stat-label">zones</span>
            </div>
            <div className="prof-stat-card">
              <span className="prof-stat-icon">⏱️</span>
              <span className="prof-stat-value">{stats ? formatTime(stats.totalMinutes) : '—'}</span>
              <span className="prof-stat-label">sur l'app</span>
            </div>
            <div className="prof-stat-card">
              <span className="prof-stat-icon">📅</span>
              <span className="prof-stat-value">
                {stats?.firstReport
                  ? new Date(stats.firstReport).toLocaleDateString('fr-FR', { month: 'short', year: 'numeric' })
                  : '—'}
              </span>
              <span className="prof-stat-label">membre depuis</span>
            </div>
            <div className="prof-stat-card">
              <span className="prof-stat-icon">🏆</span>
              <span className="prof-stat-value">{stats?.ranking ?? '—'}</span>
              <span className="prof-stat-label">classement</span>
            </div>
          </div>
        </div>

        {/* ── COLONNE DROITE : astuces ── */}
        <div className="profile-col">
          <h3 className="prof-section-title">💡 Astuces & Solutions</h3>
          {TIPS.map((tip) => (
            <div key={tip.title} className="tip-card">
              <div className="tip-header" style={{ color: tip.color }}>
                <span className="tip-icon">{tip.icon}</span>
                <span className="tip-title">{tip.title}</span>
              </div>
              <ul className="tip-list">
                {tip.items.map((item, i) => (
                  <li key={i} className="tip-item">{item}</li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>

      {/* ── Déconnexion ── */}
      <button className="logout-btn" onClick={handleLogout}>
        Se déconnecter
      </button>
    </div>
  )
}
