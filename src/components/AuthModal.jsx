import { useState } from 'react'
import { supabase, getUserId } from '../lib/supabase'
import PrivacyPolicy from './PrivacyPolicy'

function translateAuthError(message) {
  if (!message) return 'Une erreur est survenue.'
  if (message.includes('Invalid login credentials'))
    return 'Email ou mot de passe incorrect.'
  if (message.includes('you can only request this after'))
    return 'Trop de tentatives. Veuillez patienter quelques secondes avant de réessayer.'
  if (message.includes('User already registered') || message.includes('already been registered'))
    return 'Un compte existe déjà avec cet email.'
  if (message.includes('Password should be at least'))
    return 'Le mot de passe doit faire au moins 8 caractères.'
  if (message.includes('Unable to validate email address'))
    return 'Adresse email invalide.'
  if (message.includes('Email rate limit exceeded'))
    return 'Trop d\'emails envoyés. Réessayez plus tard.'
  if (message.includes('row-level security') || message.includes('violates row-level'))
    return 'Erreur lors de la création du profil. Veuillez réessayer.'
  return message
}

async function transferAnonReports(userId) {
  const anonId = getUserId()
  await supabase
    .from('signalements')
    .update({ auth_user_id: userId })
    .eq('user_id', anonId)
    .is('auth_user_id', null)
}

export default function AuthModal({ onClose, initialMode = 'login' }) {
  const [mode, setMode] = useState(initialMode)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [success, setSuccess] = useState(null)
  const [showPrivacy, setShowPrivacy] = useState(false)

  // Champs connexion
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')

  // Champs inscription
  const [pseudo, setPseudo] = useState('')
  const [prenom, setPrenom] = useState('')
  const [nom, setNom] = useState('')
  const [emailReg, setEmailReg] = useState('')
  const [passwordReg, setPasswordReg] = useState('')
  const [passwordConfirm, setPasswordConfirm] = useState('')
  const [acceptCgu, setAcceptCgu] = useState(false)

  function switchMode(newMode) {
    setMode(newMode)
    setError(null)
    setSuccess(null)
  }

  async function handleLogin(e) {
    e.preventDefault()
    setLoading(true)
    setError(null)
    const { data, error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) {
      setError(translateAuthError(error.message))
    } else {
      await transferAnonReports(data.user.id)
      onClose()
    }
    setLoading(false)
  }

  async function handleRegister(e) {
    e.preventDefault()
    setLoading(true)
    setError(null)

    if (passwordReg !== passwordConfirm) {
      setError('Les mots de passe ne correspondent pas.')
      setLoading(false)
      return
    }
    if (passwordReg.length < 8) {
      setError('Le mot de passe doit faire au moins 8 caractères.')
      setLoading(false)
      return
    }
    if (!acceptCgu) {
      setError('Vous devez accepter les CGU et la politique de confidentialité.')
      setLoading(false)
      return
    }

    // Vérifier unicité du pseudo
    const { data: existing } = await supabase
      .from('profiles')
      .select('id')
      .eq('pseudo', pseudo)
      .maybeSingle()

    if (existing) {
      setError('Ce pseudo est déjà utilisé.')
      setLoading(false)
      return
    }

    const { data, error } = await supabase.auth.signUp({
      email: emailReg,
      password: passwordReg,
    })

    if (error) {
      setError(translateAuthError(error.message))
      setLoading(false)
      return
    }

    if (data.user) {
      const { error: profileError } = await supabase.from('profiles').insert({
        id: data.user.id,
        pseudo: pseudo.trim(),
        prenom: prenom.trim(),
        nom: nom.trim(),
      })
      if (profileError) {
        setError(profileError.message)
        setLoading(false)
        return
      }
      await transferAnonReports(data.user.id)
    }

    if (data.session) {
      onClose()
    } else {
      setSuccess('Compte créé ! Vérifiez votre email pour confirmer votre inscription.')
    }
    setLoading(false)
  }

  async function handleForgotPassword(e) {
    e.preventDefault()
    setLoading(true)
    setError(null)
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: window.location.origin,
    })
    if (error) setError(error.message)
    else setSuccess('Email de réinitialisation envoyé ! Vérifiez votre boîte mail.')
    setLoading(false)
  }

  if (showPrivacy) {
    return <PrivacyPolicy onClose={() => setShowPrivacy(false)} />
  }

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-content auth-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-handle" />

        {success ? (
          <div className="auth-success">
            <div className="success-icon">✓</div>
            <p>{success}</p>
            <button className="submit-btn" onClick={onClose} style={{ marginTop: 20 }}>
              Fermer
            </button>
          </div>
        ) : (
          <>
            {mode !== 'forgot' && (
              <div className="auth-tabs">
                <button
                  className={`auth-tab ${mode === 'login' ? 'active' : ''}`}
                  onClick={() => switchMode('login')}
                >
                  Connexion
                </button>
                <button
                  className={`auth-tab ${mode === 'register' ? 'active' : ''}`}
                  onClick={() => switchMode('register')}
                >
                  Inscription
                </button>
              </div>
            )}

            {error && <div className="auth-error">{error}</div>}

            {mode === 'login' && (
              <form onSubmit={handleLogin} className="auth-form">
                <div className="form-field">
                  <label className="form-label">Email</label>
                  <input
                    className="form-input"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    autoComplete="email"
                    placeholder="votre@email.fr"
                  />
                </div>
                <div className="form-field">
                  <label className="form-label">Mot de passe</label>
                  <input
                    className="form-input"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    autoComplete="current-password"
                    placeholder="••••••••"
                  />
                </div>
                <button className="submit-btn" type="submit" disabled={loading}>
                  {loading ? 'Connexion...' : 'Se connecter'}
                </button>
                <button
                  type="button"
                  className="auth-link"
                  onClick={() => switchMode('forgot')}
                >
                  Mot de passe oublié ?
                </button>
              </form>
            )}

            {mode === 'register' && (
              <form onSubmit={handleRegister} className="auth-form">
                <div className="form-row">
                  <div className="form-field">
                    <label className="form-label">Prénom *</label>
                    <input
                      className="form-input"
                      type="text"
                      value={prenom}
                      onChange={(e) => setPrenom(e.target.value)}
                      required
                      placeholder="Jean"
                    />
                  </div>
                  <div className="form-field">
                    <label className="form-label">Nom *</label>
                    <input
                      className="form-input"
                      type="text"
                      value={nom}
                      onChange={(e) => setNom(e.target.value)}
                      required
                      placeholder="Dupont"
                    />
                  </div>
                </div>
                <div className="form-field">
                  <label className="form-label">Pseudo *</label>
                  <input
                    className="form-input"
                    type="text"
                    value={pseudo}
                    onChange={(e) => setPseudo(e.target.value)}
                    required
                    placeholder="MosquitoHunter42"
                  />
                </div>
                <div className="form-field">
                  <label className="form-label">Email *</label>
                  <input
                    className="form-input"
                    type="email"
                    value={emailReg}
                    onChange={(e) => setEmailReg(e.target.value)}
                    required
                    autoComplete="email"
                    placeholder="votre@email.fr"
                  />
                </div>
                <div className="form-field">
                  <label className="form-label">Mot de passe * <span className="form-hint">(min. 8 caractères)</span></label>
                  <input
                    className="form-input"
                    type="password"
                    value={passwordReg}
                    onChange={(e) => setPasswordReg(e.target.value)}
                    required
                    autoComplete="new-password"
                    minLength={8}
                    placeholder="••••••••"
                  />
                </div>
                <div className="form-field">
                  <label className="form-label">Confirmer le mot de passe *</label>
                  <input
                    className="form-input"
                    type="password"
                    value={passwordConfirm}
                    onChange={(e) => setPasswordConfirm(e.target.value)}
                    required
                    autoComplete="new-password"
                    placeholder="••••••••"
                  />
                </div>
                <label className="form-checkbox">
                  <input
                    type="checkbox"
                    checked={acceptCgu}
                    onChange={(e) => setAcceptCgu(e.target.checked)}
                  />
                  <span>
                    J'accepte les{' '}
                    <button
                      type="button"
                      className="auth-link inline"
                      onClick={() => setShowPrivacy(true)}
                    >
                      CGU et la politique de confidentialité
                    </button>
                  </span>
                </label>
                <button className="submit-btn" type="submit" disabled={loading}>
                  {loading ? 'Création du compte...' : 'Créer mon compte'}
                </button>
              </form>
            )}

            {mode === 'forgot' && (
              <form onSubmit={handleForgotPassword} className="auth-form">
                <h2 className="modal-title">Mot de passe oublié</h2>
                <p className="modal-subtitle">
                  Entrez votre email pour recevoir un lien de réinitialisation.
                </p>
                <div className="form-field">
                  <label className="form-label">Email</label>
                  <input
                    className="form-input"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    autoComplete="email"
                    placeholder="votre@email.fr"
                  />
                </div>
                <button className="submit-btn" type="submit" disabled={loading}>
                  {loading ? 'Envoi...' : 'Envoyer le lien'}
                </button>
                <button
                  type="button"
                  className="auth-link"
                  onClick={() => switchMode('login')}
                >
                  ← Retour à la connexion
                </button>
              </form>
            )}
          </>
        )}
      </div>
    </div>
  )
}
