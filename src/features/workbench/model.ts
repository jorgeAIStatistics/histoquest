import { z } from 'zod'

export const STATIONS = ['Accessioning', 'Grossing', 'Fixation', 'Processing', 'Embedding', 'Microtomy', 'H&E', 'Special stains', 'IHC', 'Technical handoff'] as const
export const CASES = [
  { id: 'skin', title: 'Skin excision', level: 'Start here', label: 'HQ-27-0101 · A1', description: 'An oriented small skin ellipse. Preserve the epidermis-to-deep-tissue profile and the relationship to the inked surface.', dimensions: '12 × 6 × 4 mm', fragments: 3, schedule: 'routine', orientation: 'profile', stain: 'pas', target: 'Fungal structures in a requested PAS study', compartment: 'nuclear', marker: 'SOX10', preanalytic: 'Routine soft-tissue pathway. The request includes a separate educational IHC control exercise.' },
  { id: 'colon', title: 'Mucosal biopsies', level: 'Protect small tissue', label: 'HQ-27-0102 · A1', description: 'Four tiny mucosal fragments. Preserve every fragment and show the surface-to-base relationship where orientation is feasible.', dimensions: 'Four fragments, 1–3 mm each', fragments: 4, schedule: 'biopsy', orientation: 'profile', stain: 'alcian', target: 'Acid mucins in a requested pH 2.5 Alcian blue study', compartment: 'cytoplasmic', marker: 'pan-cytokeratin', preanalytic: 'Use an appropriate biopsy containment method. No extra trimming is needed solely to reach a nominal thickness.' },
  { id: 'bone', title: 'Decalcified bone core', level: 'Preserve ancillary targets', label: 'HQ-27-0103 · A1', description: 'A fixed bone core requiring paraffin sections and an ancillary protein study. Balance sectionability with preservation.', dimensions: '15 × 2 mm core', fragments: 1, schedule: 'bone', orientation: 'longitudinal', stain: 'iron', target: 'Ferric iron in a requested Prussian blue study', compartment: 'nuclear', marker: 'Ki-67', preanalytic: 'The teaching protocol uses EDTA after adequate fixation, endpoint monitoring, and an assay validated for this substrate.' },
] as const
export type SpecimenCase = typeof CASES[number]
export const ControlsSchema = z.object({
  identity: z.enum(['hold', 'relabel', 'accept']).default('accept'),
  thickness: z.number().min(1).max(10).default(6),
  fragments: z.number().int().min(0).max(12).default(0),
  sampling: z.enum(['profile', 'enface', 'random']).default('random'),
  fixation: z.enum(['validated', 'rush', 'heat']).default('rush'),
  decalcification: z.enum(['edta', 'acid', 'none']).default('none'),
  schedule: z.enum(['biopsy', 'routine', 'bone']).default('routine'),
  sequence: z.array(z.enum(['dehydrate', 'clear', 'infiltrate'])).length(3).refine(a => new Set(a).size === 3, 'Use each processing stage once').default(['infiltrate', 'dehydrate', 'clear']),
  orientation: z.enum(['flat', 'profile', 'longitudinal']).default('flat'),
  section: z.number().min(1).max(12).default(8),
  blade: z.enum(['sound', 'nicked']).default('nicked'),
  block: z.enum(['conditioned', 'warm']).default('warm'),
  safety: z.boolean().default(false),
  dewax: z.boolean().default(false),
  nuclei: z.boolean().default(false),
  eosin: z.boolean().default(false),
  mount: z.boolean().default(false),
  stain: z.enum(['pas', 'alcian', 'iron', 'oil']).default('oil'),
  positive: z.boolean().default(false),
  ihcAction: z.enum(['release', 'repeat', 'ignore']).default('release'),
  location: z.enum(['nuclear', 'cytoplasmic', 'membranous']).default('membranous'),
  handoff: z.enum(['release', 'hold']).default('release'),
})
export type Controls = z.infer<typeof ControlsSchema>
export const FindingSchema = z.object({ station: z.number().int().min(0).max(9), ok: z.boolean(), title: z.string(), detail: z.string(), consequence: z.string(), repair: z.string() })
export type Finding = z.infer<typeof FindingSchema>
export const WorkbenchSchema = z.object({
  caseId: z.enum(['skin', 'colon', 'bone']),
  station: z.number().int().min(0).max(10),
  controls: ControlsSchema,
  findings: z.array(FindingSchema).max(10),
  startedAt: z.string(),
  recorded: z.boolean().default(false),
}).superRefine((r, ctx) => {
  if (r.findings.length !== r.station || r.findings.some((f, i) => f.station !== i)) ctx.addIssue({ code: 'custom', message: 'Station history must be sequential.' })
})
export type WorkbenchRun = z.infer<typeof WorkbenchSchema>
export function startRun(caseId: SpecimenCase['id']): WorkbenchRun {
  return { caseId, station: 0, controls: ControlsSchema.parse({}), findings: [], startedAt: new Date().toISOString(), recorded: false }
}
export function canRelease(findings: Finding[]) { return findings.filter(f => f.station < 9).length === 9 && findings.filter(f => f.station < 9).every(f => f.ok) }

export function evaluateStation(index: number, c: Controls, specimen: SpecimenCase, previous: Finding[]): Finding {
  const make = (ok: boolean, title: string, detail: string, consequence: string, repair: string): Finding => ({ station: index, ok, title, detail, consequence, repair })
  switch (index) {
    case 0: return make(c.identity === 'hold', 'Identity and receipt', 'The bottle and request disagree on the date of birth. Hold and resolve through the submitting team; this exercise then supplies a documented correction.', 'An unresolved discrepancy breaks the chain of identity regardless of slide appearance.', 'Document and resolve the discrepancy through the authorized process before accepting the specimen.')
    case 1: return make(c.fragments === specimen.fragments && c.sampling === 'profile' && c.thickness <= 4, 'Sampling and containment', `The teaching block key calls for ${specimen.fragments} ${specimen.fragments === 1 ? 'piece' : 'pieces'}, preserved in profile, without compressing the cassette. The exercise uses a maximum thickness of 4 mm; tiny fragments need no unnecessary trimming.`, 'Poor representation or missing fragments cannot be repaired by staining.', 'Reconcile fragments, review the block key and sample geometry with authorized staff.')
    case 2: return make(c.fixation === 'validated' && (specimen.id !== 'bone' || c.decalcification === 'edta'), 'Preservation', specimen.id === 'bone' ? 'For this case, adequate fixation precedes a monitored EDTA pathway compatible with the specified ancillary assay.' : 'Use the validated fixation criteria and document relevant times. This model does not calculate a clinical fixation duration.', 'Inadequate preservation can compromise nuclear detail and downstream assays.', 'Review preservation history and follow the laboratory’s controlled recovery or escalation procedure; damage may be irreversible.')
    case 3: return make(c.sequence.join(',') === 'dehydrate,clear,infiltrate' && c.schedule === specimen.schedule, 'Reagent exchange', `The sequence is dehydration → clearing → infiltration. This case uses the ${specimen.schedule} teaching schedule; these labels represent validated specimen classes, not real instrument programs.`, 'Wrong order or an unsuitable schedule risks poorly supported or brittle tissue.', 'Review run records, reagents and sample preparation before considering a validated reprocessing procedure.')
    case 4: return make(c.orientation === specimen.orientation, 'Plane of section', specimen.id === 'bone' ? 'A longitudinal face represents the length of the core in this teaching task.' : 'A profile face shows the surface-to-depth relationship requested in this case.', 'The required structures may not share one section plane; deeper cutting can consume tissue without solving the orientation.', 'Check the block key and consider controlled re-embedding when feasible.')
    case 5: return make(c.section === 4 && c.blade === 'sound' && c.block === 'conditioned' && c.safety, 'Section preparation', 'This exercise specifies a 4 µm section, sound blade, appropriately conditioned block, and the instrument safety check. Other assays may require different thicknesses.', 'Thick, compressed, or scored sections obscure detail; unsafe handling is a separate failure even if the section looks good.', 'Apply the instrument procedure, then investigate one plausible variable at a time and inspect a new section.')
    case 6: return make(c.dewax && c.nuclei && c.eosin && c.mount, 'Routine stain and mounting', 'All four milestones are required here: reagent access, nuclear contrast, cytoplasmic contrast, and a compatible final mounting pathway.', 'Wax, weak contrast or optical cloudiness can limit technical review.', 'Localize the defect and check preparation, reagents, method controls and mounting compatibility.')
    case 7: return make(c.stain === specimen.stain && c.positive, 'Target and control', `${specimen.target}. Include a known target-positive control. For a PAS-D variant, digestion performance needs its own appropriate control.`, 'An unsuitable stain or absent target control makes the requested result unreliable.', 'Use the requested target-appropriate method and control material, then evaluate the run.')
    case 8: return make(c.ihcAction === 'repeat' && c.location === specimen.compartment, 'IHC control failure', `The initial external positive control failed. The correct response is to hold, investigate and repeat. In this synthetic branch, a documented reagent fault is corrected and the repeat controls pass; ${specimen.marker} is evaluated in the ${specimen.compartment} compartment.`, 'A negative sample with a failed expected-positive control is not an interpretable negative.', 'Resolve the control failure, verify the corrected run, and assess expected localization and background.')
    case 9: return make(c.handoff === (canRelease(previous) ? 'release' : 'hold'), 'Technical handoff decision', canRelease(previous) ? 'All modeled technical checks passed. This is a technical handoff for pathologist review, not a diagnosis.' : 'Earlier unresolved failures require a technical hold and documented corrective action, even if the final stain looks attractive.', 'A release decision must account for the whole chain, including failures that are not visible on the slide.', 'Communicate specific limitations, complete corrective action where possible, and verify before technical release.')
    default: throw new Error('Unknown station')
  }
}
export function advanceRun(run: WorkbenchRun): WorkbenchRun {
  if (run.station >= STATIONS.length) return run
  const specimen = CASES.find(c => c.id === run.caseId)!
  const finding = evaluateStation(run.station, run.controls, specimen, run.findings)
  return { ...run, station: run.station + 1, findings: [...run.findings, finding] }
}
