import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../supabase.js'
import { Avatar, Card, Btn, Select, Input, Modal, Spinner, Toast, PageHeader } from '../components/ui.jsx'

export default function Conges({ user }) {
  const [workers, setWorkers] = useState([])
  const [conges,  setConges]  = useState([])
  const [loading, setLoading] = useState(true)
  const [modal,   setModal]   = useState(false)
  const [saving,  setSaving]  = useState(false)
  const [filter,  setFilter]  = useState("all")
  const [toast,   setToast]   = useState(null)
  const [form,    setForm]    = useState({ workerId: "", type: "Congé annuel", from: "", to: "", note: "" })

  const showToast = (message, type = "success") => { setToast({ message, type }); setTimeout(() => setToast(null), 2500) }

  const load = useCallback(async () => {
    setLoading(true)
    const [{ data: w }, { data: c }] = await Promise.all([
      supabase.from("workers").select("*").order("name"),
      supabase.from("conges").select("*").order("date_from", { ascending: false }),
    ])
    setWorkers(w || [])
    setConges(c || [])
    setLoading(false)
  }, [])

  useEffect(() => { load() }, [load])

  const save = async () => {
    if (!form.workerId || !form.from || !form.to) return
    setSaving(true)
    const days = Math.max(1, Math.ceil((new Date(form.to) - new Date(form.from)) / 86400000) + 1)
    const { error } = await supabase.from("conges").insert({
      user_id: user.id, worker_id: Number(form.workerId),
      type: form.type, date_from: form.from, date_to: form.to,
      days, note: form.note,
    })
    if (error) showToast("Erreur lors de l'enregistrement", "error")
    else { showToast("Congé enregistré"); await load() }
    setSaving(false)
    setModal(false)
    setForm({ workerId: "", type: "Congé annuel", from: "", to: "", note: "" })
  }

  const del = async (id) => {
    const { error } = await supabase.from("conges").delete().eq("id", id)
    if (error) showToast("Erreur suppression", "error")
    else { showToast("Congé supprimé"); setConges(c => c.filter(x => x.id !== id)) }
  }

  const filtered = filter === "all" ? conges : conges.filter(c => c.worker_id === Number(filter))

  return (
    <div style={{ padding: "20px 16px" }}>
      {toast && <Toast {...toast} />}
      <PageHeader
        title="Congés"
        subtitle={`${conges.length} enregistrés`}
        action={<Btn onClick={() => setModal(true)}>+ Nouveau</Btn>}
      />

      {/* Filter */}
      <div style={{ display: "flex", gap: 8, marginBottom: 20, overflowX: "auto", paddingBottom: 4 }}>
        {[{ value: "all", label: "Tous" }, ...workers.map(w => ({ value: String(w.id), label: w.name.split(" ")[0] }))].map(o => (
          <button key={o.value} onClick={() => setFilter(o.value)} style={{
            border: "none", borderRadius: 99, padding: "6px 14px",
            background: filter === o.value ? "#0f172a" : "#f1f5f9",
            color: filter === o.value ? "#fff" : "#64748b",
            fontWeight: 700, fontSize: 12, cursor: "pointer", whiteSpace: "nowrap",
            fontFamily: "'Outfit', sans-serif"
          }}>{o.label}</button>
        ))}
      </div>

      {loading ? <Spinner /> : filtered.length === 0 ? (
        <div style={{ textAlign: "center", padding: "50px 0", color: "#cbd5e1" }}>
          <div style={{ fontSize: 36, marginBottom: 10 }}>🌴</div>
          <div style={{ fontSize: 14, fontWeight: 600 }}>Aucun congé</div>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {filtered.map(c => {
            const w = workers.find(x => x.id === c.worker_id)
            if (!w) return null
            return (
              <Card key={c.id}>
                <div style={{ padding: "16px 18px" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
                    <Avatar name={w.name} id={w.id} size={34} />
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 700, fontSize: 14, color: "#0f172a" }}>{w.name}</div>
                      <div style={{ fontSize: 11, color: "#94a3b8" }}>{c.type}</div>
                    </div>
                    <button onClick={() => del(c.id)} style={{ background: "#fef2f2", border: "none", borderRadius: 8, width: 30, height: 30, color: "#ef4444", fontSize: 14, cursor: "pointer" }}>✕</button>
                  </div>
                  <div style={{ background: "#f8fafc", borderRadius: 10, padding: "10px 14px", display: "flex", justifyContent: "space-between" }}>
                    <span style={{ fontSize: 13, color: "#64748b" }}>
                      {new Date(c.date_from).toLocaleDateString("fr-FR", { day: "numeric", month: "short" })} →{" "}
                      {new Date(c.date_to).toLocaleDateString("fr-FR", { day: "numeric", month: "short" })}
                    </span>
                    <span style={{ fontWeight: 800, fontSize: 14, color: "#0f172a" }}>{c.days}j</span>
                  </div>
                  {c.note && <div style={{ fontSize: 12, color: "#94a3b8", marginTop: 8, fontStyle: "italic" }}>"{c.note}"</div>}
                </div>
              </Card>
            )
          })}
        </div>
      )}

      {modal && (
        <Modal title="Nouveau congé" onClose={() => setModal(false)}>
          <Select label="Employé" value={form.workerId} onChange={v => setForm(f => ({ ...f, workerId: v }))}
            options={[{ value: "", label: "Choisir…" }, ...workers.map(w => ({ value: String(w.id), label: w.name }))]} />
          <Select label="Type" value={form.type} onChange={v => setForm(f => ({ ...f, type: v }))}
            options={["Congé annuel", "RTT", "Sans solde", "Maladie", "Événement familial"]} />
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
            <Input label="Du" type="date" value={form.from} onChange={v => setForm(f => ({ ...f, from: v }))} />
            <Input label="Au" type="date" value={form.to}   onChange={v => setForm(f => ({ ...f, to: v }))} />
          </div>
          <Input label="Note" value={form.note} onChange={v => setForm(f => ({ ...f, note: v }))} placeholder="Optionnel" />
          <div style={{ display: "flex", gap: 10, marginTop: 8 }}>
            <Btn outline color="#94a3b8" onClick={() => setModal(false)} style={{ flex: 1 }}>Annuler</Btn>
            <Btn onClick={save} disabled={saving} style={{ flex: 2 }}>{saving ? "Enregistrement…" : "Enregistrer"}</Btn>
          </div>
        </Modal>
      )}
    </div>
  )
}
