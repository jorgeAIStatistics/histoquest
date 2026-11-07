// Regenerates docs/CONTENT_INVENTORY.md: GEN_INVENTORY=1 npx vitest run src/content/inventory.test.ts
import { writeFileSync } from 'node:fs'
import { describe, it } from 'vitest'
import { ATLAS, CARDS, LESSONS, QUESTIONS, SIMULATIONS } from '.'
import { ACTIVE_GUIDELINE, OBJECTIVES } from './curriculum'
import { ARCHETYPES } from './lab/archetypes'
import { MARKERS } from './lab/markers'
import { PROTOCOLS } from './lab/protocols'
import { CAREER_LEVELS, COMPETENCIES } from './lab/curriculum'
import { ADDITIONAL_MICROGRAPHS } from './lab/micrographs'
import { MODEL_PARAMETERS } from '../sim/params'
import { CLINIC_CASES } from '../sim/core/clinic'
import { SPECIAL_CONTROL_SPECS } from '../sim/models/specialExperiments'
import { SOURCES } from './sources'
import { PATHWAY, STAIN_COMPARISONS, ARTIFACTS } from './pathway'
import { CASES, STATIONS } from '../features/workbench/model'

describe.runIf(!!process.env.GEN_INVENTORY)('inventory', () => {
  it('writes docs/CONTENT_INVENTORY.md', () => {
    const count = <T>(xs: T[], key: (x: T) => string) =>
      xs.reduce<Record<string, number>>((a, x) => ((a[key(x)] = (a[key(x)] ?? 0) + 1), a), {})
    const L: string[] = []
    L.push(
      '# Content inventory',
      '',
      `Generated from the content bank. Guideline: ${ACTIVE_GUIDELINE.title}, revised ${ACTIVE_GUIDELINE.revised}, for tests from ${ACTIVE_GUIDELINE.validFrom}.`,
      '',
    )
    L.push('## Totals', '', '| Item | Count | Target |', '|---|---|---|')
    L.push(
      `| Lessons | ${LESSONS.length} | ≥ 15 |`,
      `| Questions | ${QUESTIONS.length} | ≥ 300 |`,
      `| Retrieval cards | ${CARDS.length} | ≥ 60 |`,
      `| Atlas entries | ${ATLAS.length} | — |`,
      `| Focused simulations working | ${SIMULATIONS.filter((s) => s.status === 'ready').length} of ${SIMULATIONS.length} | 4 required |`,
      '',
    )
    L.push(
      `| Sequential pathway chapters | ${PATHWAY.length} | — |`,
      `| Connected workbench cases | ${CASES.length}, each with ${STATIONS.length} stations | — |`,
      `| Stain comparisons | ${STAIN_COMPARISONS.length} | — |`,
      `| Artifact investigations | ${ARTIFACTS.length} | — |`,
      '',
    )
    L.push(
      '## HistoQuest Lab catalogs',
      '',
      '| Catalog | Count | Scope |',
      '|---|---|---|',
      `| Specimen archetypes | ${ARCHETYPES.length} | Authored synthetic specimen geometries |`,
      `| Marker references | ${MARKERS.length} | Technical localization and controls; qualified review pending |`,
      `| Conceptual special-stain graphs | ${PROTOCOLS.length} | ${Object.values(SPECIAL_CONTROL_SPECS).filter((s) => s.target !== null).length} target-bearing synthetic comparators; remaining graphs teach sequence only. Not clinical SOPs |`,
      `| Career levels / competencies | ${CAREER_LEVELS.length} / ${COMPETENCIES.length} | Practice milestones, not workplace competency |`,
      `| Troubleshooting cases | ${CLINIC_CASES.length} | Model-based one-variable investigations |`,
      `| Real micrographs | ${ADDITIONAL_MICROGRAPHS.length + 2} | Individually attributed; separate from simulations |`,
      `| Registered model parameters | ${MODEL_PARAMETERS.length} | Units, provenance and calibration status |`,
      '',
    )
    const statuses = count([...QUESTIONS, ...CARDS, ...LESSONS, ...ATLAS], (x) => x.review.status)
    L.push(
      '## Review status',
      '',
      'Every item is `author-checked`: written to match standard teaching, with textbook sources not page-verified. **Nothing is expert-reviewed.**',
      '',
      ...Object.entries(statuses).map(([k, v]) => `- ${k}: ${v}`),
      '',
    )
    L.push(
      '## Questions by content area',
      '',
      '| Area | Exam weight | Questions | Share of bank | Recall | Application | Case | Calculation | With schematic image |',
      '|---|---|---|---|---|---|---|---|---|',
    )
    for (const d of ACTIVE_GUIDELINE.domains) {
      const qs = QUESTIONS.filter((q) => q.domain === d.id)
      const k = count(qs, (q) => q.kind)
      L.push(
        `| ${d.name} | ${d.min}–${d.max}% | ${qs.length} | ${Math.round((100 * qs.length) / QUESTIONS.length)}% | ${k.recall ?? 0} | ${k.application ?? 0} | ${k.case ?? 0} | ${k.calculation ?? 0} | ${qs.filter((q) => q.image).length} |`,
      )
    }
    L.push(
      '',
      '## Objective coverage',
      '',
      '| Objective | Title | Guideline codes | Questions | Cards | Lessons |',
      '|---|---|---|---|---|---|',
    )
    for (const o of OBJECTIVES) {
      L.push(
        `| ${o.id}${o.htlOnly ? ' (HTL only)' : ''} | ${o.title} | ${o.codes.join(', ')} | ${QUESTIONS.filter((q) => q.objective === o.id).length} | ${CARDS.filter((c) => c.objective === o.id).length} | ${
          LESSONS.filter((l) => l.objectives.includes(o.id))
            .map((l) => l.id)
            .join(', ') || '—'
        } |`,
      )
    }
    L.push(
      '',
      '## Lessons',
      '',
      '| Id | Title | Objectives | Demo | Simulation | Retrieval questions |',
      '|---|---|---|---|---|---|',
    )
    for (const l of LESSONS)
      L.push(
        `| ${l.id} | ${l.title} | ${l.objectives.join(', ')} | ${l.demo.key} | ${l.simulation ?? '—'} | ${l.retrieval.join(', ')} |`,
      )
    L.push(
      '',
      '## Atlas by type',
      '',
      ...Object.entries(count(ATLAS, (a) => a.kind)).map(([k, v]) => `- ${k}: ${v}`),
      '',
    )
    L.push(
      '## Sources',
      '',
      '| Source | Access for this build |',
      '|---|---|',
      ...SOURCES.map(
        (s) =>
          `| ${s.title} | ${s.access === 'read' ? 'Read' : 'Not accessed (general reference only)'} |`,
      ),
      '',
    )
    const refUse = count(
      [...QUESTIONS, ...CARDS, ...LESSONS, ...ATLAS].flatMap((x) => x.references),
      (r) => r.sourceId,
    )
    L.push(
      '## Citation counts',
      '',
      ...Object.entries(refUse)
        .sort((a, b) => b[1] - a[1])
        .map(([k, v]) => `- ${k}: ${v}`),
      '',
    )
    writeFileSync('docs/CONTENT_INVENTORY.md', L.join('\n'))
  })
})
