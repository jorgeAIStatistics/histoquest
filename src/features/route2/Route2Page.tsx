import { setState, useAppState } from '../../store/store'
import type { Route2Data } from '../../store/state'
import { daysBetween, localDate } from '../../engine/dates'

/** Verbatim structure from the ASCP HTL page (read 2026-11-04) and the Routes 2–3 Experience Documentation Form (rev. Dec 9, 2025). */
const VERIFIED_ON = '2026-11-04'
const LINKS = {
  page: 'https://www.ascp.org/boc/explore-credentials/view-all-credentials/HTL',
  expForm: 'https://ascpcontentwebsite.blob.core.windows.net/boccontent/docs/default-source/explore-credentials/documentation-forms/ascp_htl_route_2_3_docbac04a08-952f-4f13-b912-ab2a3ea0d96e.pdf?sfvrsn=66314e4b_1',
  programForm: 'https://ascpcontentwebsite.blob.core.windows.net/boccontent/docs/default-source/explore-credentials/documentation-forms/ascp_htl_route_2_program_completion7cf7d610-39b5-421c-a831-29940031b5f8.pdf?sfvrsn=20fea18b_1',
  education: 'https://www.ascp.org/boc/earn-a-credential/application-process/documentation-guidelines/acceptable-education',
  transcripts: 'https://www.ascp.org/boc/earn-a-credential/application-process/documentation-guidelines/official-transcripts',
  clia: 'https://www.cms.gov/regulations-and-guidance/legislation/clia/downloads/aolist.pdf',
  assistant: 'https://www.ascp.org/boc/explore-credentials/eligibility-pathways/eligibility-assistant',
}

const AREAS: { group: string; items: string[] }[] = [
  { group: 'Fixation', items: ['Tissue identification', 'Parameters (e.g., pH, time, temperature)', 'Reagents', 'Selection, preparation, and use of fixatives for various applications', 'Troubleshooting/problem solving of fixation artifacts'] },
  { group: 'Processing', items: ['Selection, preparation, and use of decalcification reagents', 'Selection of appropriate processing methods (e.g., routine histology, immunohistochemistry, cytology)', 'Operation and maintenance of a tissue processor'] },
  { group: 'Embedding/Microtomy', items: ['Tissue identification and orientation for embedding', 'Operation and maintenance of an embedding center', 'Microtomy (e.g., paraffin, frozen)', 'Operation and maintenance of a microtome / water bath and cryostat'] },
  { group: 'Staining', items: ['Selection of appropriate control material', 'Reagent preparation', 'Operation and maintenance of staining equipment', 'Mounting and coverslipping procedures', 'Identification of tissue structures and their staining characteristics', 'Routine staining (i.e., H&E)', 'Special staining (e.g., carbohydrates and amyloid, connective tissue, microorganisms, nerve, pigments and minerals)', 'Immunohistochemistry'] },
  { group: 'Laboratory Operations', items: ['Operation, preventive maintenance, and corrective action for equipment', 'Troubleshooting', 'Quality control', 'Application of laboratory safety protocols'] },
]
const ALL_ITEMS = AREAS.flatMap((a) => a.items.map((i) => `${a.group}: ${i}`))

const upd = (fn: (r: Route2Data) => Route2Data) => setState((s) => ({ ...s, route2: fn(s.route2) }))
const newJob = (): Route2Data['jobs'][number] => ({ id: `j-${Date.now().toString(36)}`, employer: '', title: '', start: '', end: '', hoursPerWeek: 40, setting: 'unknown', cliaStatus: 'unknown', supervisor: '', formStatus: 'not-started', notes: '' })

/** Full-time-equivalent months within the last 5 years, assuming 40 h/week = full time. Self-reported arithmetic only. */
export function fteMonthsLast5y(jobs: Route2Data['jobs'], today = localDate()): number {
  const [y, m, d] = today.split('-').map(Number)
  const windowStart = `${y - 5}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`
  return jobs.reduce((acc, j) => {
    if (!j.start) return acc
    const start = j.start > windowStart ? j.start : windowStart
    const end = j.end && j.end < today ? j.end : today
    const days = Math.max(0, daysBetween(start, end))
    return acc + (days / 30.44) * Math.min(1, j.hoursPerWeek / 40)
  }, 0)
}

export default function Route2Page() {
  const r = useAppState((s) => s.route2)
  const fte = fteMonthsLast5y(r.jobs)
  const clinicalOk = r.jobs.some((j) => j.cliaStatus !== 'unknown' && j.cliaStatus !== 'none')
  const missingAreas = ALL_ITEMS.filter((k) => (r.competencies[k]?.self ?? 'none') === 'none')
  const undocumented = ALL_ITEMS.filter((k) => !r.competencies[k]?.documented)
  const gaps: string[] = []
  if (!r.degree.title) gaps.push('Degree details not recorded.')
  if (r.degree.major && !/bio|chem/i.test(r.degree.major) && !r.degree.bioChemHours) gaps.push('Major is not biology or chemistry. Record your combined biology + chemistry semester hours (Route 2 alternative: 30 semester / 45 quarter hours including both).')
  if (r.degree.accredited !== 'yes') gaps.push('Confirm the college/university is regionally or nationally accredited (see ASCP “Acceptable Education”).')
  if (r.degree.transcript === 'none') gaps.push('No official transcript requested yet.')
  if (fte < 12) gaps.push(`Self-reported experience is about ${fte.toFixed(1)} full-time months in the last 5 years. Route 2 lists 1 year full-time, or the structured-program option.`)
  if (r.jobs.length && !clinicalOk) gaps.push('Laboratory accreditation status (CLIA, DoD CLIP, JCI or ISO 15189) is not recorded for any job. Veterinary, industry or research experience must be in the U.S. or Canada.')
  if (missingAreas.length) gaps.push(`${missingAreas.length} required experience areas have no self-reported experience yet.`)
  if (r.jobs.some((j) => j.formStatus !== 'letter-received')) gaps.push('One or more supervisor documentation forms or letters of authenticity are not yet received.')

  return (
    <div className="page">
      <div className="page-head">
        <div>
          <h1>Route 2 preparation tracker</h1>
          <p className="lede">Organize your evidence and spot gaps. This tracker doesn’t decide eligibility. Only ASCP BOC determines that, from your application and documentation.</p>
        </div>
        <a className="btn" href={LINKS.assistant} target="_blank" rel="noreferrer">ASCP eligibility assistant</a>
      </div>

      <section className="panel" aria-labelledby="req-h">
        <h2 id="req-h" style={{ fontSize: 'var(--t-3)' }}>What Route 2 asks for</h2>
        <p className="small muted">Summarized from the ASCP HTL page, verified {VERIFIED_ON}. Check the <a href={LINKS.page} target="_blank" rel="noreferrer">official page</a> before applying, because requirements change.</p>
        <ul>
          <li>Baccalaureate degree from an accredited (regionally or nationally) college/university, <strong>with a major in biological science or chemistry</strong>, OR with a combination of <strong>30 semester hours (45 quarter hours) in biology and chemistry</strong> (must include both).</li>
          <li><strong>And one of:</strong> 1 year full-time acceptable clinical experience in a histopathology laboratory within the last 5 years; or 1 year full-time veterinary, industry or research histopathology experience in the U.S. or Canada within the last 5 years; or a two-part structured histology program of at least 9 months, with didactic training and at least 480 hours of clinical experience within the last 5 years.</li>
          <li>Acceptable clinical laboratory: CMS CLIA certificate (registration, compliance, accreditation), DoD CLIP, JCI accreditation, or ISO 15189 accreditation.</li>
          <li>Experience within the last 5 years in <strong>all</strong> the listed areas below, verified by your supervisor on the Experience Documentation Form, plus a letter of authenticity on institutional letterhead with a wet signature.</li>
        </ul>
        <div className="row">
          <a href={LINKS.expForm} target="_blank" rel="noreferrer">Experience Documentation Form (Routes 2 and 3)</a>
          <a href={LINKS.programForm} target="_blank" rel="noreferrer">Structured Program Documentation Form</a>
          <a href={LINKS.education} target="_blank" rel="noreferrer">Acceptable education</a>
          <a href={LINKS.transcripts} target="_blank" rel="noreferrer">Transcripts</a>
          <a href={LINKS.clia} target="_blank" rel="noreferrer">CMS accrediting organizations list</a>
        </div>
        <p className="notice small" style={{ marginTop: 16 }}>Virtual Lab simulations and HistoQuest study never count as qualifying experience. Your degree and job title alone don’t establish eligibility.</p>
      </section>

      <section className="panel" style={{ marginTop: 24 }} aria-labelledby="gaps-h">
        <h2 id="gaps-h" style={{ fontSize: 'var(--t-3)' }}>Open items</h2>
        {gaps.length ? <ul>{gaps.map((g) => <li key={g}>{g}</li>)}</ul> : <p>No open items in what you’ve recorded. Confirm everything with ASCP before applying.</p>}
        <p className="small muted">Self-reported totals: about {fte.toFixed(1)} full-time-equivalent months in the last 5 years (40 h/week counts as full time; ASCP’s definition governs). {ALL_ITEMS.length - undocumented.length} of {ALL_ITEMS.length} areas are marked as supervisor-documented.</p>
      </section>

      <section style={{ marginTop: 24 }} aria-labelledby="deg-h">
        <h2 id="deg-h" style={{ fontSize: 'var(--t-3)' }}>Degree <span className="tag">Self-reported</span></h2>
        <div className="grid-3">
          {([['title', 'Degree (e.g. BS)'], ['major', 'Major'], ['institution', 'Institution'], ['conferred', 'Date conferred'], ['bioChemHours', 'Biology + chemistry semester hours']] as const).map(([k, label]) => (
            <div className="field" key={k}>
              <label htmlFor={`deg-${k}`}>{label}</label>
              <input id={`deg-${k}`} className="input" type={k === 'conferred' ? 'date' : 'text'} value={r.degree[k]} onChange={(e) => upd((x) => ({ ...x, degree: { ...x.degree, [k]: e.target.value } }))} />
            </div>
          ))}
          <div className="field">
            <label htmlFor="deg-acc">Institution accredited?</label>
            <select id="deg-acc" className="input" value={r.degree.accredited} onChange={(e) => upd((x) => ({ ...x, degree: { ...x.degree, accredited: e.target.value as Route2Data['degree']['accredited'] } }))}>
              <option value="unknown">Not checked</option><option value="yes">Yes (verified)</option><option value="no">No</option>
            </select>
          </div>
          <div className="field">
            <label htmlFor="deg-tr">Official transcript</label>
            <select id="deg-tr" className="input" value={r.degree.transcript} onChange={(e) => upd((x) => ({ ...x, degree: { ...x.degree, transcript: e.target.value as Route2Data['degree']['transcript'] } }))}>
              <option value="none">Not requested</option><option value="requested">Requested</option><option value="have-official">Official copy ready</option><option value="evaluated">Foreign evaluation done</option>
            </select>
          </div>
        </div>
      </section>

      <section style={{ marginTop: 28 }} aria-labelledby="jobs-h">
        <div className="row" style={{ justifyContent: 'space-between' }}>
          <h2 id="jobs-h" style={{ fontSize: 'var(--t-3)' }}>Employment and training</h2>
          <button className="btn" onClick={() => upd((x) => ({ ...x, jobs: [...x.jobs, newJob()] }))}>Add a position</button>
        </div>
        {r.jobs.length === 0 && <p className="muted">No positions recorded. Add your current histology assistant role to start. Note its duties honestly; not every task counts toward the listed areas.</p>}
        {r.jobs.map((j) => {
          const set = (patch: Partial<typeof j>) => upd((x) => ({ ...x, jobs: x.jobs.map((y) => (y.id === j.id ? { ...y, ...patch } : y)) }))
          return (
            <div key={j.id} className="panel" style={{ marginBottom: 14 }}>
              <div className="grid-3">
                <div className="field"><label htmlFor={`${j.id}-emp`}>Employer / lab</label><input id={`${j.id}-emp`} className="input" value={j.employer} onChange={(e) => set({ employer: e.target.value })} /></div>
                <div className="field"><label htmlFor={`${j.id}-title`}>Title</label><input id={`${j.id}-title`} className="input" value={j.title} onChange={(e) => set({ title: e.target.value })} /></div>
                <div className="field"><label htmlFor={`${j.id}-sup`}>Supervisor (who can verify)</label><input id={`${j.id}-sup`} className="input" value={j.supervisor} onChange={(e) => set({ supervisor: e.target.value })} /></div>
                <div className="field"><label htmlFor={`${j.id}-start`}>Start</label><input id={`${j.id}-start`} type="date" className="input" value={j.start} onChange={(e) => set({ start: e.target.value })} /></div>
                <div className="field"><label htmlFor={`${j.id}-end`}>End (blank = current)</label><input id={`${j.id}-end`} type="date" className="input" value={j.end} onChange={(e) => set({ end: e.target.value })} /></div>
                <div className="field"><label htmlFor={`${j.id}-hrs`}>Hours per week in histotechnology</label><input id={`${j.id}-hrs`} type="number" min={0} max={80} className="input" value={j.hoursPerWeek} onChange={(e) => set({ hoursPerWeek: Number(e.target.value) })} /></div>
                <div className="field"><label htmlFor={`${j.id}-set`}>Setting</label>
                  <select id={`${j.id}-set`} className="input" value={j.setting} onChange={(e) => set({ setting: e.target.value as typeof j.setting })}>
                    <option value="unknown">Not set</option><option value="clinical">Clinical</option><option value="veterinary">Veterinary</option><option value="industry">Industry</option><option value="research">Research</option>
                  </select></div>
                <div className="field"><label htmlFor={`${j.id}-clia`}>Lab accreditation</label>
                  <select id={`${j.id}-clia`} className="input" value={j.cliaStatus} onChange={(e) => set({ cliaStatus: e.target.value as typeof j.cliaStatus })}>
                    <option value="unknown">Not checked</option><option value="clia">CMS CLIA certificate</option><option value="clip">DoD CLIP</option><option value="jci">JCI</option><option value="iso15189">ISO 15189</option><option value="none">None of these</option>
                  </select></div>
                <div className="field"><label htmlFor={`${j.id}-form`}>Documentation status</label>
                  <select id={`${j.id}-form`} className="input" value={j.formStatus} onChange={(e) => set({ formStatus: e.target.value as typeof j.formStatus })}>
                    <option value="not-started">Not started</option><option value="requested">Asked supervisor</option><option value="signed">Form signed</option><option value="letter-received">Form + letter of authenticity received</option>
                  </select></div>
              </div>
              <div className="field" style={{ marginTop: 12 }}><label htmlFor={`${j.id}-notes`}>Notes</label><textarea id={`${j.id}-notes`} className="input" value={j.notes} onChange={(e) => set({ notes: e.target.value })} /></div>
              <button className="btn btn-quiet btn-danger" style={{ marginTop: 8 }} onClick={() => { if (confirm('Remove this position from the tracker?')) upd((x) => ({ ...x, jobs: x.jobs.filter((y) => y.id !== j.id) })) }}>Remove position</button>
            </div>
          )
        })}
      </section>

      <section style={{ marginTop: 28 }} aria-labelledby="areas-h">
        <h2 id="areas-h" style={{ fontSize: 'var(--t-3)' }}>Required experience areas</h2>
        <p className="small muted">“Self” is your own honest estimate. “Documented” means a supervisor has verified it on the ASCP form, which is external verification HistoQuest can’t check.</p>
        {AREAS.map((a) => (
          <div key={a.group} style={{ marginBottom: 18 }}>
            <h3>{a.group}</h3>
            <ul className="list">
              {a.items.map((i) => {
                const key = `${a.group}: ${i}`
                const c = r.competencies[key] ?? { self: 'none', documented: false, notes: '' }
                const set = (patch: Partial<typeof c>) => upd((x) => ({ ...x, competencies: { ...x.competencies, [key]: { ...c, ...patch } } }))
                return (
                  <li key={key}>
                    <div className="list-row" style={{ flexWrap: 'wrap' }}>
                      <span style={{ flex: '1 1 280px' }}>{i}</span>
                      <span className="row" style={{ gap: 8 }}>
                        <label className="small" htmlFor={`self-${key}`}>Self</label>
                        <select id={`self-${key}`} className="input" style={{ width: 'auto', minHeight: 38 }} value={c.self} onChange={(e) => set({ self: e.target.value as typeof c.self })}>
                          <option value="none">None yet</option><option value="some">Some exposure</option><option value="routine">Routine</option>
                        </select>
                        <label className="small row" style={{ gap: 6 }}><input type="checkbox" checked={c.documented} onChange={(e) => set({ documented: e.target.checked })} style={{ width: 20, height: 20 }} /> Documented</label>
                      </span>
                    </div>
                  </li>
                )
              })}
            </ul>
          </div>
        ))}
      </section>
    </div>
  )
}
