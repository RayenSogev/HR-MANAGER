import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../supabase.js'
import { Avatar, Chip, Card, Btn, Select, Input, Modal, Spinner, Toast, PageHeader, STATUS_CFG, timeToHours } from '../components/ui.jsx'

const TODAY = new Date().toISOString().split("T")[0]

export default function Presence({ user, settings }) {
  const [workers,  setWorkers]  = useState([])
  const [presence, setPresence] = useState([])
  const [loading,  setLoading]  = useState(true)
  const [modal,    setModal]    = useState(null)
  const [form,     setForm]     = useState({ status: "present", arrived: "08:00", left_at: "" })
  const [saving,   setSaving]   = useState(false)
  const [toast,    setToast]    = useState(null)

  const showToast = (message, type = "success") => {
    setToast({ message, type })
    setTimeout(() => setToast(null), 2500)
  }

  const load = useCallback(async () => {
    setLoading(true)
    const [{ data: w }, { data: p }] = await Promise.all([
      supabase.from("workers").select("*").order("name"),
      supabase.from("presence").select("*").eq("date", TODAY),
    ])
    setWorkers(w || [])
    setPresence(p || [])
    setLoading(false)
  }, [])

  useEffect(() => { load() }, [load])

  const getP = (wid) => presence.find(p => p.worker_id === wid)

  const openEdit = (w) => {
    const ex = getP(w.id)
    setForm(ex
      ? { status: ex.status, arrived: ex.arrived || "08:00", left_at: ex.left_at || "" }
      : { status: "present", arrived: "08:00", left_at: "" }
    )
    setModal(w)
  }

  const save = async () => {
    setSaving(true)
    const existing = getP(modal.id)
    const payload = {
      user_id: user.id, worker_id: modal.id,
      date: TODAY, ...form,
      arrived: (form.status === "present" || form.status === "late") ? form.arrived : null,
      left_at: (form.status === "present" || form.status === "late") ? form.left_at : null,
    }
    const { error } = existing
      ? await supabase.from("presence").update(payload).eq("id", existing.id)
      : await supabase.from("presence").insert(payload)

    if (error) { showToast("Erreur lors de l'enregistrement", "error") }
    else { showToast("Présence enregistrée"); await load() }
    setSaving(false)
    setModal(null)
  }

  const stdH = settings?.standard_hours || 8
  const supMult = settings?.sup_multiplier || 1.5

  const calcDisplay = () => {
    if (!form.arrived || !form.left_at) return null
    const total = timeToHours(form.left_at) - timeToHours(form.arrived)
    if (total <= 0) return null
    const sup  = Math.max(0, total - stdH)
    const pay  = (Math.min(total, stdH) * modal.hourly_rate) + (sup * modal.hourly_rate * supMult)
    return { total: total.toFixed(2), sup: sup.toFixed(2), pay: pay.toFixed(2) }
  }

  const stats = {
    present: presence.filter(p => p.status === "present").length,
    late:    presence.filter(p => p.status === "late").length,
    absent:  presence.filter(p => p.status === "absent").length,
    conge:   presence.filter(p => p.status === "conge").length,
  }

  if (loading) return <Spinner />

  const calc = modal ? calcDisplay() : null

  return (
    <div style={{ padding: "24px 20px" }}>
      {toast && <Toast {...toast} />}

      <PageHeader
        title="Présence"
        subtitle={new Date().toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}
      />

      {/* Stats */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: 8, marginBottom: 24 }}>
        {[["Présents", stats.present, "#22c55e"], ["Retards", stats.late, "#eab308"],
          ["Absents", stats.absent, "#ef4444"], ["Congés", stats.conge, "#3b82f6"]].map(([l, n, c]) => (
          <div key={l} style={{ background: "#fff", borderRadius: 14, padding: "12px 8px", textAlign: "center", boxShadow: "0 1px 4px rgba(0,0,0,0.06)" }}>
            <div style={{ fontSize: 22, fontWeight: 900, color: c }}>{n}</div>
            <div style={{ fontSize: 9, color: "#94a3b8", textTransform: "uppercase", letterSpacing: 0.4, marginTop: 2 }}>{l}</div>
          </div>
        ))}
      </div>

      {/* Workers */}
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {workers.map(w => {
          const p = getP(w.id)
          const total = p?.arrived && p?.left_at
            ? (timeToHours(p.left_at) - timeToHours(p.arrived)).toFixed(2)
            : null
          const sup = total ? Math.max(0, total - stdH).toFixed(2) : null
          return (
            <Card key={w.id} onClick={() => openEdit(w)}>
              <div style={{ padding: "14px 16px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <Avatar name={w.name} id={w.id} />
                  <div>
                    <div style={{ fontWeight: 700, fontSize: 14, color: "#0f172a" }}>{w.name}</div>
                    <div style={{ fontSize: 11, color: "#94a3b8", marginTop: 1 }}>
                      {p
                        ? `${p.arrived || "—"} → ${p.left_at || "en cours"}${total ? `  ·  ${total}h${Number(sup) > 0 ? ` (+${sup}h sup)` : ""}` : ""}`
                        : "Non saisi · cliquer pour saisir"}
                    </div>
                  </div>
                </div>
                {p ? <Chip status={p.status} /> : <span style={{ fontSize: 11, color: "#cbd5e1", fontWeight: 600 }}>Saisir ›</span>}
              </div>
            </Card>
          )
        })}
      </div>

      {modal && (
        <Modal title={modal.name} onClose={() => setModal(null)}>
          <div style={{ fontSize: 12, color: "#94a3b8", marginBottom: 16 }}>
            Taux : <strong style={{ color: "#0f172a" }}>{modal.hourly_rate} €/h</strong>
            &nbsp;·&nbsp; Standard : <strong style={{ color: "#0f172a" }}>{stdH}h</strong>
          </div>
          <Select label="Statut" value={form.status} onChange={v => setForm(f => ({ ...f, status: v }))}
            options={[
              { value: "present", label: "✓ Présent"  },
              { value: "late",    label: "⚠ Retard"   },
              { value: "absent",  label: "✕ Absent"   },
              { value: "conge",   label: "🌴 Congé"   },
            ]} />
          {(form.status === "present" || form.status === "late") && (
            <>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                <Input label="Arrivée" type="time" value={form.arrived} onChange={v => setForm(f => ({ ...f, arrived: v }))} />
                <Input label="Départ"  type="time" value={form.left_at} onChange={v => setForm(f => ({ ...f, left_at: v }))} />
              </div>
              {calc && (
                <div style={{ background: "#f8fafc", borderRadius: 12, padding: "12px 14px", marginBottom: 14 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                    <span style={{ fontSize: 12, color: "#64748b" }}>Heures travaillées</span>
                    <span style={{ fontSize: 13, fontWeight: 700, color: "#0f172a" }}>{calc.total}h</span>
                  </div>
                  {Number(calc.sup) > 0 && (
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                      <span style={{ fontSize: 12, color: "#f59e0b" }}>Heures sup (×{supMult})</span>
                      <span style={{ fontSize: 13, fontWeight: 700, color: "#f59e0b" }}>+{calc.sup}h</span>
                    </div>
                  )}
                  <div style={{ display: "flex", justifyContent: "space-between", borderTop: "1px solid #e2e8f0", paddingTop: 8, marginTop: 4 }}>
                    <span style={{ fontSize: 12, color: "#64748b" }}>Gain estimé / jour</span>
                    <span style={{ fontSize: 14, fontWeight: 800, color: "#10b981" }}>{calc.pay} €</span>
                  </div>
                </div>
              )}
            </>
          )}
          <div style={{ display: "flex", gap: 10, marginTop: 8 }}>
            <Btn outline color="#94a3b8" onClick={() => setModal(null)} style={{ flex: 1 }}>Annuler</Btn>
            <Btn onClick={save} disabled={saving} style={{ flex: 2 }}>{saving ? "Enregistrement…" : "Enregistrer"}</Btn>
          </div>
        </Modal>
      )}
    </div>
  )
}
