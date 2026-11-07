import { ATLAS, CARDS, LESSONS, QUESTIONS } from '../../content'
import { MARKERS } from '../../content/lab/markers'
import { ARCHETYPES } from '../../content/lab/archetypes'
import { PROTOCOLS } from '../../content/lab/protocols'
import { MODEL_PARAMETERS } from '../../sim/params'
export interface ReviewItem {
  id: string
  title: string
  kind: string
  risk: 'priority' | 'standard'
  reason: string
  paragraphs: string[]
  sourceIds: string[]
  href?: string
}
const softened: [string, string, string][] = [
  [
    'fixative-ratio',
    'Fixative-to-tissue volume',
    'Check the range and its specimen, container and procedure context; avoid a universal adequacy rule.',
  ],
  [
    'penetration',
    'Penetration versus chemical fixation',
    'Review the older approximate penetration statement and the new square-root teaching model. Neither predicts a clinical endpoint.',
  ],
  [
    'breast-fixation',
    'Predictive-marker preanalytics',
    'Verify any clinical fixation window against the current assay-specific professional guidance before endorsing the teaching wording.',
  ],
  [
    'michel',
    'Michel transport medium',
    'Verify composition wording and the distinction between transport and chemical fixation.',
  ],
  [
    'wax',
    'Paraffin melting point',
    'Check formulation-specific ranges and the distinction between melting, infiltration and bath temperatures.',
  ],
  [
    'nails',
    'Nail softening and decalcification',
    'Confirm that keratin softening is not described as equivalent to mineral removal.',
  ],
  [
    'thickness',
    'Special-stain section thickness',
    'Review Congo red and Jones method-specific thickness language and polarization limitations.',
  ],
  [
    'retrieval',
    'Retrieval buffer pH',
    'Check that buffer, time and temperature examples remain method-specific and are never presented as validated optimization.',
  ],
  [
    'atpase',
    'ATPase preincubation',
    'Review pH-dependent enzyme reaction language and preservation requirements.',
  ],
  [
    'alcian-yellow',
    'Alcian yellow method naming',
    'Confirm the named method, target and the source scope for the existing atlas entry.',
  ],
  [
    'pash',
    'PASH terminology',
    'Review local naming conventions and distinguish the exact method from similarly named variants.',
  ],
  [
    'bath',
    'Water bath conditions',
    'Review relative-to-wax temperature wording and time-dependent section expansion.',
  ],
  [
    'cryostat',
    'Frozen-section conditions',
    'Review tissue-dependent relative settings and avoid universal instrument temperature recommendations.',
  ],
  [
    'regulation',
    'Regulatory and validation boundaries',
    'Verify current CLIA/CAP/OSHA scope and jurisdiction. Numerical competency frequencies and validation case requirements are intentionally not inferred.',
  ],
]
export const REVIEW_ITEMS: ReviewItem[] = [
  ...softened.map(([id, title, reason]) => ({
    id: `review:${id}`,
    title,
    kind: 'Flagged teaching claim',
    risk: 'priority' as const,
    reason,
    paragraphs: [
      'Seeded from the scientific review priorities in docs/VERIFICATION.md. Record the exact wording, source version and proposed correction in your note.',
    ],
    sourceIds: ['hq-original'],
    href: '/atlas',
  })),
  ...MODEL_PARAMETERS.map((p) => ({
    id: `parameter:${p.id}`,
    title: p.id,
    kind: 'Model parameter',
    risk: 'priority' as const,
    reason: 'Numeric assumptions require review of scope and calibration claims.',
    paragraphs: [
      `${String(p.value)} ${p.unit}${p.range ? ` · range ${p.range.join('–')}` : ''}`,
      p.scope,
      p.note,
      `Status: ${p.accessStatus}; illustrative: ${p.illustrative ? 'yes' : 'no'}.`,
    ],
    sourceIds: p.sourceIds,
  })),
  ...MARKERS.map((m) => ({
    id: `marker:${m.id}`,
    title: m.label,
    kind: 'Marker',
    risk: 'priority' as const,
    reason: 'Confirm localization and control suitability for the actual assay.',
    paragraphs: [
      `Readout: ${m.modality}; localization: ${m.localization.join(', ')}.`,
      m.normalExpression,
      `External control: ${m.externalControl}`,
      `Internal control: ${m.internalControl}`,
      m.pitfalls,
      m.technicalUse,
    ],
    sourceIds: m.sourceIds,
  })),
  ...PROTOCOLS.map((p) => ({
    id: `protocol:${p.id}`,
    title: p.label,
    kind: 'Stain protocol',
    risk: 'priority' as const,
    reason:
      'Review the conceptual reaction sequence, control claims and incomplete modeled chemistry.',
    paragraphs: [
      `Target: ${p.target}; pathway: ${p.pathway}; mounting: ${p.mounting}.`,
      p.principle,
      `Expected teaching result: ${p.result}`,
      ...p.steps.map(
        (s) => `${s.label}: ${s.reagent}. ${s.note} Duration assumption: ${s.durationParam}.`,
      ),
      ...p.controls.map((c) => `Control: ${c}`),
      ...p.failures.map((f) => `${f.cause}: ${f.effect} Investigation: ${f.investigation}`),
      p.review.verification,
    ],
    sourceIds: p.sourceIds,
  })),
  ...ARCHETYPES.map((a) => ({
    id: `archetype:${a.id}`,
    title: a.label,
    kind: 'Specimen archetype',
    risk: 'priority' as const,
    reason:
      'Review specimen allocation, orientation and model anatomy within the stated teaching scope.',
    paragraphs: [
      `Family: ${a.family}; features: ${a.features.join(', ')}; pathways: ${a.pathways.join(', ')}.`,
      a.orientation,
      a.containment,
      ...a.risks,
      a.review.verification,
    ],
    sourceIds: a.sourceIds,
  })),
  ...QUESTIONS.map((q) => ({
    id: q.id,
    title: q.stem,
    kind: 'Question',
    risk: 'standard' as const,
    reason:
      'Check scientific accuracy, distractor plausibility and whether the answer follows from the stem.',
    paragraphs: [
      q.explanation,
      ...(q.format === 'choice'
        ? q.options.map(
            (o) =>
              `${o.id === q.answer ? 'Keyed answer' : 'Distractor'}: ${o.text} — ${o.rationale}`,
          )
        : [`Answer: ${q.answer} ${q.unit}`, ...q.steps]),
    ],
    sourceIds: q.references.map((r) => r.sourceId),
  })),
  ...CARDS.map((c) => ({
    id: c.id,
    title: c.front,
    kind: 'Retrieval card',
    risk: 'standard' as const,
    reason: 'Check concise recall wording without removing method-specific context.',
    paragraphs: [c.back],
    sourceIds: c.references.map((r) => r.sourceId),
  })),
  ...LESSONS.map((l) => ({
    id: l.id,
    title: l.title,
    kind: 'Lesson',
    risk: 'standard' as const,
    reason: 'Review the entire lesson, examples and linked questions.',
    paragraphs: [l.labQuestion, ...l.explanation, l.takeaway],
    sourceIds: l.references.map((r) => r.sourceId),
    href: `/learn/${l.id}`,
  })),
  ...ATLAS.map((a) => ({
    id: `atlas:${a.id}`,
    title: a.name,
    kind: 'Atlas',
    risk: 'standard' as const,
    reason: 'Check target, mechanism, safety and local-method qualifications.',
    paragraphs: [a.summary, ...a.facts.map((f) => `${f.label}: ${f.value}`)],
    sourceIds: a.references.map((r) => r.sourceId),
    href: `/atlas/${a.id}`,
  })),
]
export const REVIEW_KINDS = [...new Set(REVIEW_ITEMS.map((i) => i.kind))]
