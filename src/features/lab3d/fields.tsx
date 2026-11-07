import { useId, type FormEvent, type ReactNode } from 'react'
import { UPSTREAM_PARAMETERS } from '../../sim/params/upstream'
import { PROCESS_PARAMETERS } from '../../sim/params/process'
import { CORE_PARAMETERS } from '../../sim/params/registry'
import type { SimEvent, StationId } from '../../sim/core/events'
import type { Twin } from '../../sim/specimen/types'
export type Intent = (intent: string, params?: SimEvent['params'], station?: StationId) => void
export interface ControlsProps {
  twin: Twin
  act: Intent
}
const parameters = [...PROCESS_PARAMETERS, ...CORE_PARAMETERS, ...UPSTREAM_PARAMETERS]
export function N({
  name,
  label,
  value,
  parameter,
  unit,
}: {
  name: string
  label: string
  value?: number
  parameter?: string
  unit?: string
}) {
  const id = useId()
  const p = parameters.find((p) => p.id === parameter)
  return (
    <label className="lab-field" htmlFor={id}>
      <span>
        {label} <small>{unit ?? p?.unit}</small>
      </span>
      <input
        className="input"
        id={id}
        name={name}
        type="number"
        step="any"
        required
        defaultValue={value ?? (typeof p?.value === 'number' ? p.value : '')}
      />
      {p && (
        <details className="number-source">
          <summary>Setting provenance</summary>
          <p>{p.note}</p>
          <small>
            {p.id} · {p.accessStatus}
          </small>
        </details>
      )}
    </label>
  )
}
export function S({
  name,
  label,
  value,
  options,
}: {
  name: string
  label: string
  value?: string
  options: (string | [string, string])[]
}) {
  const id = useId()
  return (
    <label className="lab-field" htmlFor={id}>
      <span>{label}</span>
      <select className="input" id={id} name={name} defaultValue={value}>
        {options.map((o) => {
          const [v, l] = typeof o === 'string' ? [o, o] : o
          return (
            <option key={v} value={v}>
              {l}
            </option>
          )
        })}
      </select>
    </label>
  )
}
export function Check({
  name,
  label,
  checked = false,
}: {
  name: string
  label: string
  checked?: boolean
}) {
  return (
    <label className="lab-check">
      <input type="checkbox" name={name} defaultChecked={checked} /> {label}
    </label>
  )
}
export function T({
  name,
  label,
  value = '',
  multiline = false,
}: {
  name: string
  label: string
  value?: string
  multiline?: boolean
}) {
  const id = useId()
  return (
    <label className="lab-field" htmlFor={id}>
      <span>{label}</span>
      {multiline ? (
        <textarea
          className="input"
          id={id}
          name={name}
          defaultValue={value}
          required
          rows={3}
          maxLength={1900}
        />
      ) : (
        <input
          className="input"
          id={id}
          name={name}
          defaultValue={value}
          required
          maxLength={200}
        />
      )}
    </label>
  )
}
function values(form: HTMLFormElement): SimEvent['params'] {
  const result: SimEvent['params'] = {}
  for (const element of Array.from(form.elements)) {
    if (element instanceof HTMLInputElement && element.name)
      result[element.name] =
        element.type === 'checkbox'
          ? element.checked
          : element.type === 'number'
            ? Number(element.value)
            : element.value
    if (
      (element instanceof HTMLSelectElement || element instanceof HTMLTextAreaElement) &&
      element.name
    )
      result[element.name] = element.value
  }
  return result
}
export function ActionForm({
  title,
  submit,
  children,
  onAction,
}: {
  title: string
  submit: string
  children: ReactNode
  onAction: (params: SimEvent['params']) => void
}) {
  return (
    <form
      className="lab-action-form"
      onSubmit={(e: FormEvent<HTMLFormElement>) => {
        e.preventDefault()
        onAction(values(e.currentTarget))
      }}
    >
      <fieldset>
        <legend>{title}</legend>
        <div className="lab-form-grid">{children}</div>
        <button className="btn btn-primary" type="submit">
          {submit}
        </button>
      </fieldset>
    </form>
  )
}
