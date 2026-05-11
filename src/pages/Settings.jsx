import { useState, useEffect } from 'react'
import { supabase } from '../supabase.js'
import { Card, Btn, Input, Spinner, Toast, fmt } from '../components/ui.jsx'

export default function Settings({ user, onSettingsChange }) {
  const [form,    setForm]    = useState({ company_name: "", standard_hours: "8", sup_multiplier: "1.5" })
  const [loading, setLoading] = useState(true)
  const [saving,  setSaving]  = useState(false)
  const [toast,   setToast]   = useState(null)

  const showToast = (message, type = "success") => { setToast({ message, type }); setTimeout(() => setToast(null), 2500) }

  useEffect(() => {
    const load = async () => {
      const { data } = await supabase.from("settings").select("*").eq("user_id", user.id).single()
      if (data) setForm({ company_name: data.company_name, standard_hours: String(data.standard_hours), sup_multiplier: String(data.sup_multiplier) })
      setLoading(false)
    }
    load()
  }, [user.id])

  const save = async () => {
    setSaving(true)
    const payload = { user_id: user.id, company_name: form.company_name, standard_hours: Number(form.standard_hours), sup_multiplier: Number(form.sup_multiplier) }
    const { error } = await supabase.from("settings").upsert(payload, { onConflict: "user_id" })
    if (error) showToast("Erreur lors de la sauvegarde", "error")
    else { showToast("Paramètres enregistrés"); onSettingsChange(payload) }
    setSaving(false)
  }

  const handleLogout = async () => { await supabase.auth.signOut() }

  if (loading) return <Spinner />

  return (
    <div style={{ padding: "20px 16px" }}>
      {toast && <Toast {...toast} />}
      <div style={{ fontFamily: "'Playfair Display', serif", fontSize: 26, color: "#0f172a", marginBottom: 4 }}>Paramètres</div>
      <div style={{ fontSize: 13, color: "#94a3b8", marginBottom: 28 }}>Règles de paie globales</div>

      <Card style={{ padding: "20px 18px", marginBottom: 14 }}>
        <div style={{ fontWeight: 700, fontSize: 14, color: "#0f172a", marginBottom: 16 }}>🏢 Entreprise</div>
        <Input label="Nom de l'entreprise" value={form.company_name} onChange={v => setForm(f => ({ ...f, company_name: v }))} placeholder="Mon Entreprise" />
      </Card>

      <Card style={{ padding: "20px 18px", marginBottom: 14 }}>
        <div style={{ fontWeight: 700, fontSize: 14, color: "#0f172a", marginBottom: 16 }}>⏱ Heures de travail</div>
        <Input label="Journée standard" type="number" value={form.standard_hours} onChange={v => setForm(f => ({ ...f, standard_hours: v }))} suffix="h" />
        <div style={{ fontSize: 12, color: "#94a3b8", marginTop: -8 }}>
          Au-delà de {form.standard_hours}h/jour → heures supplémentaires
        </div>
      </Card>

      <Card style={{ padding: "20px 18px", marginBottom: 28 }}>
        <div style={{ fontWeight: 700, fontSize: 14, color: "#0f172a", marginBottom: 16 }}>💰 Heures supplémentaires</div>
        <Input label="Multiplicateur" type="number" value={form.sup_multiplier} onChange={v => setForm(f => ({ ...f, sup_multiplier: v }))} suffix="×" />
        <div style={{ background: "#f8fafc", borderRadius: 12, padding: "12px 14px", marginTop: 4 }}>
          <div style={{ fontSize: 12, color: "#64748b", marginBottom: 6 }}>Exemple :</div>
          {[10, 12.5, 15].map(rate => (
            <div key={rate} style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
              <span style={{ fontSize: 12, color: "#94a3b8" }}>{rate} €/h normal →</span>
              <span style={{ fontSize: 12, fontWeight: 700, color: "#f59e0b" }}>{fmt(rate * Number(form.sup_multiplier))} €/h sup</span>
            </div>
          ))}
        </div>
      </Card>

      <Btn onClick={save} disabled={saving} style={{ width: "100%", marginBottom: 16 }}>
        {saving ? "Enregistrement…" : "Enregistrer les paramètres"}
      </Btn>

      {/* Account */}
      <Card style={{ padding: "16px 18px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <div style={{ fontWeight: 700, fontSize: 13, color: "#0f172a" }}>Compte connecté</div>
            <div style={{ fontSize: 12, color: "#94a3b8", marginTop: 2 }}>{user.email}</div>
          </div>
          <Btn outline color="#ef4444" onClick={handleLogout} style={{ padding: "8px 14px", fontSize: 12 }}>
            Déconnexion
          </Btn>
        </div>
      </Card>
    </div>
  )
}
