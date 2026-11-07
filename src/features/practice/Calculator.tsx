import { useState } from 'react'

/** Minimal arithmetic calculator: + − × ÷ and parentheses. Parsed by a tiny recursive-descent parser, never eval(). */
function evaluate(expr: string): number | undefined {
  const s = expr.replace(/×/g, '*').replace(/÷/g, '/').replace(/\s+/g, '')
  let i = 0
  const num = (): number | undefined => {
    if (s[i] === '(') {
      i++
      const v = add()
      if (s[i] !== ')') return undefined
      i++
      return v
    }
    if (s[i] === '-') {
      i++
      const v = num()
      return v === undefined ? undefined : -v
    }
    const m = s.slice(i).match(/^\d*\.?\d+(e-?\d+)?/i)
    if (!m) return undefined
    i += m[0].length
    return Number(m[0])
  }
  const mul = (): number | undefined => {
    let v = num()
    while (v !== undefined && (s[i] === '*' || s[i] === '/')) {
      const op = s[i++]
      const r = num()
      if (r === undefined) return undefined
      v = op === '*' ? v * r : v / r
    }
    return v
  }
  const add = (): number | undefined => {
    let v = mul()
    while (v !== undefined && (s[i] === '+' || s[i] === '-')) {
      const op = s[i++]
      const r = mul()
      if (r === undefined) return undefined
      v = op === '+' ? v + r : v - r
    }
    return v
  }
  const v = add()
  return i === s.length && v !== undefined && Number.isFinite(v) ? v : undefined
}

export default function Calculator() {
  const [open, setOpen] = useState(false)
  const [expr, setExpr] = useState('')
  const result = expr ? evaluate(expr) : undefined
  if (!open)
    return (
      <button className="btn btn-quiet" type="button" onClick={() => setOpen(true)}>
        Calculator
      </button>
    )
  return (
    <div className="inset" style={{ flex: '1 1 100%' }}>
      <div className="field">
        <label htmlFor="calc">Calculator (type an expression, e.g. 70*500/100)</label>
        <input
          id="calc"
          className="input"
          value={expr}
          onChange={(e) => setExpr(e.target.value)}
          autoComplete="off"
        />
      </div>
      <p className="small" style={{ margin: '8px 0 0' }} aria-live="polite">
        {expr
          ? result === undefined
            ? 'Incomplete expression'
            : `= ${Number(result.toPrecision(10))}`
          : 'Units are not tracked here. Write them down as you go.'}
      </p>
      <button className="btn btn-quiet small" type="button" onClick={() => setOpen(false)}>
        Close calculator
      </button>
    </div>
  )
}
