import { useRef, useState } from 'react'
import { ACTIVE_GUIDELINE, guidelineForExamDate } from '../../content/curriculum'
import { exportJson, importJson, initialState } from '../../store/state'
import { getState, replaceState, setState, useAppState } from '../../store/store'
import { Segmented } from '../../ui/components'
import { ACCENTS, badges } from '../shared/badges'

export default function SettingsPage() {
  const s = useAppState((x) => x)
  const fileRef = useRef<HTMLInputElement>(null)
  const [msg, setMsg] = useState<{ ok: boolean; text: string }>()
  const earned = badges(s).filter((b) => b.earned).length
  const set = <K extends keyof typeof s.settings>(k: K, v: (typeof s.settings)[K]) => setState((x) => ({ ...x, settings: { ...x.settings, [k]: v } }))
  const g = s.profile.examDate ? guidelineForExamDate(s.profile.examDate) : ACTIVE_GUIDELINE

  const doExport = () => {
    const blob = new Blob([exportJson(getState())], { type: 'application/json' })
    const a = document.createElement('a')
    a.href = URL.createObjectURL(blob)
    a.download = `histoquest-progress-${new Date().toISOString().slice(0, 10)}.json`
    a.click()
    URL.revokeObjectURL(a.href)
    setMsg({ ok: true, text: 'Progress exported. Keep the file somewhere safe.' })
  }
  const doImport = async (file: File) => {
    const r = importJson(await file.text())
    if (!r.ok) return setMsg({ ok: false, text: `Nothing was changed. ${r.error}` })
    if (!confirm('Replace all current progress with the imported file?')) return
    replaceState(r.state)
    setMsg({ ok: true, text: `Imported${r.migratedFrom ? ` and upgraded from format v${r.migratedFrom}` : ''}.` })
  }

  return (
    <div className="page-narrow">
      <h1>Settings</h1>

      <section className="stack" aria-labelledby="look-h">
        <h2 id="look-h" style={{ fontSize: 'var(--t-3)' }}>Look and feel</h2>
        <div className="field"><span className="label">Theme</span><Segmented label="Theme" value={s.settings.theme} onChange={(v) => set('theme', v)} options={[{ value: 'system', label: 'System' }, { value: 'light', label: 'Light' }, { value: 'dark', label: 'Dark' }]} /></div>
        <div className="field"><span className="label">Motion</span><Segmented label="Motion" value={s.settings.motion} onChange={(v) => set('motion', v)} options={[{ value: 'system', label: 'Follow system' }, { value: 'reduced', label: 'Reduced' }, { value: 'full', label: 'Full' }]} /></div>
        <label className="row"><input type="checkbox" checked={s.settings.sound} onChange={(e) => set('sound', e.target.checked)} style={{ width: 22, height: 22 }} /> Soft sound on correct answers and finished lessons (off by default)</label>
        <label className="row"><input type="checkbox" checked={s.settings.streaks} onChange={(e) => set('streaks', e.target.checked)} style={{ width: 22, height: 22 }} /> Show study rhythm (one rest day per week is forgiven)</label>
        <fieldset style={{ border: 0, padding: 0 }}>
          <legend className="label" style={{ fontWeight: 600, fontSize: 'var(--t-0)', marginBottom: 8 }}>Accent colour ({earned} skill {earned === 1 ? 'badge' : 'badges'} earned)</legend>
          <div className="row">
            {ACCENTS.map((a) => {
              const locked = earned < a.needs
              return (
                <button key={a.id} className="chip-btn" aria-pressed={s.settings.accent === a.id} disabled={locked} onClick={() => set('accent', a.id)} title={locked ? `Unlocks with ${a.needs} badges` : a.label}>
                  {a.label}{locked ? ` (needs ${a.needs} badges)` : ''}
                </button>
              )
            })}
          </div>
        </fieldset>
      </section>

      <section className="stack" style={{ marginTop: 36 }} aria-labelledby="exam-h">
        <h2 id="exam-h" style={{ fontSize: 'var(--t-3)' }}>Exam and guideline</h2>
        <div className="field" style={{ maxWidth: 260 }}>
          <label htmlFor="exam-date">Intended exam date</label>
          <input id="exam-date" className="input" type="date" value={s.profile.examDate} onChange={(e) => setState((x) => ({ ...x, profile: { ...x.profile, examDate: e.target.value } }))} />
        </div>
        <div className="inset small">
          <p style={{ margin: 0 }}><strong>{g?.title ?? 'No guideline found for that date'}</strong></p>
          {g && <p style={{ margin: '4px 0 0' }}>Revised {g.revised}{g.validFrom ? `, for tests from ${g.validFrom}` : ''}{g.validThrough ? `, for tests through ${g.validThrough}` : ''}. Verified {g.verifiedOn}. {g.verificationNote} <a href={g.url} target="_blank" rel="noreferrer">PDF</a></p>}
        </div>
      </section>

      <section className="stack" style={{ marginTop: 36 }} aria-labelledby="tutor-h">
        <h2 id="tutor-h" style={{ fontSize: 'var(--t-3)' }}>Tutor</h2>
        <p>No AI tutor is connected in this build. HistoQuest uses structured hints instead: the objective, then ruling out an option, then the principle in the atlas. Every explanation is written content with its sources listed. Nothing on screen pretends to be a live AI conversation.</p>
        <div className="field" style={{ maxWidth: 360 }}>
          <span className="label">Explanation depth (applies to the planned tutor)</span>
          <Segmented label="Explanation depth" value={s.settings.tutorDepth} onChange={(v) => set('tutorDepth', v)} options={[{ value: 'brief', label: 'Brief' }, { value: 'standard', label: 'Standard' }, { value: 'deep', label: 'Deep' }]} />
        </div>
      </section>

      <section className="stack" style={{ marginTop: 36 }} aria-labelledby="data-h">
        <h2 id="data-h" style={{ fontSize: 'var(--t-3)' }}>Your data</h2>
        <p>Progress lives only in this browser. Nothing is uploaded, and no account is needed. Export regularly as a backup or to move to another device.</p>
        <div className="row">
          <button className="btn btn-primary" onClick={doExport}>Export progress (JSON)</button>
          <button className="btn" onClick={() => fileRef.current?.click()}>Import progress</button>
          <input ref={fileRef} type="file" accept="application/json,.json" hidden onChange={(e) => { const f = e.target.files?.[0]; if (f) doImport(f); e.target.value = '' }} />
        </div>
        {msg && <p className={`feedback ${msg.ok ? 'ok' : 'no'}`} role="status">{msg.text}</p>}
        <button className="btn btn-quiet btn-danger" onClick={() => { if (confirm('Erase all HistoQuest progress in this browser? Export first if you might want it back.')) { replaceState(initialState()); setMsg({ ok: true, text: 'Progress erased.' }) } }}>Erase all progress</button>
      </section>
    </div>
  )
}
