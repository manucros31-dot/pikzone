import { useState } from 'react'
import { supabase } from '../lib/supabase'

const LEVEL_LABELS = {
  infeste: 'Zone Infestée',
  beaucoup: 'Zone — Beaucoup',
  peu: 'Zone — Peu',
  aucun: 'Zone Calme',
}

const MOTIFS = [
  'Information inexacte ou exagérée',
  'Zone mal localisée',
  'Signalement abusif ou malveillant',
  'Impact commercial injustifié',
  'Autre',
]

export default function ContestModal({ zone, onClose, onSuccess }) {
  const [motif, setMotif] = useState('')
  const [commentaire, setCommentaire] = useState('')
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  async function handleSubmit(e) {
    e.preventDefault()
    if (!motif) { setError('Veuillez choisir un motif.'); return }
    setLoading(true)
    setError(null)

    const { error: dbError } = await supabase.from('contestations').insert({
      zone_id: zone.id,
      latitude: zone.latitude,
      longitude: zone.longitude,
      niveau: zone.niveau,
      motif,
      commentaire: commentaire.trim() || null,
      email: email.trim() || null,
    })

    if (dbError) {
      setError(dbError.message)
    } else {
      onSuccess()
      onClose()
    }
    setLoading(false)
  }

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-handle" />
        <h2 className="modal-title">⚠️ Contester cette zone</h2>

        <form onSubmit={handleSubmit} className="auth-form">
          <div className="contest-readonly-fields">
            <div className="contest-field-ro">
              <span className="contest-ro-label">Zone</span>
              <span className="contest-ro-value">{LEVEL_LABELS[zone.niveau] ?? zone.niveau}</span>
            </div>
            <div className="contest-field-ro">
              <span className="contest-ro-label">Coordonnées</span>
              <span className="contest-ro-value">
                {zone.latitude.toFixed(5)}, {zone.longitude.toFixed(5)}
              </span>
            </div>
          </div>

          {error && <div className="auth-error">{error}</div>}

          <div className="form-field">
            <label className="form-label">Motif *</label>
            <select
              className="form-input form-select"
              value={motif}
              onChange={(e) => setMotif(e.target.value)}
              required
            >
              <option value="">Choisir un motif…</option>
              {MOTIFS.map((m) => (
                <option key={m} value={m}>{m}</option>
              ))}
            </select>
          </div>

          <div className="form-field">
            <label className="form-label">
              Précisez si nécessaire{' '}
              <span className="form-hint">({commentaire.length}/300)</span>
            </label>
            <textarea
              className="form-input form-textarea"
              value={commentaire}
              onChange={(e) => setCommentaire(e.target.value)}
              maxLength={300}
              placeholder="Décrivez le problème en détail…"
              rows={3}
            />
          </div>

          <div className="form-field">
            <label className="form-label">
              Votre email pour être recontacté{' '}
              <span className="form-hint">(optionnel)</span>
            </label>
            <input
              className="form-input"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="votre@email.fr"
            />
          </div>

          <p className="contest-disclaimer">
            Les informations de PICZONE sont issues de la communauté.
            Toute contestation est examinée sous 72h.
          </p>

          <button className="submit-btn" type="submit" disabled={loading}>
            {loading ? 'Envoi…' : 'Envoyer la contestation'}
          </button>
          <button type="button" className="cancel-btn" onClick={onClose}>
            Annuler
          </button>
        </form>
      </div>
    </div>
  )
}
