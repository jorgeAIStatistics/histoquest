/** Real source images. These files are not paired with any simulated section. */
export interface TeachingMicrograph {
  id: string
  title: string
  stain: string
  file: string
  width: number
  height: number
  source: string
  originalUrl: string
  author: string
  license: string
  licenseUrl: string
  verifiedOn: string
  sha256: string
  caption: string
  prompts: string[]
  observations: string[]
  alt: string
  changes: 'Original pixels retained; display scaling only.'
  pairedWithSimulation: false
}
const unchanged = {
  verifiedOn: '2026-11-06',
  changes: 'Original pixels retained; display scaling only.',
  pairedWithSimulation: false,
} as const
export const ADDITIONAL_MICROGRAPHS: TeachingMicrograph[] = [
  {
    ...unchanged,
    id: 'colon-normal',
    title: 'Crypt orientation in colonic mucosa',
    stain: 'Source-described normal colonic mucosa',
    file: 'colon-normal.jpg',
    width: 1503,
    height: 654,
    source: 'https://commons.wikimedia.org/wiki/File:Normal_colonic_mucosa.jpg',
    originalUrl: 'https://upload.wikimedia.org/wikipedia/commons/b/be/Normal_colonic_mucosa.jpg',
    author: 'Ed Uthman, MD',
    license: 'CC BY-SA 2.0',
    licenseUrl: 'https://creativecommons.org/licenses/by-sa/2.0/',
    sha256: '4f4263bebb3854971aa05c5c515715c6e2977d4224f0a358f4a69e98e1b0b875',
    caption:
      'Source-described normal colonic mucosa. The visible field supports observing the mucosal surface, crypt profiles and pale goblet-cell contents. The source does not supply a calibrated scale or specify the stain in its caption; no stain identity is inferred solely from the displayed colors.',
    prompts: [
      'Trace the mucosal surface across the upper field.',
      'Compare long crypt profiles with the small round profile toward the lower left.',
      'Explain how the cutting plane changes the apparent shape of a tubular gland.',
    ],
    observations: [
      'The upper tissue boundary and repeated elongated gland profiles are visible together.',
      'A tubular structure can appear elongated or rounded depending on the section plane.',
      'This single field cannot establish orientation of an entire biopsy or the adequacy of every level.',
    ],
    alt: 'Colonic mucosa with a surface along the top, elongated purple-pink crypt profiles, pale goblet-cell contents and a small rounded gland profile at lower left.',
  },
  {
    ...unchanged,
    id: 'kidney-pas',
    title: 'Basement-membrane contrast with PAS',
    stain: 'PAS',
    file: 'kidney-pas.jpg',
    width: 1546,
    height: 1201,
    source: 'https://commons.wikimedia.org/wiki/File:Renal_corpuscle.jpg',
    originalUrl: 'https://upload.wikimedia.org/wikipedia/commons/5/54/Renal_corpuscle.jpg',
    author: 'Ed Uthman, MD',
    license: 'CC BY-SA 2.0',
    licenseUrl: 'https://creativecommons.org/licenses/by-sa/2.0/',
    sha256: 'f658e230325b8be2eec59d65b10c0de3aabaad4c7db63ab30b5bdb9879e55838',
    caption:
      'Renal corpuscle stained with PAS, as identified by the source. Magenta outlines provide a real-image reference for the renal supporting structures emphasized by this method. This is not a calibrated measurement or a paired image of a simulated kidney.',
    prompts: [
      'Locate the central glomerular tuft and the space surrounding it.',
      'Follow the magenta outlines of nearby tubular profiles.',
      'Explain why a magenta reaction is not automatically glycogen.',
    ],
    observations: [
      'The glomerular tuft occupies the central rounded compartment.',
      'Magenta structures outline the corpuscle and many surrounding tubular profiles.',
      'PAS demonstrates several carbohydrate-containing structures; identifying glycogen requires the appropriate digestion comparison and context.',
    ],
    alt: 'PAS-stained renal corpuscle with magenta glomerular and tubular outlines and purple nuclei surrounding pale luminal spaces.',
  },
  {
    ...unchanged,
    id: 'mouse-skin-trichrome',
    title: 'Tissue compartments with trichrome',
    stain: 'Masson trichrome · mouse',
    file: 'mouse-skin-trichrome.jpg',
    width: 1500,
    height: 984,
    source: 'https://commons.wikimedia.org/wiki/File:SkinTS.jpg',
    originalUrl: 'https://upload.wikimedia.org/wikipedia/commons/f/fd/SkinTS.jpg',
    author: 'Jhsteel',
    license: 'CC BY-SA 4.0',
    licenseUrl: 'https://creativecommons.org/licenses/by-sa/4.0/',
    sha256: 'cdf4c68c968254dd2de5635c260fd7f6ac2841095add25dd9126f5bb637b0a28',
    caption:
      'Mouse skin stained with Masson trichrome, identified by the source. This animal specimen illustrates blue connective-tissue contrast beside red-stained deeper tissue and pale spaces. It is a comparative teaching image, not an example labeled as human skin.',
    prompts: [
      'Find the blue fibrous region beneath the left-hand surface.',
      'Compare that region with the broad red-stained tissue on the right.',
      'Why must species and staining variant remain attached to a reference image?',
    ],
    observations: [
      'Blue fibrous tissue occupies much of the left half around hair-associated profiles.',
      'The blue connective-tissue contrast differs from the broad red-stained deeper region.',
      'Species, preparation and stain variants affect appearance; color resemblance alone cannot validate a model or method.',
    ],
    alt: 'Mouse skin stained with Masson trichrome, showing a surface on the left, blue fibrous tissue, pale rounded spaces centrally and broad red tissue to the right.',
  },
  {
    ...unchanged,
    id: 'liver-pasd',
    title: 'Retained target after PAS-diastase',
    stain: 'PAS-D',
    file: 'liver-pasd.jpg',
    width: 2048,
    height: 1536,
    source: 'https://commons.wikimedia.org/wiki/File:Histoplasma_pas-d.jpg',
    originalUrl: 'https://upload.wikimedia.org/wikipedia/commons/3/36/Histoplasma_pas-d.jpg',
    author: 'Nephron',
    license: 'CC BY-SA 3.0',
    licenseUrl: 'https://creativecommons.org/licenses/by-sa/3.0/',
    sha256: 'bf6a101e3136335e50aee4ff05166e530b7da307e01e6d159d33db7efc25578c',
    caption:
      'The source identifies this as a liver biopsy with histoplasmosis stained by PAS-D. Small red-magenta profiles remain visible after the stated digestion method. The supplied diagnosis is source context; this exercise focuses on target contrast and does not teach independent organism identification.',
    prompts: [
      'Find groups of small red-magenta round profiles among the larger cells.',
      'Compare target color with the dark nuclear counterstain.',
      'What additional image would be needed to demonstrate digestion-sensitive glycogen loss?',
    ],
    observations: [
      'Small red-magenta profiles can be distinguished from larger dark nuclei in parts of the field.',
      'A target can remain PAS-reactive after diastase; PAS-D is not expected to erase every magenta structure.',
      'A matched undigested PAS section and appropriate controls would be needed to assess digestion-dependent loss; this image alone supplies neither.',
    ],
    alt: 'PAS-D-stained liver field with dark nuclei, pink background tissue and groups of small red-magenta round profiles identified by the source as Histoplasma.',
  },
]
