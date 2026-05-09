// ── Shared UI components ─────────────────────────────────────────────────────

const AVATAR_COLORS = ["#0f172a","#1d4ed8","#7c3aed","#be185d","#b45309","#047857"]
export const avatarColor = (id) => AVATAR_COLORS[(id - 1) % AVATAR_COLORS.length]
export const initials    = (name) => name.split(" ").map(p => p[0]).join("").toUpperCase()

export const STATUS_CFG = {
  present: { bg: "#f0fdf4", fg: "#15803d", dot: "#22c55e", label: "Présent" },
  late:    { bg: "#fefce8", fg: "#a16207", dot: "#eab308", label: "Retard"  },
  absent:  { bg: "#fef2f2", fg: "#b91c1c", dot: "#ef4444", label: "Absent"  },
  conge:   { bg: "#eff6ff", fg: "#1d4ed8", dot: "#3b82f6", label: "Congé"   },
}

export const fmt = (n) =>
  Number(n).toLocaleString("fr-FR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })

export const timeToHours = (t) => {
  if (!t) return 0
  const [h, m] = t.split(":").map(Number)
  return h + m / 60
}

export const monthLabel = (m) =>
  new Date(m + "-01").toLocaleDateString("fr-FR", { month: "long", year: "numeric" })

export const last4Months = () =>
  Array.from({ length: 4 }, (_, i) => {
    const d = new Date(); d.setMonth(d.getMonth() - i)
    return d.toISOString().slice(0, 7)
  })

// ── Components ────────────────────────────────────────────────────────────────

export function Avatar({ name, id, size = 40 }) {
  return (
    <div style={{
      width: size, height: size, borderRadius: size * 0.28,
      background: avatarColor(id), display: "flex", alignItems: "center",
      justifyContent: "center", color: "#fff", fontWeight: 800,
      fontSize: size * 0.32, flexShrink: 0, letterSpacing: 0.5,
    }}>{initials(name)}</div>
  )
}

export function Chip({ status }) {
  const c = STATUS_CFG[status]
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 5, background: c.bg, borderRadius: 99, padding: "4px 10px" }}>
      <div style={{ width: 6, height: 6, borderRadius: 99, background: c.dot }} />
      <span style={{ fontSize: 11, fontWeight: 700, color: c.fg }}>{c.label}</span>
    </div>
  )
}

export function Card({ children, style = {}, onClick }) {
  return (
    <div onClick={onClick} style={{
      background: "#fff", borderRadius: 18,
      boxShadow: "0 1px 6px rgba(0,0,0,0.07)",
      overflow: "hidden", cursor: onClick ? "pointer" : "default", ...style
    }}>{children}</div>
  )
}

export function Btn({ children, onClick, color = "#0f172a", textColor = "#fff", outline = false, style = {}, disabled = false }) {
  return (
    <button onClick={onClick} disabled={disabled} style={{
      background: outline ? "#fff" : (disabled ? "#e2e8f0" : color),
      color: outline ? color : (disabled ? "#94a3b8" : textColor),
      border: outline ? `1.5px solid ${color}` : "none",
      borderRadius: 12, padding: "11px 18px",
      fontWeight: 700, fontSize: 13, cursor: disabled ? "not-allowed" : "pointer",
      fontFamily: "'Outfit', sans-serif", transition: "opacity 0.15s", ...style
    }}>{children}</button>
  )
}

export function Input({ label, value, onChange, type = "text", placeholder = "", suffix, disabled }) {
  return (
    <div style={{ marginBottom: 14 }}>
      {label && <div style={{ fontSize: 11, fontWeight: 700, color: "#64748b", textTransform: "uppercase", letterSpacing: 0.6, marginBottom: 6 }}>{label}</div>}
      <div style={{ position: "relative" }}>
        <input type={type} value={value} onChange={e => onChange(e.target.value)}
          placeholder={placeholder} disabled={disabled}
          style={{
            width: "100%", padding: suffix ? "11px 36px 11px 14px" : "11px 14px",
            borderRadius: 12, border: "1.5px solid #e2e8f0", fontSize: 14,
            color: "#0f172a", background: disabled ? "#f1f5f9" : "#f8fafc",
            boxSizing: "border-box", fontFamily: "'Outfit', sans-serif",
          }} />
        {suffix && <span style={{ position: "absolute", right: 14, top: "50%", transform: "translateY(-50%)", fontSize: 13, color: "#94a3b8", fontWeight: 600 }}>{suffix}</span>}
      </div>
    </div>
  )
}

export function Select({ label, value, onChange, options }) {
  return (
    <div style={{ marginBottom: 14 }}>
      {label && <div style={{ fontSize: 11, fontWeight: 700, color: "#64748b", textTransform: "uppercase", letterSpacing: 0.6, marginBottom: 6 }}>{label}</div>}
      <select value={value} onChange={e => onChange(e.target.value)} style={{
        width: "100%", padding: "11px 14px", borderRadius: 12, border: "1.5px solid #e2e8f0",
        fontSize: 14, color: "#0f172a", background: "#f8fafc", boxSizing: "border-box",
        fontFamily: "'Outfit', sans-serif",
      }}>
        {options.map(o => <option key={o.value ?? o} value={o.value ?? o}>{o.label ?? o}</option>)}
      </select>
    </div>
  )
}

export function SectionTitle({ children }) {
  return (
    <div style={{ fontSize: 10.5, fontWeight: 800, color: "#94a3b8", textTransform: "uppercase", letterSpacing: 1.2, marginBottom: 10, marginTop: 24 }}>
      {children}
    </div>
  )
}

export function Modal({ title, onClose, children }) {
  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(15,23,42,0.55)", zIndex: 100, display: "flex", alignItems: "flex-end", justifyContent: "center" }}>
      <div style={{ background: "#fff", borderRadius: "22px 22px 0 0", width: "100%", maxWidth: 520, padding: "24px 20px 40px", maxHeight: "88vh", overflowY: "auto" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
          <div style={{ fontFamily: "'Playfair Display', serif", fontSize: 20, fontWeight: 900, color: "#0f172a" }}>{title}</div>
          <button onClick={onClose} style={{ background: "#f1f5f9", border: "none", borderRadius: 99, width: 32, height: 32, fontSize: 16, cursor: "pointer", color: "#64748b" }}>✕</button>
        </div>
        {children}
      </div>
    </div>
  )
}

export function Spinner() {
  return (
    <div style={{ display: "flex", justifyContent: "center", alignItems: "center", padding: "60px 0" }}>
      <div style={{
        width: 32, height: 32, borderRadius: "50%",
        border: "3px solid #e2e8f0", borderTopColor: "#0f172a",
        animation: "spin 0.7s linear infinite"
      }} />
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  )
}

export function Toast({ message, type = "success" }) {
  const bg = type === "success" ? "#f0fdf4" : "#fef2f2"
  const border = type === "success" ? "#bbf7d0" : "#fecaca"
  const color  = type === "success" ? "#15803d" : "#b91c1c"
  const icon   = type === "success" ? "✅" : "❌"
  return (
    <div style={{
      position: "fixed", top: 20, left: "50%", transform: "translateX(-50%)",
      background: bg, border: `1px solid ${border}`, borderRadius: 14,
      padding: "12px 20px", display: "flex", alignItems: "center", gap: 10,
      zIndex: 200, boxShadow: "0 4px 16px rgba(0,0,0,0.1)", whiteSpace: "nowrap"
    }}>
      <span>{icon}</span>
      <span style={{ fontSize: 13, fontWeight: 700, color }}>{message}</span>
    </div>
  )
}

export function PageHeader({ title, subtitle, action }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 20 }}>
      <div>
        <div style={{ fontFamily: "'Playfair Display', serif", fontSize: 26, color: "#0f172a" }}>{title}</div>
        {subtitle && <div style={{ fontSize: 13, color: "#94a3b8", marginTop: 2 }}>{subtitle}</div>}
      </div>
      {action}
    </div>
  )
}
