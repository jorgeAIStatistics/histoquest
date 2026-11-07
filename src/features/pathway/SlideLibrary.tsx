import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { ARTIFACTS } from '../../content/pathway'
import { Schematic } from '../../art/schematics'

const MICROGRAPHS = [
  { id: 'he', title: 'Skin architecture in H&E', file: 'skin-he.jpg', width: 2048, height: 1532, source: 'https://commons.wikimedia.org/wiki/File:Histopathology_of_actinic_keratosis.jpg', caption: 'H&E micrograph showing normal skin on the left and actinic keratosis on the right, as described by the source. Used here to study stain contrast and tissue architecture, not to train an independent diagnosis.', prompts: ['Find the superficial keratin layer.', 'Trace the epithelial–connective tissue boundary.', 'Compare purple nuclear detail with the pink collagen beneath.'], observations: ['The superficial pink keratin is visible along the top.', 'The epithelial profile undulates into the underlying connective tissue.', 'Pink collagen and darker cellular nuclei provide complementary contrast.'], alt: 'Skin H&E showing superficial keratin, purple epithelial nuclei and pink underlying connective tissue, with actinic keratosis in the right-hand portion.' },
  { id: 'sox10', title: 'Nuclear localization with SOX10', file: 'skin-sox10.jpg', width: 1092, height: 356, source: 'https://commons.wikimedia.org/wiki/File:SOX10_immunohistochemistry_of_normal_skin_(edited).jpg', caption: 'SOX10 immunohistochemistry of normal skin. This is a different specimen and field from the H&E image; it is not a registered before/after pair. Dark nuclear signal contrasts with the lighter counterstained tissue.', prompts: ['Find dark nuclear signal near the basal epidermis.', 'Compare the signal with the lighter background nuclei.', 'Explain why this image alone cannot validate an entire IHC run.'], observations: ['Dark signal appears in selected nuclei near the epidermal base.', 'The counterstain preserves tissue context without making every nucleus equally dark.', 'The image does not provide the run controls or full preanalytic history needed to judge analytical validity.'], alt: 'SOX10 immunohistochemistry of normal skin with selected dark nuclear staining near the basal epidermis against lightly counterstained tissue.' },
] as const

export default function SlideLibrary() {
  const [selected, setSelected] = useState(0)
  const [zoom, setZoom] = useState(1)
  const [reveal, setReveal] = useState(false)
  const [artifact, setArtifact] = useState(0)
  const [artifactAnswer, setArtifactAnswer] = useState('')
  const [failedImage, setFailedImage] = useState(false)
  const viewer = useRef<HTMLDivElement>(null)
  const [fitWidth, setFitWidth] = useState(0)
  const m = MICROGRAPHS[selected]
  const a = ARTIFACTS[artifact]
  useEffect(() => {
    const element = viewer.current
    if (!element) return
    const fit = () => setFitWidth(Math.min(element.clientWidth, element.clientHeight * m.width / m.height))
    fit()
    const observer = new ResizeObserver(fit)
    observer.observe(element)
    element.scrollTo(0, 0)
    return () => observer.disconnect()
  }, [m])
  useEffect(() => { if (zoom === 1) viewer.current?.scrollTo(0, 0) }, [zoom])
  return <div className="page slide-library"><div className="studio-top"><Link to="/atlas">Reference atlas</Link><Link to="/pathway/tissue-language">Tissue foundations</Link></div><h1>Look closely. Then explain what you see.</h1><p className="lede">Explore real micrographs, then practice recognizing preparation artifacts with labeled teaching diagrams.</p>
    <div className="row slide-selector">{MICROGRAPHS.map((s, i) => <button key={s.id} className="chip-btn" aria-pressed={i === selected} onClick={() => { setSelected(i); setZoom(1); setReveal(false); setFailedImage(false) }}>{s.title}</button>)}</div>
    <div className="slide-viewer-layout"><figure className="micrograph-figure"><div className="micrograph-toolbar"><span>Real micrograph · {m.id === 'he' ? 'H&E' : 'IHC'}</span><label htmlFor="slide-zoom">Digital zoom <output htmlFor="slide-zoom">{zoom.toFixed(2)}×</output></label><input id="slide-zoom" type="range" min="1" max="3" step="0.25" value={zoom} onChange={e => setZoom(Number(e.target.value))} /><button className="btn btn-quiet" onClick={() => setZoom(1)}>Fit image</button></div><div ref={viewer} className="micrograph-window" tabIndex={0} role="region" aria-label="Scrollable micrograph. Use arrow keys to pan when zoomed.">{failedImage ? <p>The image could not load. <a href={m.source} target="_blank" rel="noreferrer">Open the source image</a>.</p> : <img key={m.file} src={`${import.meta.env.BASE_URL}micrographs/${m.file}`} alt={m.alt} width={m.width} height={m.height} style={{ width: fitWidth ? `${fitWidth * zoom}px` : '100%' }} onError={() => setFailedImage(true)} />}</div><figcaption><p>{m.caption}</p><p>Image: Mikael Häggström, M.D. · <a href="https://creativecommons.org/publicdomain/zero/1.0/" target="_blank" rel="noreferrer">CC0 1.0</a> · <a href={m.source} target="_blank" rel="noreferrer">Source and original file</a>. Original image pixels retained. No calibrated scale is supplied; digital zoom is not optical magnification.</p></figcaption></figure><aside className="slide-observation"><h2>Observe before revealing</h2><ol>{m.prompts.map(p => <li key={p}>{p}</li>)}</ol><button className="btn btn-primary" onClick={() => setReveal(!reveal)} aria-expanded={reveal}>{reveal ? 'Hide observations' : 'Reveal guided observations'}</button>{reveal && <div className="observation-answer" role="status">{m.observations.map(o => <p key={o}>{o}</p>)}</div>}<p className="small muted">These still images support guided observation. Whole-slide navigation and supervised microscopy provide broader context.</p><a href="https://www.histologyguide.com/slidebox/slidebox.html" target="_blank" rel="noreferrer">Explore the external Histology Guide slide collection</a></aside></div>
    <section className="artifact-laboratory"><div className="page-head"><div><h2>Read the artifact. Investigate the cause.</h2><p>One visual pattern can have several causes. These examples are schematics.</p></div><Link to="/lab/microtomy-challenge">Open the microtomy challenge</Link></div><div className="row">{ARTIFACTS.map((_, i) => <button className="chip-btn" aria-pressed={i === artifact} key={i} onClick={() => { setArtifact(i); setArtifactAnswer('') }}>Example {i + 1}</button>)}</div><div className="artifact-exercise"><div><Schematic name={a.figure} /><p>{a.pattern}</p></div><div><fieldset className="bench-options"><legend>Which pattern fits this schematic?</legend>{ARTIFACTS.map(o => <label className="bench-choice" key={o.name}><input type="radio" name="artifact" checked={artifactAnswer === o.name} onChange={() => setArtifactAnswer(o.name)} /><span>{o.name}</span></label>)}</fieldset>{artifactAnswer && <div className={`feedback ${artifactAnswer === a.name ? 'ok' : 'no'}`} role="status"><strong>{artifactAnswer === a.name ? 'Pattern recognized.' : `This example represents ${a.name.toLowerCase()}.`}</strong><p><strong>Possible contributors:</strong> {a.causes}.</p><p><strong>Next investigation:</strong> {a.check}</p></div>}</div></div></section>
  </div>
}
