import { exportAcomptes } from '../utils/export.js'
import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../supabase.js'
import { Avatar, Card, Btn, Select, Input, Modal, Spinner, Toast, PageHeader, fmt } from '../components/ui.jsx'

const TODAY = new Date().toISOString().split("T")[0]

export default function Acomptes({ user }) {
  const [workers,  setWorkers]  = useState([])
  const [acomptes, setAcomptes] = useState([])
  const [loading,  setLoading]  = useState(true)
  const [modal,    setModal]    = useState(false)
  const [saving,   setSaving]   = useState(false)
  const [toast,    setToast]    = useState(null)
  const [form,     setForm]     = useState({ workerId: "", montant: "", motif: "", date: TODAY })

  const showToast = (message, type = "success") => { setToast({ message, type }); setTimeout(() => setToast(null), 2500) }

  const load = useCallback(async () => {
    setLoading(true)
    const [{ data: w }, { data: a }] = await Promise.all([
      supabase.from("workers").select("*").order("name"),
      supabase.from("acomptes").select("*").order("date", { ascending: false }),
    ])
    setWorkers(w || [])
    setAcomptes(a || [])
    setLoading(false)
  }, [])

  useEffect(() => { load() }, [load])

  const save = async () => {
    if (!form.workerId || !form.montant) return
    setSaving(true)
    const { error } = await supabase.from("acomptes").insert({
      user_id: user.id, worker_id: Number(form.workerId),
      montant: Number(form.montant), date: form.date, motif: form.motif,
    })
    if (error) showToast("Erreur lors de l'enregistrement", "error")
    else { showToast("Acompte enregistré"); await load() }
    setSaving(false)
    setModal(false)
    setForm({ workerId: "", montant: "", motif: "", date: TODAY })
  }

  const del = async (id) => {
    const { error } = await supabase.from("acomptes").delete().eq("id", id)
    if (error) showToast("Erreur suppression", "error")
    else { showToast("Acompte supprimé"); setAcomptes(a => a.filter(x => x.id !== id)) }
  }

  const currentMonth = TODAY.slice(0, 7)
  const totalMonth   = acomptes.filter(a => a.date?.startsWith(currentMonth)).reduce((s, a) => s + Number(a.montant), 0)

  return (
    <div style={{ padding: "20px 16px" }}>
      {toast && <Toast {...toast} />}
      <PageHeader
        title="Acomptes"
        subtitle={`${acomptes.length} enregistrés`}
        action={
  <div style={{ display:"flex", gap:8 }}>
    <Btn onClick={() => exportAcomptes(workers, acomptes, TODAY.slice(0,7))} color="#7c3aed" style={{ fontSize:13, padding:"10px 14px" }}>↓ Excel</Btn>
    <Btn onClick={() => setModal(true)}>+ Nouveau</Btn>
  </div>
}
      />

      {/* Monthly total */}
      <Card style={{ marginBottom: 24, background: "linear-gradient(135deg, #0f172a, #1e3a5f)" }}>
        <div style={{ padding: "20px 22px" }}>
          <div style={{ fontSize: 11, color: "#64748b", fontWeight: 700, textTransform: "uppercase", letterSpacing: 0.6, marginBottom: 4 }}>
            Total versé — {new Date().toLocaleDateString("fr-FR", { month: "long", year: "numeric" })}
          </div>
          <div style={{ fontFamily: "'Playfair Display', serif", fontSize: 36, color: "#fff", fontWeight: 900, letterSpacing: -1 }}>
            {fmt(totalMonth)} €
          </div>
        </div>
      </Card>

      {loading ? <Spinner /> : acomptes.length === 0 ? (
        <div style={{ textAlign: "center", padding: "50px 0", color: "#cbd5e1" }}>
          <div style={{ fontSize: 36, marginBottom: 10 }}>💶</div>
          <div style={{ fontSize: 14, fontWeight: 600 }}>Aucun acompte</div>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {acomptes.map(a => {
            const w = workers.find(x => x.id === a.worker_id)
            if (!w) return null
            return (
              <Card key={a.id}>
                <div style={{ padding: "16px 18px" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <Avatar name={w.name} id={w.id} size={34} />
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 700, fontSize: 14, color: "#0f172a" }}>{w.name}</div>
                      <div style={{ fontSize: 11, color: "#94a3b8" }}>
                        {new Date(a.date).toLocaleDateString("fr-FR", { day: "numeric", month: "short", year: "numeric" })}
                      </div>
                      {a.motif && <div style={{ fontSize: 12, color: "#94a3b8", fontStyle: "italic", marginTop: 2 }}>"{a.motif}"</div>}
                    </div>
                    <div style={{ fontWeight: 900, fontSize: 20, color: "#7c3aed", marginRight: 8 }}>{fmt(Number(a.montant))} €</div>
                    <button onClick={() => del(a.id)} style={{ background: "#fef2f2", border: "none", borderRadius: 8, width: 30, height: 30, color: "#ef4444", fontSize: 14, cursor: "pointer" }}>✕</button>
                  </div>
                </div>
              </Card>
            )
          })}
        </div>
      )}

      {modal && (
        <Modal title="Nouvel acompte" onClose={() => setModal(false)}>
          <Select label="Employé" value={form.workerId} onChange={v => setForm(f => ({ ...f, workerId: v }))}
            options={[{ value: "", label: "Choisir…" }, ...workers.map(w => ({ value: String(w.id), label: w.name }))]} />
          <Input label="Montant (€)" type="number" value={form.montant} onChange={v => setForm(f => ({ ...f, montant: v }))} placeholder="Ex: 300" />
          <Input label="Date" type="date" value={form.date} onChange={v => setForm(f => ({ ...f, date: v }))} />
          <Input label="Motif (optionnel)" value={form.motif} onChange={v => setForm(f => ({ ...f, motif: v }))} placeholder="Ex: urgence familiale" />
          <div style={{ display: "flex", gap: 10, marginTop: 8 }}>
            <Btn outline color="#94a3b8" onClick={() => setModal(false)} style={{ flex: 1 }}>Annuler</Btn>
            <Btn onClick={save} disabled={saving} style={{ flex: 2 }}>{saving ? "Enregistrement…" : "Enregistrer"}</Btn>
          </div>
        </Modal>
      )}
    </div>
  )
}
