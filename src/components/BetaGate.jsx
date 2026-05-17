// TODO: supprimer cette page avant le lancement public
import { useState } from 'react'

const BETA_KEY = 'piczone_beta_access'
const BETA_PWD = import.meta.env.VITE_BETA_PASSWORD

export default function BetaGate({ children }) {
  const [unlocked, setUnlocked] = useState(() => localStorage.getItem(BETA_KEY) === '1')
  const [input, setInput]       = useState('')
  const [error, setError]       = useState(false)

  if (unlocked) return children

  function handleSubmit(e) {
    e.preventDefault()
    if (input.trim() === BETA_PWD) {
      localStorage.setItem(BETA_KEY, '1')
      setUnlocked(true)
    } else {
      setError(true)
      setInput('')
      setTimeout(() => setError(false), 2000)
    }
  }

  return (
    <div className="beta-gate">
      <div className="beta-content">
        <span className="beta-mosquito">🦟</span>
        <h1 className="beta-title">PicZone</h1>
        <p className="beta-subtitle">Accès bêta privé</p>
        <form onSubmit={handleSubmit} className="beta-form">
          <input
            className={`beta-input ${error ? 'beta-input-error' : ''}`}
            type="password"
            placeholder="Mot de passe"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            autoFocus
            autoComplete="off"
          />
          {error && <p className="beta-error">Mot de passe incorrect</p>}
          <button className="beta-btn" type="submit">Accéder →</button>
        </form>
      </div>
    </div>
  )
}
