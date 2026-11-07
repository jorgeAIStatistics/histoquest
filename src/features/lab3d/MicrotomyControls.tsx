import { ActionForm, Check, N, S, T, type ControlsProps } from './fields'
import type { StationId } from '../../sim/core/events'
export default function MicrotomyControls({
  twin: t,
  act,
  station,
}: ControlsProps & { station: StationId }) {
  if (station === 'bath')
    return (
      <>
        <ActionForm
          title="Float the current section"
          submit="Float section"
          onAction={(p) => act('bath.float', p)}
        >
          <N name="temperature" label="Bath temperature" parameter="bath.temperature" />
          <N name="minutes" label="Flotation time" parameter="bath.minutes" />
          <Check name="clean" label="Bath inspected and cleared of previous tissue" />
          <Check name="gentle" label="Gentle section handling" />
        </ActionForm>
        <ActionForm
          title="Pick up and identify"
          submit="Pick up section"
          onAction={(p) => act('section.pickup', p)}
        >
          <T
            name="label"
            label="Slide label"
            value={`${t.scenario.accession}-A1-L${t.block.sections.at(-1)?.level ?? 1}`}
          />
          <Check name="charged" label="Charged slide selected" />
          <N name="bubbles" label="Entrapped air fraction" value={0} unit="0–1" />
        </ActionForm>
      </>
    )
  if (station === 'drying')
    return (
      <ActionForm
        title="Drying exposure"
        submit="Run drying"
        onAction={(p) => act('drying.run', p)}
      >
        <N name="temperature" label="Temperature" parameter="drying.temperature" />
        <N name="minutes" label="Duration" parameter="drying.minutes" />
      </ActionForm>
    )
  return (
    <>
      <div className="lab-safety-switches" aria-label="Microtome safety state">
        <p>
          <strong>{t.instrument.locked ? 'Handwheel locked' : 'Handwheel unlocked'}</strong> ·{' '}
          {t.instrument.guarded ? 'Blade guarded' : 'Blade exposed'}
        </p>
        <button
          className="btn"
          onClick={() => act('instrument.set', { locked: true, guarded: true }, 'microtomy')}
        >
          Lock and guard
        </button>
        <button
          className="btn"
          onClick={() => act('instrument.set', { locked: false, guarded: false }, 'microtomy')}
        >
          Prepare to cut — hands clear
        </button>
        <button className="btn" onClick={() => act('block.mount', {}, 'microtomy')}>
          Mount / align block
        </button>
      </div>
      <ActionForm
        title="Blade-area adjustments"
        submit="Apply blade settings"
        onAction={(p) => act('instrument.set', p, 'microtomy')}
      >
        <N
          name="angle"
          label="Clearance angle"
          parameter="microtomy.angle"
          value={t.instrument.angle}
        />
        <N name="clamp" label="Clamp tightness" value={t.instrument.clamp} unit="0–1" />
        <N name="sharpness" label="Blade sharpness" value={t.instrument.sharpness} unit="0–1" />
        <N
          name="bladePosition"
          label="Lateral blade segment"
          value={t.instrument.bladePosition}
          unit="segment index"
        />
      </ActionForm>
      <ActionForm
        title="Condition and cut"
        submit="Apply section settings"
        onAction={(p) => act('instrument.set', p, 'microtomy')}
      >
        <N
          name="thickness"
          label="Section thickness"
          parameter="section.thickness"
          value={t.instrument.thickness}
        />
        <N
          name="speed"
          label="Handwheel pace"
          parameter="microtomy.speed"
          value={t.instrument.speed}
        />
        <N
          name="blockTemperature"
          label="Block temperature"
          parameter="microtomy.block-temperature"
          value={t.block.temperature}
        />
        <N name="consistency" label="Cutting consistency" value={t.instrument.consistency} unit="0–1" />
        <N name="hydration" label="Surface hydration" value={t.block.hydration} unit="0–1" />
        <N name="humidity" label="Room humidity" value={t.instrument.humidity} unit="%" />
      </ActionForm>
      <ActionForm
        title="Facing / deeper tissue"
        submit="Advance block face"
        onAction={(p) => act('microtomy.trim', p, 'microtomy')}
      >
        <N name="microns" label="Tissue consumed" parameter="microtomy.trim" />
      </ActionForm>
      <ActionForm
        title="Section order"
        submit="Turn handwheel — take section"
        onAction={(p) => act('microtomy.cut', p, 'microtomy')}
      >
        <S
          name="purpose"
          label="Purpose"
          options={['routine', 'level', 'deeper', 'recut', 'unstained IHC', 'molecular']}
        />
        <N
          name="level"
          label="Level number"
          value={(t.block.sections.at(-1)?.level ?? 0) + 1}
          unit="level"
        />
      </ActionForm>
      <details>
        <summary>Section register · {t.block.sections.length} sections</summary>
        <table className="lab-table">
          <thead>
            <tr>
              <th>Slide / section</th>
              <th>Depth</th>
              <th>Thickness</th>
              <th>Purpose</th>
            </tr>
          </thead>
          <tbody>
            {t.block.sections.map((s) => (
              <tr key={s.id}>
                <td>{s.slideId || s.id}</td>
                <td>{s.depth.toFixed(1)} µm</td>
                <td>{s.thickness} µm</td>
                <td>
                  {s.purpose}, L{s.level}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </details>
    </>
  )
}
