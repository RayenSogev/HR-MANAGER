import * as XLSX from 'xlsx'

const autoWidth = (ws) => {
  const cols = []
  const range = XLSX.utils.decode_range(ws['!ref'] || 'A1')
  for (let C = range.s.c; C <= range.e.c; C++) {
    let maxW = 10
    for (let R = range.s.r; R <= range.e.r; R++) {
      const cell = ws[XLSX.utils.encode_cell({ r: R, c: C })]
      if (cell && cell.v) maxW = Math.max(maxW, String(cell.v).length + 2)
    }
    cols.push({ wch: Math.min(maxW, 40) })
  }
  ws['!cols'] = cols
  return ws
}

const fmt2 = (n) => Number(Number(n).toFixed(2))
const fmtDate = (d) => d ? new Date(d).toLocaleDateString('fr-FR') : '—'
const timeToH = (t) => { if (!t) return 0; const [h,m] = t.split(':').map(Number); return h + m/60 }

export function exportPresence(workers, presence, month, companyName = 'Mon Entreprise') {
  const wb = XLSX.utils.book_new()
  const monthLabel = new Date(month + '-01').toLocaleDateString('fr-FR', { month:'long', year:'numeric' })
  const summaryRows = [
    [`${companyName} — Feuille de Présence — ${monthLabel}`],
    [],
    ['Employé','Poste','Jours Présent','Jours Retard','Jours Absent','Jours Congé','Heures Normales','Heures Sup','Total Heures'],
  ]
  workers.forEach(w => {
    const wp = presence.filter(p => p.worker_id === w.id)
    const present = wp.filter(p => p.status==='present').length
    const late    = wp.filter(p => p.status==='late').length
    const absent  = wp.filter(p => p.status==='absent').length
    const conge   = wp.filter(p => p.status==='conge').length
    let normalH=0, supH=0
    wp.filter(p => p.status==='present'||p.status==='late').forEach(p => {
      const t = timeToH(p.left_at) - timeToH(p.arrived)
      if (t>0) { normalH+=Math.min(t,8); supH+=Math.max(0,t-8) }
    })
    summaryRows.push([w.name,w.role,present,late,absent,conge,fmt2(normalH),fmt2(supH),fmt2(normalH+supH)])
  })
  const wsSummary = autoWidth(XLSX.utils.aoa_to_sheet(summaryRows))
  XLSX.utils.book_append_sheet(wb, wsSummary, 'Résumé')
  workers.forEach(w => {
    const wp = presence.filter(p => p.worker_id===w.id).sort((a,b)=>a.date.localeCompare(b.date))
    const rows = [[`${w.name} — ${monthLabel}`],[],['Date','Statut','Arrivée','Départ','Heures','Heures Sup']]
    wp.forEach(p => {
      const total = (p.status==='present'||p.status==='late')&&p.arrived&&p.left_at ? fmt2(timeToH(p.left_at)-timeToH(p.arrived)) : 0
      const sup = total ? fmt2(Math.max(0,total-8)) : 0
      const s = {present:'Présent',late:'Retard',absent:'Absent',conge:'Congé'}
      rows.push([fmtDate(p.date),s[p.status]||p.status,p.arrived||'—',p.left_at||'—',total||'—',sup||'—'])
    })
    XLSX.utils.book_append_sheet(wb, autoWidth(XLSX.utils.aoa_to_sheet(rows)), w.name.split(' ')[0].substring(0,20))
  })
  XLSX.writeFile(wb, `Presence_${month}.xlsx`)
}

export function exportConges(workers, conges, companyName = 'Mon Entreprise') {
  const wb = XLSX.utils.book_new()
  const rows = [
    [`${companyName} — Registre des Congés`],
    [`Généré le ${new Date().toLocaleDateString('fr-FR')}`],
    [],
    ['Employé','Poste','Type','Du','Au','Jours','Note'],
  ]
  conges.forEach(c => {
    const w = workers.find(x => x.id===c.worker_id)
    if (!w) return
    rows.push([w.name,w.role,c.type,fmtDate(c.date_from),fmtDate(c.date_to),c.days,c.note||''])
  })
  rows.push([],['— Récapitulatif —'],['Employé','Total jours'])
  workers.forEach(w => {
    rows.push([w.name, conges.filter(c=>c.worker_id===w.id).reduce((s,c)=>s+c.days,0)])
  })
  XLSX.utils.book_append_sheet(wb, autoWidth(XLSX.utils.aoa_to_sheet(rows)), 'Congés')
  XLSX.writeFile(wb, `Conges_${new Date().toISOString().slice(0,10)}.xlsx`)
}

export function exportAcomptes(workers, acomptes, month, companyName = 'Mon Entreprise') {
  const wb = XLSX.utils.book_new()
  const monthLabel = new Date(month+'-01').toLocaleDateString('fr-FR',{month:'long',year:'numeric'})
  const rows = [[`${companyName} — Acomptes — ${monthLabel}`],[],['Employé','Poste','Date','Montant (€)','Motif']]
  const ma = acomptes.filter(a => a.date?.startsWith(month))
  ma.forEach(a => {
    const w = workers.find(x=>x.id===a.worker_id)
    if (!w) return
    rows.push([w.name,w.role,fmtDate(a.date),fmt2(a.montant),a.motif||''])
  })
  rows.push([],['','','TOTAL',fmt2(ma.reduce((s,a)=>s+Number(a.montant),0)),''])
  XLSX.utils.book_append_sheet(wb, autoWidth(XLSX.utils.aoa_to_sheet(rows)), 'Acomptes')
  XLSX.writeFile(wb, `Acomptes_${month}.xlsx`)
}

export function exportFicheDePaie(workers, presence, acomptes, settings, month, companyName = 'Mon Entreprise') {
  const wb = XLSX.utils.book_new()
  const monthLabel = new Date(month+'-01').toLocaleDateString('fr-FR',{month:'long',year:'numeric'})
  const stdH = settings?.standard_hours||8
  const supMult = settings?.sup_multiplier||1.5
  const today = new Date().toLocaleDateString('fr-FR')
  workers.forEach(w => {
    const wp = presence.filter(p=>p.worker_id===w.id&&(p.status==='present'||p.status==='late'))
    let normalH=0, supH=0
    wp.forEach(p => {
      const t = timeToH(p.left_at)-timeToH(p.arrived)
      if (t>0) { normalH+=Math.min(t,stdH); supH+=Math.max(0,t-stdH) }
    })
    normalH=fmt2(normalH); supH=fmt2(supH)
    const normalPay = fmt2(normalH*w.hourly_rate)
    const supPay    = fmt2(supH*w.hourly_rate*supMult)
    const grossPay  = fmt2(normalPay+supPay)
    const acomp     = fmt2(acomptes.filter(a=>a.worker_id===w.id&&a.date?.startsWith(month)).reduce((s,a)=>s+Number(a.montant),0))
    const netPay    = fmt2(grossPay-acomp)
    const rows = [
      ['BULLETIN DE PAIE'],
      [],
      ['Entreprise', companyName,      '', 'Période',         monthLabel],
      ['',           '',               '', 'Date émission',   today],
      [],
      ['INFORMATIONS EMPLOYÉ'],
      ['Nom',        w.name,           '', 'Poste',           w.role],
      ['Taux',       `${w.hourly_rate} €/h`, '', 'Jours travaillés', wp.length],
      [],
      ['RÉMUNÉRATION'],
      ['Désignation',      'Quantité',       'Taux',                    '', 'Montant (€)'],
      ['Heures normales',  `${normalH} h`,   `${w.hourly_rate} €/h`,    '', normalPay],
    ]
    if (supH > 0) rows.push([`Heures sup (×${supMult})`, `${supH} h`, `${fmt2(w.hourly_rate*supMult)} €/h`, '', supPay])
    rows.push([], ['SALAIRE BRUT', '', '', '', grossPay], [])
    if (acomp > 0) rows.push(['DÉDUCTIONS'], ['Acomptes versés', '', '', '', -acomp], [])
    rows.push(
      ['NET À PAYER', '', '', '', netPay],
      [], [],
      ['Signature employeur', '', '', 'Signature employé', ''],
      ['_____________________', '', '', '_____________________', ''],
    )
    const ws = XLSX.utils.aoa_to_sheet(rows)
    ws['!cols'] = [{wch:28},{wch:20},{wch:15},{wch:18},{wch:14}]
    ws['!merges'] = [{s:{r:0,c:0},e:{r:0,c:4}}]
    XLSX.utils.book_append_sheet(wb, ws, w.name.split(' ')[0].substring(0,28))
  })
  XLSX.writeFile(wb, `Fiches_Paie_${month}.xlsx`)
}
