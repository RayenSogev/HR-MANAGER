import { exportFicheDePaie } from '../utils/export.js'
import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../supabase.js'
import { Avatar, Card, Spinner, PageHeader, fmt, timeToHours, monthLabel, last4Months } from '../components/ui.jsx'

function workerPay(worker, presence, acomptes, settings) {
  const stdH    = settings?.standard_hours || 8
  const supMult = settings?.sup_multiplier || 1.5

  let normalHours = 0, supHours = 0

  presence
    .filter(p => p.worker_id === worker.id && (p.status === "present" || p.status === "late"))
    .forEach(p => {
      const total = timeToHours(p.left_at) - timeToHours(p.arrived)
      if (total <= 0) return
      normalHours += Math.min(total, stdH)
      supHours    += Math.max(0, total - stdH)
    })

  const normalPay   = normalHours * worker.hourly_rate
  const supPay      = supHours * worker.hourly_rate * supMult
  const grossPay    = normalPay + supPay
  const acompteTotal = acomptes.filter(a => a.worker_id === worker.id).reduce((s, a) => s + Number(a.montant), 0)
  const netPay      = grossPay - acompteTotal

  return {
    normalHours: +normalHours.toFixed(2),
    supHours:    +supHours.toFixed(2),
    normalPay:   +normalPay.toFixed(2),
    supPay:      +supPay.toFixed(2),
    grossPay:    +grossPay.toFixed(2),
    acompteTotal,
    netPay:      +netPay.toFixed(2),
    daysWorked:  presence.filter(p => p.worker_id === worker.id && (p.status === "present" || p.status === "late")).length,
  }
}

function Row({ label, value, bold, color = "#0f172a" }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", padding: "10px 0", borderBottom: "1px solid #f1f5f9" }}>
      <span style={{ fontSize: 13, color: "#64748b" }}>{label}</span>
      <span style={{ fontSize: 13, fontWeight: bold ? 800 : 600, color }}>{value}</span>
    </div>
  )
}

export default function Paie({ settings }) {
  const months = last4Months()
  const [month,    setMonth]    = useState(months[0])
  const [workers,  setWorkers]  = useState([])
  const [presence, setPresence] = useState([])
  const [acomptes, setAcomptes] = useState([])
  const [loading,  setLoading]  = useState(true)
  const [expanded, setExpanded] = useState(null)

  const load = useCallback(async () => {
    setLoading(true)
    const [{ data: w }, { data: p }, { data: a }] = await Promise.all([
      supabase.from("workers").select("*").order("name"),
      supabase.from("presence").select("*").gte("date", month + "-01").lte("date", month + "-31"),
      supabase.from("acomptes").select("*").gte("date", month + "-01").lte("date", month + "-31"),
    ])
    setWorkers(w || [])
    setPresence(p || [])
    setAcomptes(a || [])
    setLoading(false)
  }, [month])

  useEffect(() => { load() }, [load])

  const pays = workers.map(w => ({ w, pay: workerPay(w, presence, acomptes, settings) }))
  const totalGross = pays.reduce((s, { pay }) => s + pay.grossPay, 0)
  const totalNet   = pays.reduce((s, { pay }) => s + pay.netPay, 0)

  return (
    <div style={{ padding: "20px 16px" }}>
      <PageHeader title="Paie" subtitle="Fiches de paie par employé" />

      {/* Month selector */}
      <div style={{ display: "flex", gap: 8, marginBottom: 24 }}>
        {months.map(m => (
          <button key={m} onClick={() => setMonth(m)} style={{
            flex: 1, border: "none", borderRadius: 12, padding: "10px 4px",
            background: month === m ? "#0f172a" : "#f1f5f9",
            color: month === m ? "#fff" : "#64748b",
            fontWeight: 700, fontSize: 11, cursor: "pointer",
            fontFamily: "'Outfit', sans-serif", textTransform: "capitalize"
          }}>{monthLabel(m).split(" ")[0]}</button>
        ))}
      </div>

      {/* Totals */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 24 }}>
        <Card style={{ padding: "16px 18px" }}>
          <div style={{ fontSize: 10, color: "#94a3b8", textTransform: "uppercase", letterSpacing: 0.6, marginBottom: 4 }}>Total brut</div>
          <div style={{ fontFamily: "'Playfair Display', serif", fontSize: 22, fontWeight: 900, color: "#0f172a" }}>{fmt(totalGross)} €</div>
        </Card>
        <Card style={{ padding: "16px 18px", background: "linear-gradient(135deg, #0f172a, #1e3a5f)" }}>
          <div style={{ fontSize: 10, color: "#64748b", textTransform: "uppercase", letterSpacing: 0.6, marginBottom: 4 }}>Total net</div>
          <div style={{ fontFamily: "'Playfair Display', serif", fontSize: 22, fontWeight: 900, color: "#fff" }}>{fmt(totalNet)} €</div>
        </Card>
      </div>

      {loading ? <Spinner /> : (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {pays.map(({ w, pay }) => (
            <Card key={w.id} onClick={() => setExpanded(expanded === w.id ? null : w.id)}>
              <div style={{ padding: "16px 18px" }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                    <Avatar name={w.name} id={w.id} />
                    <div>
                      <div style={{ fontWeight: 700, fontSize: 14, color: "#0f172a" }}>{w.name}</div>
                      <div style={{ fontSize: 11, color: "#94a3b8", marginTop: 1 }}>
                        {pay.daysWorked}j · {pay.normalHours}h
                        {pay.supHours > 0 ? ` · +${pay.supHours}h sup` : ""}
                      </div>
                    </div>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <div style={{ fontWeight: 900, fontSize: 16, color: "#10b981" }}>{fmt(pay.netPay)} €</div>
                    <div style={{ fontSize: 10, color: "#94a3b8" }}>net · {expanded === w.id ? "▲" : "▼"}</div>
                  </div>
                </div>

                {expanded === w.id && (
                  <div style={{ marginTop: 16, borderTop: "1px solid #f1f5f9", paddingTop: 16 }}>
                    {/* Fiche header */}
                    <div style={{ background: "linear-gradient(135deg, #0f172a, #1e3a5f)", borderRadius: 14, padding: "16px 18px", marginBottom: 14 }}>
                      <div style={{ fontSize: 11, color: "#64748b" }}>Fiche de paie</div>
                      <div style={{ fontFamily: "'Playfair Display', serif", fontSize: 18, fontWeight: 900, color: "#fff", marginTop: 2 }}>{w.name}</div>
                      <div style={{ fontSize: 12, color: "#94a3b8", marginTop: 2 }}>{w.role} · {w.hourly_rate} €/h · {monthLabel(month)}</div>
                    </div>

                    {/* Gains */}
                    <div style={{ fontSize: 11, fontWeight: 800, color: "#94a3b8", textTransform: "uppercase", letterSpacing: 1, marginBottom: 6 }}>Gains</div>
                    <Row label={`Heures normales (${pay.normalHours}h × ${w.hourly_rate} €)`} value={`${fmt(pay.normalPay)} €`} />
                    {pay.supHours > 0 && (
                      <Row label={`Heures sup (${pay.supHours}h × ${w.hourly_rate} × ${settings?.sup_multiplier || 1.5})`} value={`+${fmt(pay.supPay)} €`} color="#f59e0b" />
                    )}
                    <Row label="Salaire brut" value={`${fmt(pay.grossPay)} €`} bold />

                    {/* Déductions */}
                    {pay.acompteTotal > 0 && (
                      <>
                        <div style={{ fontSize: 11, fontWeight: 800, color: "#94a3b8", textTransform: "uppercase", letterSpacing: 1, margin: "14px 0 6px" }}>Déductions</div>
                        <Row label="Acomptes versés" value={`−${fmt(pay.acompteTotal)} €`} color="#ef4444" />
                      </>
                    )}

                    {/* Net */}
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", background: "#f0fdf4", borderRadius: 12, padding: "14px 16px", marginTop: 14 }}>
                      <span style={{ fontWeight: 800, fontSize: 15, color: "#0f172a" }}>Net à payer</span>
                      <span style={{ fontWeight: 900, fontSize: 22, color: "#10b981", fontFamily: "'Playfair Display', serif" }}>{fmt(pay.netPay)} €</span>
                    </div>
                  </div>
                )}
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
