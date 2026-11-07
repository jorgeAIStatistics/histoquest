import { describe, expect, it } from 'vitest'
import { OBJECTIVE_BY_ID } from '../curriculum'
import { SOURCES } from '../sources'
import { ARCHETYPE_PARAMETERS } from '../../sim/params/archetypes'
import { PROTOCOL_PARAMETERS } from '../../sim/params/protocols'
import { ARCHETYPES } from './archetypes'
import { CAREER_LEVELS, COMPETENCIES } from './curriculum'
import { MARKERS } from './markers'
import { PROTOCOLS } from './protocols'
import {
  ArchetypeSchema,
  CareerLevelSchema,
  CompetencySchema,
  MarkerSchema,
  ProtocolSchema,
} from './schemas'
import { LAB_SOURCES } from './sources'

/** Software and provenance consistency only: these checks do not establish biological validity. */
describe('laboratory teaching catalogs', () => {
  it('parses all records and preserves honest review status', () => {
    for (const [schema, rows] of [
      [ArchetypeSchema, ARCHETYPES],
      [MarkerSchema, MARKERS],
      [ProtocolSchema, PROTOCOLS],
      [CompetencySchema, COMPETENCIES],
      [CareerLevelSchema, CAREER_LEVELS],
    ] as const) {
      for (const row of rows) {
        expect(schema.safeParse(row).success, row.id).toBe(true)
        expect(row.review.status).toBe('author-checked')
        expect(row.review.needsQualifiedReview).toBe(true)
      }
      expect(new Set(rows.map((row) => row.id)).size).toBe(rows.length)
    }
  })
  it('meets initial catalog sizes and includes every requested marker concept', () => {
    expect(ARCHETYPES.length).toBeGreaterThanOrEqual(15)
    expect(MARKERS.length).toBeGreaterThanOrEqual(60)
    expect(PROTOCOLS.length).toBeGreaterThanOrEqual(12)
    const required = [
      'pan-ck',
      'ck7',
      'ck20',
      'ck5-6',
      'hmwck',
      'ema',
      'vimentin',
      'desmin',
      'sma',
      's100',
      'sox10',
      'melan-a',
      'hmb45',
      'cd45',
      'cd3',
      'cd20',
      'cd79a',
      'cd10',
      'cd30',
      'cd34',
      'cd31',
      'erg',
      'ki67',
      'p53',
      'p63',
      'p40',
      'ttf1',
      'cdx2',
      'gata3',
      'er',
      'pr',
      'her2',
      'ar',
      'synaptophysin',
      'chromogranin',
      'insm1',
      'wt1',
      'pax8',
      'calretinin',
      'd2-40',
      'mlh1',
      'pms2',
      'msh2',
      'msh6',
      'pd-l1',
      'alk',
      'beta-catenin',
      'e-cadherin',
      'cd117',
      'dog1',
      'gfap',
      'neun',
      'kappa-ish',
      'lambda-ish',
      'eber-ish',
      'hpv-rna-ish',
      'p16',
    ]
    for (const id of required)
      expect(
        MARKERS.some((marker) => marker.id === id),
        id,
      ).toBe(true)
  })
  it('resolves catalog sources and scopes actual source access', () => {
    const sources = new Map([...SOURCES, ...LAB_SOURCES].map((source) => [source.id, source]))
    expect(new Set(LAB_SOURCES.map((source) => source.id)).size).toBe(LAB_SOURCES.length)
    for (const row of [
      ...ARCHETYPES,
      ...MARKERS,
      ...PROTOCOLS,
      ...COMPETENCIES,
      ...CAREER_LEVELS,
    ]) {
      for (const id of row.sourceIds) expect(sources.has(id), `${row.id}: ${id}`).toBe(true)
    }
    for (const source of LAB_SOURCES) {
      expect(source.accessedOn).toMatch(/^\d{4}-\d{2}-\d{2}$/)
      expect(source.readScope.length).toBeGreaterThan(20)
      expect(source.limitations.length).toBeGreaterThan(20)
      expect(new URL(source.url!).protocol).toBe('https:')
    }
  })
  it('keeps reaction graphs acyclic, connected and backed by explicit parameters', () => {
    const params = new Map(PROTOCOL_PARAMETERS.map((parameter) => [parameter.id, parameter]))
    expect(params.size).toBe(PROTOCOL_PARAMETERS.length)
    for (const protocol of PROTOCOLS) {
      const steps = new Map(protocol.steps.map((step) => [step.id, step]))
      expect(steps.size).toBe(protocol.steps.length)
      const visited = new Set<string>()
      const active = new Set<string>()
      const visit = (id: string) => {
        expect(active.has(id), `${protocol.id}: cycle at ${id}`).toBe(false)
        if (visited.has(id)) return
        const step = steps.get(id)
        expect(step, `${protocol.id}: missing ${id}`).toBeDefined()
        active.add(id)
        for (const dependency of step!.dependencies) visit(dependency)
        active.delete(id)
        visited.add(id)
      }
      for (const step of protocol.steps) {
        visit(step.id)
        expect(params.has(step.durationParam), `${protocol.id}: ${step.durationParam}`).toBe(true)
      }
      const ancestors = new Set<string>()
      const collect = (id: string) => {
        if (ancestors.has(id)) return
        ancestors.add(id)
        for (const dependency of steps.get(id)!.dependencies) collect(dependency)
      }
      collect(protocol.steps.at(-1)!.id)
      expect(ancestors.size, `${protocol.id}: orphan reaction`).toBe(protocol.steps.length)
      expect(protocol.steps.at(-1)!.action).toBe('mount')
    }
  })
  it('keeps the lipid-preserving path out of a routine extracting finish', () => {
    const oil = PROTOCOLS.find((protocol) => protocol.id === 'oil-red-o')!
    expect(oil.pathway).toBe('frozen')
    expect(oil.mounting).toBe('aqueous')
    expect(oil.steps.some((step) => ['dewax', 'dehydrate', 'clear'].includes(step.action))).toBe(
      false,
    )
  })
  it('resolves specimen geometry and labels all teaching parameters illustrative', () => {
    const params = new Map(ARCHETYPE_PARAMETERS.map((parameter) => [parameter.id, parameter]))
    for (const specimen of ARCHETYPES) {
      for (const id of specimen.dimensionsParam) expect(params.has(id), id).toBe(true)
    }
    for (const parameter of [...ARCHETYPE_PARAMETERS, ...PROTOCOL_PARAMETERS]) {
      expect(parameter.illustrative).toBe(true)
      expect(parameter.accessStatus).toBe('illustrative')
      expect(typeof parameter.value).toBe('number')
      expect(Number.isFinite(parameter.value)).toBe(true)
      expect(parameter.value).toBeGreaterThan(0)
      expect(parameter.sourceIds).toEqual(['hq-original'])
    }
  })
  it('links all seven learning milestones to practical evidence and existing objectives', () => {
    expect(CAREER_LEVELS.map((level) => level.id)).toEqual([
      'L0',
      'L1',
      'L2',
      'L3',
      'L4',
      'L5',
      'L6',
    ])
    for (const level of CAREER_LEVELS) {
      expect(level.boundary).toContain('not job titles')
      for (const id of level.competencies) {
        expect(COMPETENCIES.find((competency) => competency.id === id)?.level).toBe(level.id)
      }
    }
    for (const competency of COMPETENCIES) {
      for (const id of competency.objectiveIds)
        expect(OBJECTIVE_BY_ID[id], `${competency.id}: ${id}`).toBeDefined()
    }
  })
})
