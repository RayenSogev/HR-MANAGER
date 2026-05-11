import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../supabase.js'
import { Avatar, Card, Btn, Input, Modal, Spinner, Toast, PageHeader } from '../components/ui.jsx'

export default function Equipe({ user }) {
  const [workers,    setWorkers]    = useState([])
  const [loading,    setLoading]    = useState(true)
  const [modal,      setModal]      = useState(false)
  const [editing,    setEditing]    = useState(null)
  const [delConfirm, setDelConfirm] = useState(null)
  const [saving,     setSaving]     = useState(false)
  const [toast,      setToast]      = useState(null)
  const [form,       setForm]       = useState({ name: "", role: "", hourly_rate: "", phone: "" })

  const showToast = (message, type = "success") => { setToast({ message, type }); setTimeout(() => setToast(null), 2500) }

  const load = useCallback(async () => {
    setLoading(true)
    const { data } = await supabase.from("workers").select("*").order("name")
    setWorkers(data || [])
    setLoading(false)
  }, [])

  useEffect(() => { load() }, [load])

  const openNew  = () => { setEditing(null); setForm({ name: "", role: "", hourly_rate: "", phone: "" }); setModal(true) }
  const openEdit = (w) => { setEditing(w); setForm({ name: w.name, role: w.role, hourly_rate: String(w.hourly_rate), phone: w.phone || "" }); setModal(true) }

  const save = async () => {
    if (!form.name || !form.role || !form.hourly_rate) return
    setSaving(true)
    const payload = { ...form, hourly_rate: Number(form.hourly_rate), user_id: user.id }
    const { error } = editing
      ? await supabase.from("workers").update(payload).eq("id", editing.id)
      : await supabase.from("workers").insert(payload)
    if (error) showToast("Erreur lors de l'enregistrement", "error")
    else { showToast(editing ? "Employé mis à jour" : "Employé ajouté"); await load() }
    setSaving(false)
    setModal(false)
  }

  const del = async (id) => {
    const { error } = await supabase.from("workers").delete().eq("id", id)
    if (error) showToast("Erreur suppression", "error")
    else { showToast("Employé supprimé"); setWorkers(ws => ws.filter(w => w.id !== id)) }
    setDelConfirm(null)
  }

  return (
    <div style={{ padding: "20px 16px" }}>
      {toast && <Toast {...toast} />}
      <PageHeader
        title="Équipe"
        subtitle={`${workers.length} collaborateurs`}
        action={<Btn onClick={openNew}>+ Ajouter</Btn>}
      />

      {loading ? <Spinner /> : (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {workers.map(w => (
            <Card key={w.id}>
              <div style={{ padding: "16px 18px", display: "flex", alignItems: "center", gap: 12 }}>
                <Avatar name={w.name} id={w.id} size={44} />
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 700, fontSize: 15, color: "#0f172a" }}>{w.name}</div>
                  <div style={{ fontSize: 12, color: "#94a3b8", marginTop: 2 }}>
                    {w.role} · <strong style={{ color: "#7c3aed" }}>{w.hourly_rate} €/h</strong>
                  </div>
                  {w.phone && <div style={{ fontSize: 11, color: "#cbd5e1", marginTop: 1 }}>{w.phone}</div>}
                </div>
                <div style={{ display: "flex", gap: 6 }}>
                  <button onClick={() => openEdit(w)} style={{ background: "#f1f5f9", border: "none", borderRadius: 10, width: 34, height: 34, fontSize: 15, cursor: "pointer" }}>✏️</button>
                  <button onClick={() => setDelConfirm(w)} style={{ background: "#fef2f2", border: "none", borderRadius: 10, width: 34, height: 34, fontSize: 15, cursor: "pointer" }}>🗑</button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {modal && (
        <Modal title={editing ? "Modifier l'employé" : "Nouvel employé"} onClose={() => setModal(false)}>
          <Input label="Nom complet"  value={form.name}        onChange={v => setForm(f => ({ ...f, name: v }))}        placeholder="Prénom Nom" />
          <Input label="Poste"        value={form.role}        onChange={v => setForm(f => ({ ...f, role: v }))}        placeholder="Ex: Technicien" />
          <Input label="Taux horaire" value={form.hourly_rate} onChange={v => setForm(f => ({ ...f, hourly_rate: v }))} type="number" placeholder="Ex: 12.50" suffix="€/h" />
          <Input label="Téléphone"    value={form.phone}       onChange={v => setForm(f => ({ ...f, phone: v }))}       placeholder="Optionnel" />
          <div style={{ display: "flex", gap: 10, marginTop: 8 }}>
            <Btn outline color="#94a3b8" onClick={() => setModal(false)} style={{ flex: 1 }}>Annuler</Btn>
            <Btn onClick={save} disabled={saving} style={{ flex: 2 }}>{saving ? "Enregistrement…" : editing ? "Mettre à jour" : "Ajouter"}</Btn>
          </div>
        </Modal>
      )}

      {delConfirm && (
        <Modal title="Supprimer ?" onClose={() => setDelConfirm(null)}>
          <div style={{ fontSize: 14, color: "#64748b", marginBottom: 8 }}>
            Supprimer <strong>{delConfirm.name}</strong> ?
          </div>
          <div style={{ fontSize: 13, color: "#ef4444", marginBottom: 24 }}>
            Toutes ses présences, congés et acomptes seront également supprimés.
          </div>
          <div style={{ display: "flex", gap: 10 }}>
            <Btn outline color="#94a3b8" onClick={() => setDelConfirm(null)} style={{ flex: 1 }}>Annuler</Btn>
            <Btn color="#ef4444" onClick={() => del(delConfirm.id)} style={{ flex: 1 }}>Supprimer</Btn>
          </div>
        </Modal>
      )}
    </div>
  )
}
