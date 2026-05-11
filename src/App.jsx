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
  { id:"presence", label:"Présence", icon:"⏱" },
  { id:"paie",     label:"Paie",     icon:"💰" },
  { id:"conges",   label:"Congés",   icon:"🌴" },
  { id:"acomptes", label:"Acomptes", icon:"💶" },
  { id:"equipe",   label:"Équipe",   icon:"👥" },
  { id:"settings", label:"Config",   icon:"⚙️" },
]

export default function App() {
  const [session,  setSession]  = useState(null)
  const [loading,  setLoading]  = useState(true)
  const [tab,      setTab]      = useState("presence")
  const [settings, setSettings] = useState(null)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session); setLoading(false)
    })
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, s) => setSession(s))
    return () => subscription.unsubscribe()
  }, [])

  useEffect(() => {
    if (!session) return
    const load = async () => {
      const { data } = await supabase.from("settings").select("*").eq("user_id", session.user.id).single()
      if (data) setSettings(data)
      else {
        const { data: c } = await supabase.from("settings")
          .insert({ user_id: session.user.id, company_name: "Mon Entreprise", standard_hours: 8, sup_multiplier: 1.5 })
          .select().single()
        if (c) setSettings(c)
      }
    }
    load()
  }, [session])

  if (loading) return (
    <div style={{ minHeight:"100vh", display:"flex", alignItems:"center", justifyContent:"center", background:"#f8fafc" }}>
      <div style={{ width:36, height:36, borderRadius:"50%", border:"3px solid #e2e8f0", borderTopColor:"#0f172a", animation:"spin 0.7s linear infinite" }} />
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  )

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
    <>
      <style>{`
        *, *::before, *::after { box-sizing: border-box; -webkit-tap-highlight-color: transparent; }
        html, body { margin:0; padding:0; width:100%; overflow-x:hidden; background:#f8fafc; font-family:'Outfit',sans-serif; }
        input,select,textarea,button { font-family:'Outfit',sans-serif; }
        @keyframes spin { to { transform: rotate(360deg); } }
        .top-nav    { display: none !important; }
        .bottom-nav { display: flex !important; }
        @media (min-width: 768px) {
          .top-nav    { display: flex !important; }
          .bottom-nav { display: none !important; }
          .page-wrap  { padding-bottom: 24px !important; }
          .page-inner { max-width: 720px; margin: 0 auto; }
        }
      `}</style>

      <div style={{ minHeight:"100vh", width:"100%", display:"flex", flexDirection:"column" }}>

        {/* Top bar */}
        <div style={{ background:"#fff", borderBottom:"1px solid #f1f5f9", position:"sticky", top:0, zIndex:50, display:"flex", alignItems:"center", justifyContent:"space-between", padding:"0 16px", height:56, width:"100%" }}>
          <div style={{ display:"flex", alignItems:"center", gap:10 }}>
            <div style={{ width:34, height:34, borderRadius:9, background:"#0f172a", display:"flex", alignItems:"center", justifyContent:"center", color:"#fff", fontSize:16, fontWeight:900, flexShrink:0 }}>H</div>
            <div>
              <div style={{ fontSize:9, color:"#94a3b8", fontWeight:800, letterSpacing:1.2, textTransform:"uppercase" }}>Manager</div>
              <div style={{ fontFamily:"'Playfair Display',serif", fontSize:15, fontWeight:900, color:"#0f172a", lineHeight:1.2 }}>{companyName}</div>
            </div>
          </div>
          <nav className="top-nav" style={{ gap:2 }}>
            {NAV.map(n => (
              <button key={n.id} onClick={() => setTab(n.id)} style={{ border:"none", borderRadius:8, padding:"7px 13px", background:tab===n.id?"#0f172a":"transparent", color:tab===n.id?"#fff":"#64748b", fontWeight:700, fontSize:12, cursor:"pointer" }}>
                {n.label}
              </button>
            ))}
          </nav>
          <div style={{ width:34, height:34, borderRadius:9, background:"#0f172a", display:"flex", alignItems:"center", justifyContent:"center", color:"#fff", fontWeight:800, fontSize:14, flexShrink:0 }}>
            {user.email[0].toUpperCase()}
          </div>
        </div>

        {/* Content */}
        <div className="page-wrap" style={{ flex:1, width:"100%", paddingBottom:70, overflowX:"hidden" }}>
          <div className="page-inner">
            {pages[tab]}
          </div>
        </div>

        {/* Mobile bottom nav */}
        <nav className="bottom-nav" style={{ position:"fixed", bottom:0, left:0, right:0, background:"#fff", borderTop:"1px solid #f1f5f9", paddingBottom:"env(safe-area-inset-bottom,8px)", zIndex:50, width:"100%" }}>
          {NAV.map(n => {
            const active = tab === n.id
            return (
              <button key={n.id} onClick={() => setTab(n.id)} style={{ flex:1, border:"none", background:"transparent", cursor:"pointer", display:"flex", flexDirection:"column", alignItems:"center", padding:"8px 0 4px", gap:3, minHeight:52, borderTop: active?"2px solid #0f172a":"2px solid transparent" }}>
                <span style={{ fontSize:19 }}>{n.icon}</span>
                <span style={{ fontSize:9, fontWeight:700, letterSpacing:0.4, textTransform:"uppercase", color:active?"#0f172a":"#94a3b8" }}>{n.label}</span>
              </button>
            )
          })}
        </nav>

      </div>
    </>
  )
}
