// @vitest-environment jsdom
import { afterEach, beforeEach, expect, it, vi } from 'vitest'
import { BACKUP_KEY, STORAGE_KEY, initialState } from './state'
import { getState, resetForTests, setState, storageError } from './store'
beforeEach(() => {
  localStorage.clear()
  resetForTests()
})
afterEach(() => vi.restoreAllMocks())
it('writes compact current progress even if duplicating the prior backup hits quota', () => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(initialState()))
  const nativeSet = Storage.prototype.setItem
  vi.spyOn(Storage.prototype, 'setItem').mockImplementation(function (
    this: Storage,
    key: string,
    value: string,
  ) {
    if (key === BACKUP_KEY) throw new DOMException('Full backup quota', 'QuotaExceededError')
    nativeSet.call(this, key, value)
  })
  setState((s) => ({
    ...s,
    pathway: { ...s.pathway, notes: { fixation: 'A compact current note' } },
  }))
  expect(JSON.parse(localStorage.getItem(STORAGE_KEY)!).pathway.notes.fixation).toBe(
    'A compact current note',
  )
  expect(storageError()).toContain('Current progress was saved')
})
it('retains the previous primary snapshot and reports failed writes; clears the save warning after recovery', () => {
  const previous = JSON.stringify(initialState())
  localStorage.setItem(STORAGE_KEY, previous)
  const nativeSet = Storage.prototype.setItem
  const spy = vi.spyOn(Storage.prototype, 'setItem').mockImplementation(function (
    this: Storage,
    key: string,
    value: string,
  ) {
    if (key === STORAGE_KEY) throw new DOMException('Full primary quota', 'QuotaExceededError')
    nativeSet.call(this, key, value)
  })
  setState((s) => ({ ...s, onboarded: true }))
  expect(getState().onboarded).toBe(true)
  expect(localStorage.getItem(STORAGE_KEY)).toBe(previous)
  expect(storageError()).toContain('Progress could not be saved')
  spy.mockRestore()
  setState((s) => s)
  expect(JSON.parse(localStorage.getItem(STORAGE_KEY)!).onboarded).toBe(true)
  expect(storageError()).toBeUndefined()
})
