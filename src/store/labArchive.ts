import { useCallback, useEffect, useMemo, useState } from 'react'
import { LabRecordSchema, type LabRecord } from './labSchema'
import { exportJson, STORAGE_KEY, type AppState } from './state'
import { getState, replaceState, setState, useAppState } from './store'

export const LAB_ARCHIVE_DB = 'histoquest-lab-archive'
export const LAB_ARCHIVE_STORE = 'runs'
export const LOCAL_COMPLETED_RUNS = 20
/** Application cache budget, not an estimate of browser storage quota. */
export const MAX_LOCAL_RUN_BYTES = 1024 * 1024
export const MAX_ARCHIVE_RUNS = 200
export const MAX_ARCHIVE_BYTES = 50 * 1024 * 1024
const CHANGE_EVENT = 'histoquest:archive-changed'
const CHANNEL = 'histoquest-lab-archive'

interface ArchiveEntry {
  id: string
  record: LabRecord
  bytes: number
  updatedAt: string
}
export interface ArchiveStatus {
  count: number
  bytes: number
  localCount: number
  cacheWarning?: string
}
export class ArchiveError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'ArchiveError'
  }
}

const message = (error: unknown) =>
  error instanceof Error ? error.message : 'The browser archive is unavailable.'
const canonical = (record: LabRecord) => JSON.stringify(LabRecordSchema.parse(record))
export const runBytes = (record: LabRecord): number =>
  new TextEncoder().encode(canonical(record)).byteLength
export const localRunBytes = (runs: readonly LabRecord[], draft?: LabRecord): number =>
  new TextEncoder().encode(JSON.stringify({ runs, draft })).byteLength
export function localRunWarning(runs: readonly LabRecord[], draft?: LabRecord): string | undefined {
  return localRunBytes(runs, draft) > MAX_LOCAL_RUN_BYTES
    ? 'Recent laboratory logs exceed the 1 MiB cache budget. Active, incomplete, changed or unarchived records were retained. Export complete progress now; browser storage may not be able to persist all protected history.'
    : undefined
}

/** Archive first, recent local state second, current draft last. No unique run is discarded. */
export function mergeLabRuns(
  archived: readonly LabRecord[],
  local: readonly LabRecord[],
  draft?: LabRecord,
): LabRecord[] {
  const merged = new Map<string, LabRecord>()
  for (const raw of [...archived, ...local, ...(draft ? [draft] : [])]) {
    const record = LabRecordSchema.parse(raw)
    merged.delete(record.id)
    merged.set(record.id, record)
  }
  return [...merged.values()].sort(
    (a, b) =>
      (a.completedAt ?? a.startedAt).localeCompare(b.completedAt ?? b.startedAt) ||
      a.id.localeCompare(b.id),
  )
}

/** Older local records may leave the small cache only after an identical archive commit. */
export function pruneLocalRuns(
  local: readonly LabRecord[],
  archived: readonly LabRecord[],
  keep = LOCAL_COMPLETED_RUNS,
  draft?: LabRecord,
): LabRecord[] {
  const durable = new Map(archived.map((record) => [record.id, canonical(record)]))
  const protectedRuns = local.filter(
    (record) => !record.completedAt || durable.get(record.id) !== canonical(record),
  )
  const retained = new Set(protectedRuns.map((record) => record.id))
  let bytes = localRunBytes(protectedRuns, draft)
  let completedCount = 0
  for (const record of local
    .filter((record) => !retained.has(record.id))
    .toSorted((a, b) => b.completedAt!.localeCompare(a.completedAt!))) {
    if (completedCount >= keep) break
    const added = runBytes(record) + (retained.size ? 1 : 0)
    if (bytes + added > MAX_LOCAL_RUN_BYTES) continue
    retained.add(record.id)
    bytes += added
    completedCount++
  }
  return local.filter((record) => retained.has(record.id))
}

export function archiveCapacity(records: readonly LabRecord[]): {
  count: number
  bytes: number
  fits: boolean
} {
  const unique = mergeLabRuns([], records)
  const bytes = unique.reduce((sum, record) => sum + runBytes(record), 0)
  return {
    count: unique.length,
    bytes,
    fits: unique.length <= MAX_ARCHIVE_RUNS && bytes <= MAX_ARCHIVE_BYTES,
  }
}

let databasePromise: Promise<IDBDatabase> | undefined
function openDatabase(): Promise<IDBDatabase> {
  if (databasePromise) return databasePromise
  databasePromise = new Promise<IDBDatabase>((resolve, reject) => {
    if (typeof indexedDB === 'undefined') {
      reject(
        new ArchiveError(
          'IndexedDB is unavailable. Recent runs remain in local progress; the complete archive cannot be verified.',
        ),
      )
      return
    }
    let settled = false
    const request = indexedDB.open(LAB_ARCHIVE_DB, 1)
    request.onupgradeneeded = () => {
      if (!request.result.objectStoreNames.contains(LAB_ARCHIVE_STORE))
        request.result.createObjectStore(LAB_ARCHIVE_STORE, { keyPath: 'id' })
    }
    request.onerror = () => {
      settled = true
      reject(
        new ArchiveError(
          `The laboratory archive could not be opened: ${request.error?.message ?? 'browser storage error'}`,
        ),
      )
    }
    request.onblocked = () => {
      settled = true
      reject(
        new ArchiveError(
          'Another HistoQuest tab is blocking the archive. Close that tab and retry; no records were pruned.',
        ),
      )
    }
    request.onsuccess = () => {
      if (settled) {
        request.result.close()
        return
      }
      const db = request.result
      db.onversionchange = () => {
        db.close()
        databasePromise = undefined
      }
      resolve(db)
    }
  }).catch((error) => {
    databasePromise = undefined
    throw error
  })
  return databasePromise
}

function decodeEntries(raw: unknown[]): ArchiveEntry[] {
  return raw.map((value) => {
    if (!value || typeof value !== 'object' || !('record' in value))
      throw new ArchiveError(
        'An archived run is unreadable. Nothing was discarded; a complete backup cannot be claimed until the archive can be read.',
      )
    const entry = value as ArchiveEntry
    const parsed = LabRecordSchema.safeParse(entry.record)
    if (!parsed.success || entry.id !== parsed.data.id)
      throw new ArchiveError(
        'An archived run failed validation. Nothing was discarded; a complete backup cannot be claimed until the archive can be read.',
      )
    return {
      id: parsed.data.id,
      record: parsed.data,
      bytes: runBytes(parsed.data),
      updatedAt: typeof entry.updatedAt === 'string' ? entry.updatedAt : '',
    }
  })
}

function transactionError(transaction: IDBTransaction): ArchiveError {
  return new ArchiveError(
    `The archive transaction failed: ${transaction.error?.message ?? 'browser storage error'}. Recent local records were retained.`,
  )
}

async function readEntries(): Promise<ArchiveEntry[]> {
  const db = await openDatabase()
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(LAB_ARCHIVE_STORE, 'readonly')
    const request = transaction.objectStore(LAB_ARCHIVE_STORE).getAll()
    let entries: ArchiveEntry[] = []
    request.onsuccess = () => {
      try {
        entries = decodeEntries(request.result)
      } catch (error) {
        reject(error)
        transaction.abort()
      }
    }
    request.onerror = () => reject(transactionError(transaction))
    transaction.onabort = () => reject(transactionError(transaction))
    transaction.onerror = () => reject(transactionError(transaction))
    transaction.oncomplete = () => resolve(entries)
  })
}

async function writeEntries(records: readonly LabRecord[], replace = false): Promise<LabRecord[]> {
  const incoming = records.map((record) => LabRecordSchema.parse(record))
  const db = await openDatabase()
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(LAB_ARCHIVE_STORE, 'readwrite')
    const store = transaction.objectStore(LAB_ARCHIVE_STORE)
    const request = store.getAll()
    let result: LabRecord[] = []
    request.onsuccess = () => {
      try {
        const existing = replace ? [] : decodeEntries(request.result)
        const current = new Map(existing.map((entry) => [entry.id, entry.record]))
        // A delayed save may not overwrite a longer event history already durable.
        const updates = incoming.map((record) => {
          const previous = current.get(record.id)
          return !replace && previous && previous.events.length > record.events.length
            ? previous
            : record
        })
        result = replace
          ? mergeLabRuns([], updates)
          : mergeLabRuns(
              existing.map((entry) => entry.record),
              updates,
            )
        const capacity = archiveCapacity(result)
        if (!capacity.fits)
          throw new ArchiveError(
            `The archive limit is ${MAX_ARCHIVE_RUNS} runs or ${MAX_ARCHIVE_BYTES / 1024 / 1024} MiB. Nothing was pruned. Export a complete backup and explicitly remove backed-up archive records before adding more.`,
          )
        if (replace) store.clear()
        const updatedAt = new Date().toISOString()
        for (const record of replace ? result : updates)
          store.put({
            id: record.id,
            record,
            bytes: runBytes(record),
            updatedAt,
          } satisfies ArchiveEntry)
      } catch (error) {
        reject(error)
        transaction.abort()
      }
    }
    request.onerror = () => reject(transactionError(transaction))
    transaction.onabort = () => reject(transactionError(transaction))
    transaction.onerror = () => reject(transactionError(transaction))
    transaction.oncomplete = () => resolve(result)
  })
}

function announceChange() {
  if (typeof window !== 'undefined') window.dispatchEvent(new Event(CHANGE_EVENT))
  if (typeof BroadcastChannel !== 'undefined') {
    const channel = new BroadcastChannel(CHANNEL)
    channel.postMessage('changed')
    channel.close()
  }
}

export async function listArchivedRuns(): Promise<LabRecord[]> {
  const entries = await readEntries()
  return entries
    .map((entry) => entry.record)
    .sort(
      (a, b) =>
        (a.completedAt ?? a.startedAt).localeCompare(b.completedAt ?? b.startedAt) ||
        a.id.localeCompare(b.id),
    )
}

export async function listAllLabRuns(state: AppState = getState()): Promise<LabRecord[]> {
  return mergeLabRuns(await listArchivedRuns(), state.lab.runs, state.lab.draft)
}

/** Call after saving the completed record locally. A rejected promise never removes that local copy. */
export async function archiveRun(record: LabRecord): Promise<ArchiveStatus> {
  // Also migrate completed runs from browsers which predate the archive. Incomplete
  // case logs remain local until completed or included in a complete import.
  const archived = await writeEntries(
    mergeLabRuns(
      [],
      getState().lab.runs.filter((run) => !!run.completedAt),
      record,
    ),
  )
  setState((state) => ({
    ...state,
    lab: {
      ...state.lab,
      runs: pruneLocalRuns(state.lab.runs, archived, LOCAL_COMPLETED_RUNS, state.lab.draft),
    },
  }))
  announceChange()
  const capacity = archiveCapacity(archived)
  return {
    count: capacity.count,
    bytes: capacity.bytes,
    localCount: getState().lab.runs.length,
    cacheWarning: localRunWarning(getState().lab.runs, getState().lab.draft),
  }
}

export async function exportCompleteProgress(
  state: AppState = getState(),
): Promise<{ json: string; state: AppState; archiveCount: number; runCount: number }> {
  const archive = await listArchivedRuns()
  const complete: AppState = {
    ...state,
    lab: { ...state.lab, runs: mergeLabRuns(archive, state.lab.runs, state.lab.draft) },
  }
  return {
    json: exportJson(complete),
    state: complete,
    archiveCount: archive.length,
    runCount: complete.lab.runs.length,
  }
}

/** Only invoke after the existing replace-progress confirmation. IDB commits before local state changes. */
export async function importCompleteProgress(state: AppState): Promise<ArchiveStatus> {
  const runs = mergeLabRuns([], state.lab.runs, state.lab.draft)
  const archived = await writeEntries(runs, true)
  const local = pruneLocalRuns(runs, archived, LOCAL_COMPLETED_RUNS, state.lab.draft)
  replaceState({ ...state, lab: { ...state.lab, runs: local } })
  announceChange()
  if (
    typeof localStorage !== 'undefined' &&
    localStorage.getItem(STORAGE_KEY) !== JSON.stringify(getState())
  )
    throw new ArchiveError(
      'Laboratory logs were imported into the archive, but the remaining progress could not be saved to local storage. Keep the import file and free browser storage before reloading. The imported progress is still available in this open tab for export.',
    )
  const capacity = archiveCapacity(archived)
  return {
    count: capacity.count,
    bytes: capacity.bytes,
    localCount: local.length,
    cacheWarning: localRunWarning(local, state.lab.draft),
  }
}

/** User-authorized erasure; transaction abort leaves the archive intact. */
export async function clearLabArchive(): Promise<void> {
  const db = await openDatabase()
  await new Promise<void>((resolve, reject) => {
    const transaction = db.transaction(LAB_ARCHIVE_STORE, 'readwrite')
    transaction.objectStore(LAB_ARCHIVE_STORE).clear()
    transaction.oncomplete = () => resolve()
    transaction.onabort = () => reject(transactionError(transaction))
    transaction.onerror = () => reject(transactionError(transaction))
  })
  announceChange()
}

/** Explicit pruning removes only unchanged archived copies present in the supplied complete export. */
export async function pruneBackedUpArchive(
  backupRuns: readonly LabRecord[],
  keepIds: readonly string[],
): Promise<number> {
  const backedUp = new Map(backupRuns.map((record) => [record.id, canonical(record)]))
  const keep = new Set(keepIds)
  const db = await openDatabase()
  const count = await new Promise<number>((resolve, reject) => {
    const transaction = db.transaction(LAB_ARCHIVE_STORE, 'readwrite')
    const store = transaction.objectStore(LAB_ARCHIVE_STORE)
    const request = store.getAll()
    let deleted = 0
    request.onsuccess = () => {
      try {
        for (const entry of decodeEntries(request.result))
          if (!keep.has(entry.id) && backedUp.get(entry.id) === canonical(entry.record)) {
            store.delete(entry.id)
            deleted++
          }
      } catch (error) {
        reject(error)
        transaction.abort()
      }
    }
    transaction.oncomplete = () => resolve(deleted)
    transaction.onabort = () => reject(transactionError(transaction))
    transaction.onerror = () => reject(transactionError(transaction))
  })
  announceChange()
  return count
}

export function useAllLabRuns() {
  const local = useAppState((state) => state.lab.runs)
  const draft = useAppState((state) => state.lab.draft)
  const [archive, setArchive] = useState<{ runs: LabRecord[]; loading: boolean; error?: string }>({
    runs: [],
    loading: true,
  })
  const refresh = useCallback(async () => {
    try {
      const runs = await listArchivedRuns()
      setArchive({ runs, loading: false })
    } catch (error) {
      setArchive((previous) => ({ ...previous, loading: false, error: message(error) }))
    }
  }, [])
  useEffect(() => {
    let active = true
    const load = () => {
      void listArchivedRuns()
        .then((runs) => {
          if (active) setArchive({ runs, loading: false })
        })
        .catch((error) => {
          if (active)
            setArchive((previous) => ({ ...previous, loading: false, error: message(error) }))
        })
    }
    load()
    window.addEventListener(CHANGE_EVENT, load)
    const channel = typeof BroadcastChannel !== 'undefined' ? new BroadcastChannel(CHANNEL) : null
    if (channel) channel.onmessage = load
    return () => {
      active = false
      window.removeEventListener(CHANGE_EVENT, load)
      channel?.close()
    }
  }, [])
  const runs = useMemo(() => mergeLabRuns(archive.runs, local, draft), [archive.runs, local, draft])
  const archiveBytes = useMemo(
    () => archive.runs.reduce((sum, record) => sum + runBytes(record), 0),
    [archive.runs],
  )
  const cacheWarning = useMemo(() => localRunWarning(local, draft), [local, draft])
  return {
    runs,
    loading: archive.loading,
    error: archive.error,
    archivedCount: archive.runs.length,
    archiveBytes,
    cacheWarning,
    refresh,
  }
}
