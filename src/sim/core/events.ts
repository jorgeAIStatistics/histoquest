import { z } from 'zod'

export const STATION_IDS = ['accessioning', 'grossing', 'fixation', 'decalcification', 'processing', 'embedding', 'microtomy', 'bath', 'drying', 'he', 'special', 'ihc', 'ish', 'coverslip', 'frozen', 'quality'] as const
export type StationId = typeof STATION_IDS[number]
export const EventSchema = z.object({
  sequence: z.number().int().nonnegative(),
  t: z.number().finite().nonnegative(),
  station: z.enum(STATION_IDS),
  intent: z.string().min(1).max(80),
  params: z.record(z.string().max(80), z.union([z.number().finite(), z.string().max(2000), z.boolean(), z.null()])),
})
export type SimEvent = z.infer<typeof EventSchema>
export const MAX_RUN_EVENTS = 2000
export const EventLogSchema = z.array(EventSchema).max(MAX_RUN_EVENTS).superRefine((events, ctx) => {
  events.forEach((event, index) => {
    if (event.sequence !== index || (index > 0 && event.t < events[index - 1].t))
      ctx.addIssue({ code: 'custom', message: 'Events must be ordered with monotonic simulation time', path: [index] })
  })
})
/** Appending never mutates the prior log; a pause adds no simulation time. */
export function appendEvent(log: readonly SimEvent[], event: Omit<SimEvent, 'sequence'>): SimEvent[] {
  return EventLogSchema.parse([...log, { ...event, sequence: log.length }])
}
