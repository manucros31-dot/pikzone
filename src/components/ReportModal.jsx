import { useState, useEffect } from 'react'
import { getPeriode } from '../lib/geo'

const LEVELS = [
  { value: 'infeste', label: 'Infesté',  emoji: '🚨', desc: 'Nuage de moustiques', color: '#ef4444', bg: '#fef2f2' },
  { value: 'beaucoup', label: 'Beaucoup', emoji: '😤', desc: 'Très présents',       color: '#f97316', bg: '#fff7ed' },
  { value: 'peu',     label: 'Peu',      emoji: '😐', desc: 'Quelques-uns',         color: '#eab308', bg: '#fefce8' },
  { value: 'aucun',   label: 'Aucun',    emoji: '😌', desc: 'Zone tranquille',      color: '#22c55e', bg: '#f0fdf4' },
]

const PERIODES = [
  { value: 'matin', label: '🌅 Matin',   desc: '5h–13h'  },
  { value: 'aprem', label: '☀️ Après-midi', desc: '13h–18h' },
  { value: 'soir',  label: '🌙 Soir',    desc: '18h–5h'  },
]

function todayISO() {
  return new Date().toISOString().split('T')[0]
}

async function reverseGeocode(lat, lng) {
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json`,
      { headers: { 'Accept-Language': 'fr' } }
    )
    const data = await res.json()
    const a = data.address ?? {}
    return a.city || a.town || a.village || a.municipality || a.county || data.display_name?.split(',')[0] || 'cette zone'
  } catch {
    return 'cette zone'
  }
}

export default function ReportModal({ onSubmit, onClose, hasPosition, isNearGPS, position, mapCenter }) {
  const isModeA = isNearGPS && hasPosition

  // Step management (mode B only)
  const [step, setStep] = useState(1)

  // Common
  const [selected, setSelected] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  // Mode B extras
  const [dateSignalement, setDateSignalement] = useState(todayISO())
  const [periode, setPeriode] = useState(getPeriode())
  const [locationName, setLocationName] = useState(null)
  const [geocoding, setGeocoding] = useState(false)

  // Reverse geocode map center for mode B
  useEffect(() => {
    if (!isModeA && mapCenter) {
      setGeocoding(true)
      reverseGeocode(mapCenter.lat, mapCenter.lng).then((name) => {
        setLocationName(name)
        setGeocoding(false)
      })
    }
  }, [isModeA, mapCenter?.lat, mapCenter?.lng])

  async function handleSubmit() {
    if (!selected) return
    setLoading(true)
    setError(null)
    try {
      const coords = isModeA
        ? { lat: position.lat, lng: position.lng }
        : { lat: mapCenter.lat, lng: mapCenter.lng }

      await onSubmit({
        niveau: selected,
        lat: coords.lat,
        lng: coords.lng,
        date_signalement: isModeA ? todayISO() : dateSignalement,
        periode: isModeA ? getPeriode() : periode,
        mode_signalement: isModeA ? 'direct' : 'distant',
      })
    } catch (e) {
      setError(e?.message || 'Erreur inconnue')
    } finally {
      setLoading(false)
    }
  }

  // ── MODE A ────────────────────────────────────────────────────────────────────
  if (isModeA) {
    return (
      <div className="modal-backdrop" onClick={onClose}>
        <div className="modal-content" onClick={(e) => e.stopPropagation()}>
          <div className="modal-handle" />
          <h2 className="modal-title">🦟 Signaler ma zone</h2>
          <p className="modal-subtitle">Quel est le niveau autour de vous ?</p>

          <div className="report-mode-chip report-mode-direct">
            🎯 Signalement direct · {new Date().toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })} · {PERIODES.find(p => p.value === getPeriode())?.label}
          </div>

          {error && (
            <div className="location-warning" style={{ borderColor: '#f87171', background: '#fef2f2', color: '#991b1b' }}>
              Erreur : {error}
            </div>
          )}

          <div className="level-grid">
            {LEVELS.map((level) => (
              <button
                key={level.value}
                className={`level-card ${selected === level.value ? 'selected' : ''}`}
                style={{ '--card-color': level.color, '--card-bg': level.bg }}
                onClick={() => setSelected(level.value)}
              >
                <span className="level-emoji">{level.emoji}</span>
                <span className="level-label">{level.label}</span>
                <span className="level-desc">{level.desc}</span>
              </button>
            ))}
          </div>

          <button
            className="submit-btn"
            onClick={handleSubmit}
            disabled={!selected || loading}
          >
            {loading ? 'Envoi…' : 'Envoyer le signalement'}
          </button>
        </div>
      </div>
    )
  }

  // ── MODE B — STEP 1 : niveau ──────────────────────────────────────────────────
  if (step === 1) {
    return (
      <div className="modal-backdrop" onClick={onClose}>
        <div className="modal-content" onClick={(e) => e.stopPropagation()}>
          <div className="modal-handle" />

          <div className="report-modal-header">
            <div>
              <h2 className="modal-title">📍 Signaler ici</h2>
              <p className="modal-subtitle">
                {geocoding ? 'Localisation…' : `Zone : ${locationName ?? '…'}`}
              </p>
            </div>
            <div className="report-steps">
              <span className="report-step active">1</span>
              <span className="report-step-line" />
              <span className="report-step">2</span>
            </div>
          </div>

          <div className="report-mode-chip report-mode-distant">
            📍 Signalement distant · centre de la carte
          </div>

          {error && (
            <div className="location-warning" style={{ borderColor: '#f87171', background: '#fef2f2', color: '#991b1b' }}>
              Erreur : {error}
            </div>
          )}

          <div className="level-grid">
            {LEVELS.map((level) => (
              <button
                key={level.value}
                className={`level-card ${selected === level.value ? 'selected' : ''}`}
                style={{ '--card-color': level.color, '--card-bg': level.bg }}
                onClick={() => setSelected(level.value)}
              >
                <span className="level-emoji">{level.emoji}</span>
                <span className="level-label">{level.label}</span>
                <span className="level-desc">{level.desc}</span>
              </button>
            ))}
          </div>

          <button
            className="submit-btn"
            onClick={() => { if (selected) setStep(2) }}
            disabled={!selected}
          >
            Suivant →
          </button>
        </div>
      </div>
    )
  }

  // ── MODE B — STEP 2 : date + période ─────────────────────────────────────────
  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-handle" />

        <div className="report-modal-header">
          <div>
            <h2 className="modal-title">📍 Signaler ici</h2>
            <p className="modal-subtitle">Date et période de l'observation</p>
          </div>
          <div className="report-steps">
            <span className="report-step done">✓</span>
            <span className="report-step-line done" />
            <span className="report-step active">2</span>
          </div>
        </div>

        <div className="report-section-label">📅 Date du signalement</div>
        <input
          type="date"
          className="form-input report-date-input"
          value={dateSignalement}
          max={todayISO()}
          onChange={(e) => setDateSignalement(e.target.value)}
        />

        <div className="report-section-label" style={{ marginTop: 14 }}>🕐 Période</div>
        <div className="report-periode-grid">
          {PERIODES.map((p) => (
            <button
              key={p.value}
              className={`report-periode-btn ${periode === p.value ? 'active' : ''}`}
              onClick={() => setPeriode(p.value)}
            >
              <span className="rp-label">{p.label}</span>
              <span className="rp-desc">{p.desc}</span>
            </button>
          ))}
        </div>

        {error && (
          <div className="location-warning" style={{ borderColor: '#f87171', background: '#fef2f2', color: '#991b1b', marginTop: 12 }}>
            Erreur : {error}
          </div>
        )}

        <div className="report-b-actions">
          <button className="report-back-btn" onClick={() => setStep(1)}>← Retour</button>
          <button
            className="submit-btn"
            style={{ flex: 1 }}
            onClick={handleSubmit}
            disabled={loading}
          >
            {loading ? 'Envoi…' : 'Envoyer'}
          </button>
        </div>
      </div>
    </div>
  )
}
