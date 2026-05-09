import { useState } from 'react'
import { supabase } from '../supabase.js'

export default function Login() {
  const [email,    setEmail]    = useState('')
  const [password, setPassword] = useState('')
  const [loading,  setLoading]  = useState(false)
  const [error,    setError]    = useState('')

  const handleLogin = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) setError(error.message)
    setLoading(false)
  }

  return (
    <div style={{
      minHeight: "100vh", display: "flex", alignItems: "center",
      justifyContent: "center", background: "#f8fafc", padding: 20,
    }}>
      <div style={{ width: "100%", maxWidth: 380 }}>

        {/* Logo / brand */}
        <div style={{ textAlign: "center", marginBottom: 40 }}>
          <div style={{
            width: 64, height: 64, borderRadius: 18, background: "#0f172a",
            display: "flex", alignItems: "center", justifyContent: "center",
            margin: "0 auto 16px", fontSize: 28,
          }}>👥</div>
          <div style={{ fontFamily: "'Playfair Display', serif", fontSize: 28, fontWeight: 900, color: "#0f172a" }}>
            HR Manager
          </div>
          <div style={{ fontSize: 14, color: "#94a3b8", marginTop: 4 }}>
            Gestion d'équipe
          </div>
        </div>

        {/* Form */}
        <div style={{ background: "#fff", borderRadius: 24, padding: 28, boxShadow: "0 4px 24px rgba(0,0,0,0.08)" }}>
          <form onSubmit={handleLogin}>
            <div style={{ marginBottom: 16 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: "#64748b", textTransform: "uppercase", letterSpacing: 0.6, marginBottom: 6 }}>
                Email
              </div>
              <input
                type="email" value={email} onChange={e => setEmail(e.target.value)}
                placeholder="votre@email.com" required
                style={{
                  width: "100%", padding: "12px 16px", borderRadius: 12,
                  border: "1.5px solid #e2e8f0", fontSize: 15, color: "#0f172a",
                  background: "#f8fafc", boxSizing: "border-box",
                  fontFamily: "'Outfit', sans-serif", outline: "none",
                }}
              />
            </div>

            <div style={{ marginBottom: 24 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: "#64748b", textTransform: "uppercase", letterSpacing: 0.6, marginBottom: 6 }}>
                Mot de passe
              </div>
              <input
                type="password" value={password} onChange={e => setPassword(e.target.value)}
                placeholder="••••••••" required
                style={{
                  width: "100%", padding: "12px 16px", borderRadius: 12,
                  border: "1.5px solid #e2e8f0", fontSize: 15, color: "#0f172a",
                  background: "#f8fafc", boxSizing: "border-box",
                  fontFamily: "'Outfit', sans-serif", outline: "none",
                }}
              />
            </div>

            {error && (
              <div style={{ background: "#fef2f2", borderRadius: 10, padding: "10px 14px", marginBottom: 16, fontSize: 13, color: "#b91c1c", fontWeight: 600 }}>
                {error}
              </div>
            )}

            <button type="submit" disabled={loading} style={{
              width: "100%", padding: "14px 0", borderRadius: 14,
              background: loading ? "#e2e8f0" : "#0f172a", color: loading ? "#94a3b8" : "#fff",
              border: "none", fontWeight: 800, fontSize: 15, cursor: loading ? "not-allowed" : "pointer",
              fontFamily: "'Outfit', sans-serif", transition: "background 0.2s",
            }}>
              {loading ? "Connexion…" : "Se connecter"}
            </button>
          </form>
        </div>

        <div style={{ textAlign: "center", marginTop: 20, fontSize: 12, color: "#cbd5e1" }}>
          Accès réservé · HR Manager
        </div>
      </div>
    </div>
  )
}
