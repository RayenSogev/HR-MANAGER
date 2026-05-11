const AVATAR_COLORS = ["#0f172a","#1d4ed8","#7c3aed","#be185d","#b45309","#047857"]
export const avatarColor = (id) => AVATAR_COLORS[(id - 1) % AVATAR_COLORS.length]
export const initials    = (name) => name.split(" ").map(p => p[0]).join("").toUpperCase()

export const STATUS_CFG = {
  present: { bg:"#f0fdf4", fg:"#15803d", dot:"#22c55e", label:"Présent" },
  late:    { bg:"#fefce8", fg:"#a16207", dot:"#eab308", label:"Retard"  },
  absent:  { bg:"#fef2f2", fg:"#b91c1c", dot:"#ef4444", label:"Absent"  },
  conge:   { bg:"#eff6ff", fg:"#1d4ed8", dot:"#3b82f6", label:"Congé"   },
}

export const fmt = (n) =>
  Number(n).toLocaleString("fr-FR", { minimumFractionDigits:2, maximumFractionDigits:2 })

export const timeToHours = (t) => {
  if (!t) return 0
  const [h, m] = t.split(":").map(Number)
  return h + m / 60
}

export const monthLabel = (m) =>
  new Date(m + "-01").toLocaleDateString("fr-FR", { month:"long", year:"numeric" })

export const last4Months = () =>
  Array.from({ length:4 }, (_, i) => {
    const d = new Date(); d.setMonth(d.getMonth() - i)
    return d.toISOString().slice(0, 7)
  })

export function Avatar({ name, id, size = 42 }) {
  return (
    <div style={{ width:size, height:size, borderRadius:size*0.26, background:avatarColor(id), display:"flex", alignItems:"center", justifyContent:"center", color:"#fff", fontWeight:800, fontSize:size*0.34, flexShrink:0 }}>
      {initials(name)}
    </div>
  )
}

export function Chip({ status }) {
  const c = STATUS_CFG[status]
  return (
    <div style={{ display:"flex", alignItems:"center", gap:5, background:c.bg, borderRadius:99, padding:"5px 12px", flexShrink:0 }}>
      <div style={{ width:6, height:6, borderRadius:99, background:c.dot }} />
      <span style={{ fontSize:12, fontWeight:700, color:c.fg, whiteSpace:"nowrap" }}>{c.label}</span>
    </div>
  )
}

export function Card({ children, style={}, onClick }) {
  return (
    <div onClick={onClick} style={{ background:"#fff", borderRadius:16, boxShadow:"0 1px 5px rgba(0,0,0,0.07)", overflow:"hidden", cursor:onClick?"pointer":"default", width:"100%", ...style }}>
      {children}
    </div>
  )
}

export function Btn({ children, onClick, color="#0f172a", textColor="#fff", outline=false, style={}, disabled=false }) {
  return (
    <button onClick={onClick} disabled={disabled} style={{ background:outline?"#fff":(disabled?"#e2e8f0":color), color:outline?color:(disabled?"#94a3b8":textColor), border:outline?`1.5px solid ${color}`:"none", borderRadius:12, padding:"13px 20px", fontWeight:700, fontSize:15, cursor:disabled?"not-allowed":"pointer", fontFamily:"'Outfit',sans-serif", minHeight:48, whiteSpace:"nowrap", ...style }}>
      {children}
    </button>
  )
}

export function Input({ label, value, onChange, type="text", placeholder="", suffix, disabled }) {
  return (
    <div style={{ marginBottom:16, width:"100%" }}>
      {label && <div style={{ fontSize:11, fontWeight:700, color:"#64748b", textTransform:"uppercase", letterSpacing:0.7, marginBottom:7 }}>{label}</div>}
      <div style={{ position:"relative" }}>
        <input type={type} value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} disabled={disabled}
          style={{ width:"100%", padding:suffix?"13px 40px 13px 14px":"13px 14px", borderRadius:12, border:"1.5px solid #e2e8f0", fontSize:16, color:"#0f172a", background:disabled?"#f1f5f9":"#f8fafc", boxSizing:"border-box", outline:"none", fontFamily:"'Outfit',sans-serif", WebkitAppearance:"none" }} />
        {suffix && <span style={{ position:"absolute", right:14, top:"50%", transform:"translateY(-50%)", fontSize:13, color:"#94a3b8", fontWeight:600 }}>{suffix}</span>}
      </div>
    </div>
  )
}

export function Select({ label, value, onChange, options }) {
  return (
    <div style={{ marginBottom:16, width:"100%" }}>
      {label && <div style={{ fontSize:11, fontWeight:700, color:"#64748b", textTransform:"uppercase", letterSpacing:0.7, marginBottom:7 }}>{label}</div>}
      <select value={value} onChange={e => onChange(e.target.value)}
        style={{ width:"100%", padding:"13px 14px", borderRadius:12, border:"1.5px solid #e2e8f0", fontSize:16, color:"#0f172a", background:"#f8fafc", boxSizing:"border-box", fontFamily:"'Outfit',sans-serif", outline:"none", WebkitAppearance:"none", appearance:"none" }}>
        {options.map(o => <option key={o.value??o} value={o.value??o}>{o.label??o}</option>)}
      </select>
    </div>
  )
}

export function SectionTitle({ children }) {
  return <div style={{ fontSize:11, fontWeight:800, color:"#94a3b8", textTransform:"uppercase", letterSpacing:1.2, marginBottom:10, marginTop:24 }}>{children}</div>
}

export function Modal({ title, onClose, children }) {
  return (
    <div style={{ position:"fixed", inset:0, background:"rgba(15,23,42,0.6)", zIndex:100, display:"flex", alignItems:"flex-end", justifyContent:"center" }}
      onClick={e => e.target===e.currentTarget && onClose()}>
      <div style={{ background:"#fff", borderRadius:"20px 20px 0 0", width:"100%", maxWidth:600, padding:"20px 16px 40px", maxHeight:"90vh", overflowY:"auto", boxShadow:"0 -4px 32px rgba(0,0,0,0.15)" }}>
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:20 }}>
          <div style={{ fontFamily:"'Playfair Display',serif", fontSize:20, fontWeight:900, color:"#0f172a" }}>{title}</div>
          <button onClick={onClose} style={{ background:"#f1f5f9", border:"none", borderRadius:99, width:36, height:36, fontSize:18, cursor:"pointer", color:"#64748b" }}>✕</button>
        </div>
        {children}
      </div>
    </div>
  )
}

export function Spinner() {
  return (
    <div style={{ display:"flex", justifyContent:"center", padding:"60px 0" }}>
      <div style={{ width:32, height:32, borderRadius:"50%", border:"3px solid #e2e8f0", borderTopColor:"#0f172a", animation:"spin 0.7s linear infinite" }} />
    </div>
  )
}

export function Toast({ message, type="success" }) {
  const c = type==="success"
    ? { bg:"#f0fdf4", border:"#bbf7d0", color:"#15803d", icon:"✓" }
    : { bg:"#fef2f2", border:"#fecaca", color:"#b91c1c", icon:"✕" }
  return (
    <div style={{ position:"fixed", top:66, left:12, right:12, background:c.bg, border:`1px solid ${c.border}`, borderRadius:14, padding:"14px 18px", display:"flex", alignItems:"center", gap:10, zIndex:200, boxShadow:"0 4px 20px rgba(0,0,0,0.1)" }}>
      <span style={{ fontSize:16, fontWeight:900, color:c.color }}>{c.icon}</span>
      <span style={{ fontSize:14, fontWeight:700, color:c.color }}>{message}</span>
    </div>
  )
}

export function PageHeader({ title, subtitle, action }) {
  return (
    <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:20, gap:12 }}>
      <div style={{ flex:1, minWidth:0 }}>
        <div style={{ fontFamily:"'Playfair Display',serif", fontSize:26, color:"#0f172a", fontWeight:900 }}>{title}</div>
        {subtitle && <div style={{ fontSize:13, color:"#94a3b8", marginTop:3 }}>{subtitle}</div>}
      </div>
      {action}
    </div>
  )
}
