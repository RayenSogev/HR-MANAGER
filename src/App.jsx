import { useState, useEffect } from 'react'
import { supabase } from './supabase.js'
import Login    from './pages/Login.jsx'
import Presence from './pages/Presence.jsx'
import Paie     from './pages/Paie.jsx'
import Conges   from './pages/Conges.jsx'
import Acomptes from './pages/Acomptes.jsx'
import Equipe   from './pages/Equipe.jsx'
import Settings from './pages/Settings.jsx'

const NAV = [
  { id: "presence", label: "Présence", icon: "⏱" },
  { id: "paie",     label: "Paie",     icon: "💰" },
  { id: "conges",   label: "Congés",   icon: "🌴" },
  { id: "acomptes", label: "Acomptes", icon: "💶" },
  { id: "equipe",   label: "Équipe",   icon: "👥" },
  { id: "settings", label: "Config",   icon: "⚙️"  },
]

export default function App() {
  const [session,  setSession]  = useState(null)
  const [loading,  setLoading]  = useState(true)
  const [tab,      setTab]      = useState("presence")
  const [settings, setSettings] = useState(null)

  // Auth listener
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      setLoading(false)
    })
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
    })
    return () => subscription.unsubscribe()
  }, [])

  // Load settings once logged in
  useEffect(() => {
    if (!session) return
    const load = async () => {
      const { data } = await supabase.from("settings").select("*").eq("user_id", session.user.id).single()
      if (data) setSettings(data)
      else {
        // First login — create default settings row
        const { data: created } = await supabase.from("settings")
          .insert({ user_id: session.user.id, company_name: "Mon Entreprise", standard_hours: 8, sup_multiplier: 1.5 })
          .select().single()
        if (created) setSettings(created)
      }
    }
    load()
  }, [session])

  if (loading) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ width: 36, height: 36, borderRadius: "50%", border: "3px solid #e2e8f0", borderTopColor: "#0f172a", animation: "spin 0.7s linear infinite" }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    )
  }

  if (!session) return <Login />

  const user = session.user
  const companyName = settings?.company_name || "Mon Entreprise"

  const pages = {
    presence: <Presence user={user} settings={settings} />,
    paie:     <Paie     user={user} settings={settings} />,
    conges:   <Conges   user={user} />,
    acomptes: <Acomptes user={user} />,
    equipe:   <Equipe   user={user} />,
    settings: <Settings user={user} onSettingsChange={s => setSettings(s)} />,
  }

  return (
    <div style={{ minHeight: "100vh", background: "#f8fafc", display: "flex", flexDirection: "column" }}>

      {/* Top bar */}
      <div style={{
        background: "#fff", padding: "14px 24px 12px",
        borderBottom: "1px solid #f1f5f9",
        display: "flex", justifyContent: "space-between", alignItems: "center",
        position: "sticky", top: 0, zIndex: 9,
        // Desktop: wider padding
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{ width: 32, height: 32, borderRadius: 9, background: "#0f172a", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16 }}>👥</div>
          <div>
            <div style={{ fontSize: 10, color: "#94a3b8", fontWeight: 800, letterSpacing: 1, textTransform: "uppercase" }}>Manager</div>
            <div style={{ fontFamily: "'Playfair Display', serif", fontSize: 16, fontWeight: 900, color: "#0f172a", lineHeight: 1 }}>{companyName}</div>
          </div>
        </div>

        {/* Desktop nav — visible on wider screens */}
        <nav style={{ display: "flex", gap: 4 }} className="desktop-nav">
          {NAV.map(n => (
            <button key={n.id} onClick={() => setTab(n.id)} style={{
              border: "none", borderRadius: 10, padding: "8px 14px",
              background: tab === n.id ? "#0f172a" : "transparent",
              color: tab === n.id ? "#fff" : "#64748b",
              fontWeight: 700, fontSize: 12, cursor: "pointer",
              fontFamily: "'Outfit', sans-serif", display: "flex", alignItems: "center", gap: 6,
              transition: "all 0.15s"
            }}>
              <span>{n.icon}</span> {n.label}
            </button>
          ))}
        </nav>

        <div style={{ width: 36, height: 36, borderRadius: 10, background: "#0f172a", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontWeight: 800, fontSize: 13 }}>
          {user.email[0].toUpperCase()}
        </div>
      </div>

      {/* Page content */}
      <div style={{ flex: 1, maxWidth: 680, width: "100%", margin: "0 auto", paddingBottom: 88 }}>
        {pages[tab]}
      </div>

      {/* Mobile bottom nav */}
      <div className="mobile-nav" style={{
        position: "fixed", bottom: 0, left: 0, right: 0,
        background: "#fff", borderTop: "1px solid #f1f5f9",
        display: "flex", padding: "6px 0 16px", zIndex: 9,
      }}>
        {NAV.map(n => {
          const active = tab === n.id
          return (
            <button key={n.id} onClick={() => setTab(n.id)} style={{
              flex: 1, border: "none", background: "transparent", cursor: "pointer",
              display: "flex", flexDirection: "column", alignItems: "center", gap: 2, padding: "4px 2px"
            }}>
              <div style={{
                width: 34, height: 34, borderRadius: 10,
                background: active ? "#0f172a" : "transparent",
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 16, transition: "all 0.15s"
              }}>
                <span style={{ filter: active ? "brightness(10)" : "none" }}>{n.icon}</span>
              </div>
              <span style={{ fontSize: 8.5, fontWeight: 700, letterSpacing: 0.3, textTransform: "uppercase", color: active ? "#0f172a" : "#cbd5e1" }}>
                {n.label}
              </span>
            </button>
          )
        })}
      </div>

      {/* Responsive styles */}
      <style>{`
        .desktop-nav { display: none; }
        .mobile-nav  { display: flex;  }

        @media (min-width: 768px) {
          .desktop-nav { display: flex !important; }
          .mobile-nav  { display: none !important; }
          div[style*="paddingBottom: 88"] { padding-bottom: 32px !important; }
        }
      `}</style>
    </div>
  )
}
