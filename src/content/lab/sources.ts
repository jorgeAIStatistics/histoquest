import type { Source } from '../sources'

export interface LabSource extends Source {
  accessedOn: string
  readScope: string
  limitations: string
}

/** Access scope is explicit: a source read is not the same as expert review or assay validation. */
export const LAB_SOURCES: LabSource[] = [
  {
    id: 'nordiqc-6',
    title: 'NordiQC epitope guidance: ASMA',
    publisher: 'NordiQC',
    url: 'https://www.nordiqc.org/epitope.php?id=6',
    access: 'read',
    onAscpReadingList: false,
    accessedOn: '2026-11-06',
    readScope:
      'Marker characteristics and control-tissue paragraphs read from the public page; linked current assessment reports were not individually reviewed.',
    limitations:
      'Some epitope essays are historical. Control recommendations vary by antibody, assay, preparation and intended use; clinical cutoffs and treatment recommendations are not imported.',
  },
  {
    id: 'nordiqc-42',
    title: 'NordiQC epitope guidance: DES',
    publisher: 'NordiQC',
    url: 'https://www.nordiqc.org/epitope.php?id=42',
    access: 'read',
    onAscpReadingList: false,
    accessedOn: '2026-11-06',
    readScope:
      'Marker characteristics and control-tissue paragraphs read from the public page; linked current assessment reports were not individually reviewed.',
    limitations:
      'Some epitope essays are historical. Control recommendations vary by antibody, assay, preparation and intended use; clinical cutoffs and treatment recommendations are not imported.',
  },
  {
    id: 'nordiqc-76',
    title: 'NordiQC epitope guidance: VIM',
    publisher: 'NordiQC',
    url: 'https://www.nordiqc.org/epitope.php?id=76',
    access: 'read',
    onAscpReadingList: false,
    accessedOn: '2026-11-06',
    readScope:
      'Marker characteristics and control-tissue paragraphs read from the public page; linked current assessment reports were not individually reviewed.',
    limitations:
      'Some epitope essays are historical. Control recommendations vary by antibody, assay, preparation and intended use; clinical cutoffs and treatment recommendations are not imported.',
  },
  {
    id: 'nordiqc-71',
    title: 'NordiQC epitope guidance: S100',
    publisher: 'NordiQC',
    url: 'https://www.nordiqc.org/epitope.php?id=71',
    access: 'read',
    onAscpReadingList: false,
    accessedOn: '2026-11-06',
    readScope:
      'Marker characteristics and control-tissue paragraphs read from the public page; linked current assessment reports were not individually reviewed.',
    limitations:
      'Some epitope essays are historical. Control recommendations vary by antibody, assay, preparation and intended use; clinical cutoffs and treatment recommendations are not imported.',
  },
  {
    id: 'nordiqc-94',
    title: 'NordiQC epitope guidance: SOX10',
    publisher: 'NordiQC',
    url: 'https://www.nordiqc.org/epitope.php?id=94',
    access: 'read',
    onAscpReadingList: false,
    accessedOn: '2026-11-06',
    readScope:
      'Marker characteristics and control-tissue paragraphs read from the public page; linked current assessment reports were not individually reviewed.',
    limitations:
      'Some epitope essays are historical. Control recommendations vary by antibody, assay, preparation and intended use; clinical cutoffs and treatment recommendations are not imported.',
  },
  {
    id: 'nordiqc-53',
    title: 'NordiQC epitope guidance: MLA',
    publisher: 'NordiQC',
    url: 'https://www.nordiqc.org/epitope.php?id=53',
    access: 'read',
    onAscpReadingList: false,
    accessedOn: '2026-11-06',
    readScope:
      'Marker characteristics and control-tissue paragraphs read from the public page; linked current assessment reports were not individually reviewed.',
    limitations:
      'Some epitope essays are historical. Control recommendations vary by antibody, assay, preparation and intended use; clinical cutoffs and treatment recommendations are not imported.',
  },
  {
    id: 'nordiqc-54',
    title: 'NordiQC epitope guidance: MSA',
    publisher: 'NordiQC',
    url: 'https://www.nordiqc.org/epitope.php?id=54',
    access: 'read',
    onAscpReadingList: false,
    accessedOn: '2026-11-06',
    readScope:
      'Marker characteristics and control-tissue paragraphs read from the public page; linked current assessment reports were not individually reviewed.',
    limitations:
      'Some epitope essays are historical. Control recommendations vary by antibody, assay, preparation and intended use; clinical cutoffs and treatment recommendations are not imported.',
  },
  {
    id: 'nordiqc-45',
    title: 'NordiQC epitope guidance: EMA',
    publisher: 'NordiQC',
    url: 'https://www.nordiqc.org/epitope.php?id=45',
    access: 'read',
    onAscpReadingList: false,
    accessedOn: '2026-11-06',
    readScope:
      'Marker characteristics and control-tissue paragraphs read from the public page; linked current assessment reports were not individually reviewed.',
    limitations:
      'Some epitope essays are historical. Control recommendations vary by antibody, assay, preparation and intended use; clinical cutoffs and treatment recommendations are not imported.',
  },
  {
    id: 'nordiqc-31',
    title: 'NordiQC epitope guidance: CD45',
    publisher: 'NordiQC',
    url: 'https://www.nordiqc.org/epitope.php?id=31',
    access: 'read',
    onAscpReadingList: false,
    accessedOn: '2026-11-06',
    readScope:
      'Marker characteristics and control-tissue paragraphs read from the public page; linked current assessment reports were not individually reviewed.',
    limitations:
      'Some epitope essays are historical. Control recommendations vary by antibody, assay, preparation and intended use; clinical cutoffs and treatment recommendations are not imported.',
  },
  {
    id: 'nordiqc-3',
    title: 'NordiQC epitope guidance: CD3',
    publisher: 'NordiQC',
    url: 'https://www.nordiqc.org/epitope.php?id=3',
    access: 'read',
    onAscpReadingList: false,
    accessedOn: '2026-11-06',
    readScope:
      'Marker characteristics and control-tissue paragraphs read from the public page; linked current assessment reports were not individually reviewed.',
    limitations:
      'Some epitope essays are historical. Control recommendations vary by antibody, assay, preparation and intended use; clinical cutoffs and treatment recommendations are not imported.',
  },
  {
    id: 'nordiqc-27',
    title: 'NordiQC epitope guidance: CD20',
    publisher: 'NordiQC',
    url: 'https://www.nordiqc.org/epitope.php?id=27',
    access: 'read',
    onAscpReadingList: false,
    accessedOn: '2026-11-06',
    readScope:
      'Marker characteristics and control-tissue paragraphs read from the public page; linked current assessment reports were not individually reviewed.',
    limitations:
      'Some epitope essays are historical. Control recommendations vary by antibody, assay, preparation and intended use; clinical cutoffs and treatment recommendations are not imported.',
  },
  {
    id: 'nordiqc-34',
    title: 'NordiQC epitope guidance: CD79a',
    publisher: 'NordiQC',
    url: 'https://www.nordiqc.org/epitope.php?id=34',
    access: 'read',
    onAscpReadingList: false,
    accessedOn: '2026-11-06',
    readScope:
      'Marker characteristics and control-tissue paragraphs read from the public page; linked current assessment reports were not individually reviewed.',
    limitations:
      'Some epitope essays are historical. Control recommendations vary by antibody, assay, preparation and intended use; clinical cutoffs and treatment recommendations are not imported.',
  },
  {
    id: 'nordiqc-23',
    title: 'NordiQC epitope guidance: CD10',
    publisher: 'NordiQC',
    url: 'https://www.nordiqc.org/epitope.php?id=23',
    access: 'read',
    onAscpReadingList: false,
    accessedOn: '2026-11-06',
    readScope:
      'Marker characteristics and control-tissue paragraphs read from the public page; linked current assessment reports were not individually reviewed.',
    limitations:
      'Some epitope essays are historical. Control recommendations vary by antibody, assay, preparation and intended use; clinical cutoffs and treatment recommendations are not imported.',
  },
  {
    id: 'nordiqc-5',
    title: 'NordiQC epitope guidance: CD30',
    publisher: 'NordiQC',
    url: 'https://www.nordiqc.org/epitope.php?id=5',
    access: 'read',
    onAscpReadingList: false,
    accessedOn: '2026-11-06',
    readScope:
      'Marker characteristics and control-tissue paragraphs read from the public page; linked current assessment reports were not individually reviewed.',
    limitations:
      'Some epitope essays are historical. Control recommendations vary by antibody, assay, preparation and intended use; clinical cutoffs and treatment recommendations are not imported.',
  },
  {
    id: 'nordiqc-30',
    title: 'NordiQC epitope guidance: CD34',
    publisher: 'NordiQC',
    url: 'https://www.nordiqc.org/epitope.php?id=30',
    access: 'read',
    onAscpReadingList: false,
    accessedOn: '2026-11-06',
    readScope:
      'Marker characteristics and control-tissue paragraphs read from the public page; linked current assessment reports were not individually reviewed.',
    limitations:
      'Some epitope essays are historical. Control recommendations vary by antibody, assay, preparation and intended use; clinical cutoffs and treatment recommendations are not imported.',
  },
  {
    id: 'nordiqc-29',
    title: 'NordiQC epitope guidance: CD31',
    publisher: 'NordiQC',
    url: 'https://www.nordiqc.org/epitope.php?id=29',
    access: 'read',
    onAscpReadingList: false,
    accessedOn: '2026-11-06',
    readScope:
      'Marker characteristics and control-tissue paragraphs read from the public page; linked current assessment reports were not individually reviewed.',
    limitations:
      'Some epitope essays are historical. Control recommendations vary by antibody, assay, preparation and intended use; clinical cutoffs and treatment recommendations are not imported.',
  },
  {
    id: 'nordiqc-101',
    title: 'NordiQC epitope guidance: ERG',
    publisher: 'NordiQC',
    url: 'https://www.nordiqc.org/epitope.php?id=101',
    access: 'read',
    onAscpReadingList: false,
    accessedOn: '2026-11-06',
    readScope:
      'Marker characteristics and control-tissue paragraphs read from the public page; linked current assessment reports were not individually reviewed.',
    limitations:
      'Some epitope essays are historical. Control recommendations vary by antibody, assay, preparation and intended use; clinical cutoffs and treatment recommendations are not imported.',
  },
  {
    id: 'nordiqc-1',
    title: 'NordiQC epitope guidance: Ki67',
    publisher: 'NordiQC',
    url: 'https://www.nordiqc.org/epitope.php?id=1',
    access: 'read',
    onAscpReadingList: false,
    accessedOn: '2026-11-06',
    readScope:
      'Marker characteristics and control-tissue paragraphs read from the public page; linked current assessment reports were not individually reviewed.',
    limitations:
      'Some epitope essays are historical. Control recommendations vary by antibody, assay, preparation and intended use; clinical cutoffs and treatment recommendations are not imported.',
  },
  {
    id: 'nordiqc-60',
    title: 'NordiQC epitope guidance: p53',
    publisher: 'NordiQC',
    url: 'https://www.nordiqc.org/epitope.php?id=60',
    access: 'read',
    onAscpReadingList: false,
    accessedOn: '2026-11-06',
    readScope:
      'Marker characteristics and control-tissue paragraphs read from the public page; linked current assessment reports were not individually reviewed.',
    limitations:
      'Some epitope essays are historical. Control recommendations vary by antibody, assay, preparation and intended use; clinical cutoffs and treatment recommendations are not imported.',
  },
  {
    id: 'nordiqc-62',
    title: 'NordiQC epitope guidance: p63',
    publisher: 'NordiQC',
    url: 'https://www.nordiqc.org/epitope.php?id=62',
    access: 'read',
    onAscpReadingList: false,
    accessedOn: '2026-11-06',
    readScope:
      'Marker characteristics and control-tissue paragraphs read from the public page; linked current assessment reports were not individually reviewed.',
    limitations:
      'Some epitope essays are historical. Control recommendations vary by antibody, assay, preparation and intended use; clinical cutoffs and treatment recommendations are not imported.',
  },
  {
    id: 'nordiqc-10',
    title: 'NordiQC epitope guidance: p40',
    publisher: 'NordiQC',
    url: 'https://www.nordiqc.org/epitope.php?id=10',
    access: 'read',
    onAscpReadingList: false,
    accessedOn: '2026-11-06',
    readScope:
      'Marker characteristics and control-tissue paragraphs read from the public page; linked current assessment reports were not individually reviewed.',
    limitations:
      'Some epitope essays are historical. Control recommendations vary by antibody, assay, preparation and intended use; clinical cutoffs and treatment recommendations are not imported.',
  },
  {
    id: 'nordiqc-75',
    title: 'NordiQC epitope guidance: TTF1',
    publisher: 'NordiQC',
    url: 'https://www.nordiqc.org/epitope.php?id=75',
    access: 'read',
    onAscpReadingList: false,
    accessedOn: '2026-11-06',
    readScope:
      'Marker characteristics and control-tissue paragraphs read from the public page; linked current assessment reports were not individually reviewed.',
    limitations:
      'Some epitope essays are historical. Control recommendations vary by antibody, assay, preparation and intended use; clinical cutoffs and treatment recommendations are not imported.',
  },
  {
    id: 'nordiqc-39',
    title: 'NordiQC epitope guidance: CDX2',
    publisher: 'NordiQC',
    url: 'https://www.nordiqc.org/epitope.php?id=39',
    access: 'read',
    onAscpReadingList: false,
    accessedOn: '2026-11-06',
    readScope:
      'Marker characteristics and control-tissue paragraphs read from the public page; linked current assessment reports were not individually reviewed.',
    limitations:
      'Some epitope essays are historical. Control recommendations vary by antibody, assay, preparation and intended use; clinical cutoffs and treatment recommendations are not imported.',
  },
  {
    id: 'nordiqc-8',
    title: 'NordiQC epitope guidance: GATA3',
    publisher: 'NordiQC',
    url: 'https://www.nordiqc.org/epitope.php?id=8',
    access: 'read',
    onAscpReadingList: false,
    accessedOn: '2026-11-06',
    readScope:
      'Marker characteristics and control-tissue paragraphs read from the public page; linked current assessment reports were not individually reviewed.',
    limitations:
      'Some epitope essays are historical. Control recommendations vary by antibody, assay, preparation and intended use; clinical cutoffs and treatment recommendations are not imported.',
  },
  {
    id: 'nordiqc-2',
    title: 'NordiQC epitope guidance: ER',
    publisher: 'NordiQC',
    url: 'https://www.nordiqc.org/epitope.php?id=2',
    access: 'read',
    onAscpReadingList: false,
    accessedOn: '2026-11-06',
    readScope:
      'Marker characteristics and control-tissue paragraphs read from the public page; linked current assessment reports were not individually reviewed.',
    limitations:
      'Some epitope essays are historical. Control recommendations vary by antibody, assay, preparation and intended use; clinical cutoffs and treatment recommendations are not imported.',
  },
  {
    id: 'nordiqc-67',
    title: 'NordiQC epitope guidance: PR',
    publisher: 'NordiQC',
    url: 'https://www.nordiqc.org/epitope.php?id=67',
    access: 'read',
    onAscpReadingList: false,
    accessedOn: '2026-11-06',
    readScope:
      'Marker characteristics and control-tissue paragraphs read from the public page; linked current assessment reports were not individually reviewed.',
    limitations:
      'Some epitope essays are historical. Control recommendations vary by antibody, assay, preparation and intended use; clinical cutoffs and treatment recommendations are not imported.',
  },
  {
    id: 'nordiqc-11',
    title: 'NordiQC epitope guidance: HER2 IHC',
    publisher: 'NordiQC',
    url: 'https://www.nordiqc.org/epitope.php?id=11',
    access: 'read',
    onAscpReadingList: false,
    accessedOn: '2026-11-06',
    readScope:
      'Marker characteristics and control-tissue paragraphs read from the public page; linked current assessment reports were not individually reviewed.',
    limitations:
      'Some epitope essays are historical. Control recommendations vary by antibody, assay, preparation and intended use; clinical cutoffs and treatment recommendations are not imported.',
  },
  {
    id: 'nordiqc-73',
    title: 'NordiQC epitope guidance: SYP',
    publisher: 'NordiQC',
    url: 'https://www.nordiqc.org/epitope.php?id=73',
    access: 'read',
    onAscpReadingList: false,
    accessedOn: '2026-11-06',
    readScope:
      'Marker characteristics and control-tissue paragraphs read from the public page; linked current assessment reports were not individually reviewed.',
    limitations:
      'Some epitope essays are historical. Control recommendations vary by antibody, assay, preparation and intended use; clinical cutoffs and treatment recommendations are not imported.',
  },
  {
    id: 'nordiqc-40',
    title: 'NordiQC epitope guidance: CGA',
    publisher: 'NordiQC',
    url: 'https://www.nordiqc.org/epitope.php?id=40',
    access: 'read',
    onAscpReadingList: false,
    accessedOn: '2026-11-06',
    readScope:
      'Marker characteristics and control-tissue paragraphs read from the public page; linked current assessment reports were not individually reviewed.',
    limitations:
      'Some epitope essays are historical. Control recommendations vary by antibody, assay, preparation and intended use; clinical cutoffs and treatment recommendations are not imported.',
  },
  {
    id: 'nordiqc-120',
    title: 'NordiQC epitope guidance: INSM1',
    publisher: 'NordiQC',
    url: 'https://www.nordiqc.org/epitope.php?id=120',
    access: 'read',
    onAscpReadingList: false,
    accessedOn: '2026-11-06',
    readScope:
      'Marker characteristics and control-tissue paragraphs read from the public page; linked current assessment reports were not individually reviewed.',
    limitations:
      'Some epitope essays are historical. Control recommendations vary by antibody, assay, preparation and intended use; clinical cutoffs and treatment recommendations are not imported.',
  },
  {
    id: 'nordiqc-77',
    title: 'NordiQC epitope guidance: WT1',
    publisher: 'NordiQC',
    url: 'https://www.nordiqc.org/epitope.php?id=77',
    access: 'read',
    onAscpReadingList: false,
    accessedOn: '2026-11-06',
    readScope:
      'Marker characteristics and control-tissue paragraphs read from the public page; linked current assessment reports were not individually reviewed.',
    limitations:
      'Some epitope essays are historical. Control recommendations vary by antibody, assay, preparation and intended use; clinical cutoffs and treatment recommendations are not imported.',
  },
  {
    id: 'nordiqc-64',
    title: 'NordiQC epitope guidance: PAX8',
    publisher: 'NordiQC',
    url: 'https://www.nordiqc.org/epitope.php?id=64',
    access: 'read',
    onAscpReadingList: false,
    accessedOn: '2026-11-06',
    readScope:
      'Marker characteristics and control-tissue paragraphs read from the public page; linked current assessment reports were not individually reviewed.',
    limitations:
      'Some epitope essays are historical. Control recommendations vary by antibody, assay, preparation and intended use; clinical cutoffs and treatment recommendations are not imported.',
  },
  {
    id: 'nordiqc-18',
    title: 'NordiQC epitope guidance: CALRET',
    publisher: 'NordiQC',
    url: 'https://www.nordiqc.org/epitope.php?id=18',
    access: 'read',
    onAscpReadingList: false,
    accessedOn: '2026-11-06',
    readScope:
      'Marker characteristics and control-tissue paragraphs read from the public page; linked current assessment reports were not individually reviewed.',
    limitations:
      'Some epitope essays are historical. Control recommendations vary by antibody, assay, preparation and intended use; clinical cutoffs and treatment recommendations are not imported.',
  },
  {
    id: 'nordiqc-66',
    title: 'NordiQC epitope guidance: Podop',
    publisher: 'NordiQC',
    url: 'https://www.nordiqc.org/epitope.php?id=66',
    access: 'read',
    onAscpReadingList: false,
    accessedOn: '2026-11-06',
    readScope:
      'Marker characteristics and control-tissue paragraphs read from the public page; linked current assessment reports were not individually reviewed.',
    limitations:
      'Some epitope essays are historical. Control recommendations vary by antibody, assay, preparation and intended use; clinical cutoffs and treatment recommendations are not imported.',
  },
  {
    id: 'nordiqc-81',
    title: 'NordiQC epitope guidance: MLH1',
    publisher: 'NordiQC',
    url: 'https://www.nordiqc.org/epitope.php?id=81',
    access: 'read',
    onAscpReadingList: false,
    accessedOn: '2026-11-06',
    readScope:
      'Marker characteristics and control-tissue paragraphs read from the public page; linked current assessment reports were not individually reviewed.',
    limitations:
      'Some epitope essays are historical. Control recommendations vary by antibody, assay, preparation and intended use; clinical cutoffs and treatment recommendations are not imported.',
  },
  {
    id: 'nordiqc-84',
    title: 'NordiQC epitope guidance: PMS2',
    publisher: 'NordiQC',
    url: 'https://www.nordiqc.org/epitope.php?id=84',
    access: 'read',
    onAscpReadingList: false,
    accessedOn: '2026-11-06',
    readScope:
      'Marker characteristics and control-tissue paragraphs read from the public page; linked current assessment reports were not individually reviewed.',
    limitations:
      'Some epitope essays are historical. Control recommendations vary by antibody, assay, preparation and intended use; clinical cutoffs and treatment recommendations are not imported.',
  },
  {
    id: 'nordiqc-82',
    title: 'NordiQC epitope guidance: MSH2',
    publisher: 'NordiQC',
    url: 'https://www.nordiqc.org/epitope.php?id=82',
    access: 'read',
    onAscpReadingList: false,
    accessedOn: '2026-11-06',
    readScope:
      'Marker characteristics and control-tissue paragraphs read from the public page; linked current assessment reports were not individually reviewed.',
    limitations:
      'Some epitope essays are historical. Control recommendations vary by antibody, assay, preparation and intended use; clinical cutoffs and treatment recommendations are not imported.',
  },
  {
    id: 'nordiqc-83',
    title: 'NordiQC epitope guidance: MSH6',
    publisher: 'NordiQC',
    url: 'https://www.nordiqc.org/epitope.php?id=83',
    access: 'read',
    onAscpReadingList: false,
    accessedOn: '2026-11-06',
    readScope:
      'Marker characteristics and control-tissue paragraphs read from the public page; linked current assessment reports were not individually reviewed.',
    limitations:
      'Some epitope essays are historical. Control recommendations vary by antibody, assay, preparation and intended use; clinical cutoffs and treatment recommendations are not imported.',
  },
  {
    id: 'nordiqc-110',
    title: 'NordiQC epitope guidance: PD-L1 (TPS/CPS)',
    publisher: 'NordiQC',
    url: 'https://www.nordiqc.org/epitope.php?id=110',
    access: 'read',
    onAscpReadingList: false,
    accessedOn: '2026-11-06',
    readScope:
      'Marker characteristics and control-tissue paragraphs read from the public page; linked current assessment reports were not individually reviewed.',
    limitations:
      'Some epitope essays are historical. Control recommendations vary by antibody, assay, preparation and intended use; clinical cutoffs and treatment recommendations are not imported.',
  },
  {
    id: 'nordiqc-14',
    title: 'NordiQC epitope guidance: ALK (lung)',
    publisher: 'NordiQC',
    url: 'https://www.nordiqc.org/epitope.php?id=14',
    access: 'read',
    onAscpReadingList: false,
    accessedOn: '2026-11-06',
    readScope:
      'Marker characteristics and control-tissue paragraphs read from the public page; linked current assessment reports were not individually reviewed.',
    limitations:
      'Some epitope essays are historical. Control recommendations vary by antibody, assay, preparation and intended use; clinical cutoffs and treatment recommendations are not imported.',
  },
  {
    id: 'nordiqc-43',
    title: 'NordiQC epitope guidance: ECAD',
    publisher: 'NordiQC',
    url: 'https://www.nordiqc.org/epitope.php?id=43',
    access: 'read',
    onAscpReadingList: false,
    accessedOn: '2026-11-06',
    readScope:
      'Marker characteristics and control-tissue paragraphs read from the public page; linked current assessment reports were not individually reviewed.',
    limitations:
      'Some epitope essays are historical. Control recommendations vary by antibody, assay, preparation and intended use; clinical cutoffs and treatment recommendations are not imported.',
  },
  {
    id: 'nordiqc-36',
    title: 'NordiQC epitope guidance: CD117',
    publisher: 'NordiQC',
    url: 'https://www.nordiqc.org/epitope.php?id=36',
    access: 'read',
    onAscpReadingList: false,
    accessedOn: '2026-11-06',
    readScope:
      'Marker characteristics and control-tissue paragraphs read from the public page; linked current assessment reports were not individually reviewed.',
    limitations:
      'Some epitope essays are historical. Control recommendations vary by antibody, assay, preparation and intended use; clinical cutoffs and treatment recommendations are not imported.',
  },
  {
    id: 'nordiqc-7',
    title: 'NordiQC epitope guidance: DOG1',
    publisher: 'NordiQC',
    url: 'https://www.nordiqc.org/epitope.php?id=7',
    access: 'read',
    onAscpReadingList: false,
    accessedOn: '2026-11-06',
    readScope:
      'Marker characteristics and control-tissue paragraphs read from the public page; linked current assessment reports were not individually reviewed.',
    limitations:
      'Some epitope essays are historical. Control recommendations vary by antibody, assay, preparation and intended use; clinical cutoffs and treatment recommendations are not imported.',
  },
  {
    id: 'nordiqc-50',
    title: 'NordiQC epitope guidance: GFAP',
    publisher: 'NordiQC',
    url: 'https://www.nordiqc.org/epitope.php?id=50',
    access: 'read',
    onAscpReadingList: false,
    accessedOn: '2026-11-06',
    readScope:
      'Marker characteristics and control-tissue paragraphs read from the public page; linked current assessment reports were not individually reviewed.',
    limitations:
      'Some epitope essays are historical. Control recommendations vary by antibody, assay, preparation and intended use; clinical cutoffs and treatment recommendations are not imported.',
  },
  {
    id: 'nordiqc-59',
    title: 'NordiQC epitope guidance: p16',
    publisher: 'NordiQC',
    url: 'https://www.nordiqc.org/epitope.php?id=59',
    access: 'read',
    onAscpReadingList: false,
    accessedOn: '2026-11-06',
    readScope:
      'Marker characteristics and control-tissue paragraphs read from the public page; linked current assessment reports were not individually reviewed.',
    limitations:
      'Some epitope essays are historical. Control recommendations vary by antibody, assay, preparation and intended use; clinical cutoffs and treatment recommendations are not imported.',
  },
  {
    id: 'nordiqc-16',
    title: 'NordiQC epitope guidance: Bcl-2',
    publisher: 'NordiQC',
    url: 'https://www.nordiqc.org/epitope.php?id=16',
    access: 'read',
    onAscpReadingList: false,
    accessedOn: '2026-11-06',
    readScope:
      'Marker characteristics and control-tissue paragraphs read from the public page; linked current assessment reports were not individually reviewed.',
    limitations:
      'Some epitope essays are historical. Control recommendations vary by antibody, assay, preparation and intended use; clinical cutoffs and treatment recommendations are not imported.',
  },
  {
    id: 'nordiqc-17',
    title: 'NordiQC epitope guidance: Bcl-6',
    publisher: 'NordiQC',
    url: 'https://www.nordiqc.org/epitope.php?id=17',
    access: 'read',
    onAscpReadingList: false,
    accessedOn: '2026-11-06',
    readScope:
      'Marker characteristics and control-tissue paragraphs read from the public page; linked current assessment reports were not individually reviewed.',
    limitations:
      'Some epitope essays are historical. Control recommendations vary by antibody, assay, preparation and intended use; clinical cutoffs and treatment recommendations are not imported.',
  },
  {
    id: 'nordiqc-41',
    title: 'NordiQC epitope guidance: CyD1',
    publisher: 'NordiQC',
    url: 'https://www.nordiqc.org/epitope.php?id=41',
    access: 'read',
    onAscpReadingList: false,
    accessedOn: '2026-11-06',
    readScope:
      'Marker characteristics and control-tissue paragraphs read from the public page; linked current assessment reports were not individually reviewed.',
    limitations:
      'Some epitope essays are historical. Control recommendations vary by antibody, assay, preparation and intended use; clinical cutoffs and treatment recommendations are not imported.',
  },
  {
    id: 'nordiqc-33',
    title: 'NordiQC epitope guidance: CD68',
    publisher: 'NordiQC',
    url: 'https://www.nordiqc.org/epitope.php?id=33',
    access: 'read',
    onAscpReadingList: false,
    accessedOn: '2026-11-06',
    readScope:
      'Marker characteristics and control-tissue paragraphs read from the public page; linked current assessment reports were not individually reviewed.',
    limitations:
      'Some epitope essays are historical. Control recommendations vary by antibody, assay, preparation and intended use; clinical cutoffs and treatment recommendations are not imported.',
  },
  {
    id: 'nordiqc-38',
    title: 'NordiQC epitope guidance: CD163',
    publisher: 'NordiQC',
    url: 'https://www.nordiqc.org/epitope.php?id=38',
    access: 'read',
    onAscpReadingList: false,
    accessedOn: '2026-11-06',
    readScope:
      'Marker characteristics and control-tissue paragraphs read from the public page; linked current assessment reports were not individually reviewed.',
    limitations:
      'Some epitope essays are historical. Control recommendations vary by antibody, assay, preparation and intended use; clinical cutoffs and treatment recommendations are not imported.',
  },
  {
    id: 'nordiqc-37',
    title: 'NordiQC epitope guidance: CD138',
    publisher: 'NordiQC',
    url: 'https://www.nordiqc.org/epitope.php?id=37',
    access: 'read',
    onAscpReadingList: false,
    accessedOn: '2026-11-06',
    readScope:
      'Marker characteristics and control-tissue paragraphs read from the public page; linked current assessment reports were not individually reviewed.',
    limitations:
      'Some epitope essays are historical. Control recommendations vary by antibody, assay, preparation and intended use; clinical cutoffs and treatment recommendations are not imported.',
  },
  {
    id: 'nordiqc-15',
    title: 'NordiQC epitope guidance: PAX5',
    publisher: 'NordiQC',
    url: 'https://www.nordiqc.org/epitope.php?id=15',
    access: 'read',
    onAscpReadingList: false,
    accessedOn: '2026-11-06',
    readScope:
      'Marker characteristics and control-tissue paragraphs read from the public page; linked current assessment reports were not individually reviewed.',
    limitations:
      'Some epitope essays are historical. Control recommendations vary by antibody, assay, preparation and intended use; clinical cutoffs and treatment recommendations are not imported.',
  },
  {
    id: 'nordiqc-9',
    title: 'NordiQC epitope guidance: Napsin A',
    publisher: 'NordiQC',
    url: 'https://www.nordiqc.org/epitope.php?id=9',
    access: 'read',
    onAscpReadingList: false,
    accessedOn: '2026-11-06',
    readScope:
      'Marker characteristics and control-tissue paragraphs read from the public page; linked current assessment reports were not individually reviewed.',
    limitations:
      'Some epitope essays are historical. Control recommendations vary by antibody, assay, preparation and intended use; clinical cutoffs and treatment recommendations are not imported.',
  },
  {
    id: 'nordiqc-100',
    title: 'NordiQC epitope guidance: NKX3.1',
    publisher: 'NordiQC',
    url: 'https://www.nordiqc.org/epitope.php?id=100',
    access: 'read',
    onAscpReadingList: false,
    accessedOn: '2026-11-06',
    readScope:
      'Marker characteristics and control-tissue paragraphs read from the public page; linked current assessment reports were not individually reviewed.',
    limitations:
      'Some epitope essays are historical. Control recommendations vary by antibody, assay, preparation and intended use; clinical cutoffs and treatment recommendations are not imported.',
  },
  {
    id: 'nordiqc-108',
    title: 'NordiQC epitope guidance: SATB2',
    publisher: 'NordiQC',
    url: 'https://www.nordiqc.org/epitope.php?id=108',
    access: 'read',
    onAscpReadingList: false,
    accessedOn: '2026-11-06',
    readScope:
      'Marker characteristics and control-tissue paragraphs read from the public page; linked current assessment reports were not individually reviewed.',
    limitations:
      'Some epitope essays are historical. Control recommendations vary by antibody, assay, preparation and intended use; clinical cutoffs and treatment recommendations are not imported.',
  },
  {
    id: 'nordiqc-13',
    title: 'NordiQC epitope guidance: AMACR',
    publisher: 'NordiQC',
    url: 'https://www.nordiqc.org/epitope.php?id=13',
    access: 'read',
    onAscpReadingList: false,
    accessedOn: '2026-11-06',
    readScope:
      'Marker characteristics and control-tissue paragraphs read from the public page; linked current assessment reports were not individually reviewed.',
    limitations:
      'Some epitope essays are historical. Control recommendations vary by antibody, assay, preparation and intended use; clinical cutoffs and treatment recommendations are not imported.',
  },
  {
    id: 'nordiqc-68',
    title: 'NordiQC epitope guidance: PSA',
    publisher: 'NordiQC',
    url: 'https://www.nordiqc.org/epitope.php?id=68',
    access: 'read',
    onAscpReadingList: false,
    accessedOn: '2026-11-06',
    readScope:
      'Marker characteristics and control-tissue paragraphs read from the public page; linked current assessment reports were not individually reviewed.',
    limitations:
      'Some epitope essays are historical. Control recommendations vary by antibody, assay, preparation and intended use; clinical cutoffs and treatment recommendations are not imported.',
  },
  {
    id: 'nordiqc-78',
    title: 'NordiQC cytokeratin control guidance',
    publisher: 'NordiQC',
    url: 'https://www.nordiqc.org/epitope.php?id=78',
    access: 'read',
    onAscpReadingList: false,
    accessedOn: '2026-11-06',
    readScope: 'Grouped cytokeratin control-tissue recommendations read.',
    limitations:
      'Cocktail composition and CK5/6 coverage require assay-specific verification; CK5 control guidance does not validate every cocktail.',
  },
  {
    id: 'webpath-pas',
    title: 'WebPath historical staining manual: PAS',
    publisher: 'University of Utah WebPath',
    url: 'https://webpath.med.utah.edu/HISTHTML/MANUALS/PAS.PDF',
    access: 'read',
    onAscpReadingList: false,
    accessedOn: '2026-11-06',
    readScope: 'Principle, control, reaction sequence and expected appearance read.',
    limitations:
      'Historical method, not a current approved SOP. Reagent recipes, heating instructions and waste-disposal directions are not reproduced. Simulation durations are separate illustrative parameters.',
  },
  {
    id: 'webpath-pasd',
    title: 'WebPath historical staining manual: PAS with diastase',
    publisher: 'University of Utah WebPath',
    url: 'https://webpath.med.utah.edu/HISTHTML/MANUALS/PASD.PDF',
    access: 'read',
    onAscpReadingList: false,
    accessedOn: '2026-11-06',
    readScope: 'Principle, control, reaction sequence and expected appearance read.',
    limitations:
      'Historical method, not a current approved SOP. Reagent recipes, heating instructions and waste-disposal directions are not reproduced. Simulation durations are separate illustrative parameters.',
  },
  {
    id: 'webpath-alcian',
    title: 'WebPath historical staining manual: Alcian blue pH 2.5',
    publisher: 'University of Utah WebPath',
    url: 'https://webpath.med.utah.edu/HISTHTML/MANUALS/ALCIAN.PDF',
    access: 'read',
    onAscpReadingList: false,
    accessedOn: '2026-11-06',
    readScope: 'Principle, control, reaction sequence and expected appearance read.',
    limitations:
      'Historical method, not a current approved SOP. Reagent recipes, heating instructions and waste-disposal directions are not reproduced. Simulation durations are separate illustrative parameters.',
  },
  {
    id: 'webpath-mucicarmine',
    title: 'WebPath historical staining manual: Mucicarmine',
    publisher: 'University of Utah WebPath',
    url: 'https://webpath.med.utah.edu/HISTHTML/MANUALS/MUCICAR.PDF',
    access: 'read',
    onAscpReadingList: false,
    accessedOn: '2026-11-06',
    readScope: 'Principle, control, reaction sequence and expected appearance read.',
    limitations:
      'Historical method, not a current approved SOP. Reagent recipes, heating instructions and waste-disposal directions are not reproduced. Simulation durations are separate illustrative parameters.',
  },
  {
    id: 'webpath-colloidal',
    title: 'WebPath historical staining manual: Colloidal iron',
    publisher: 'University of Utah WebPath',
    url: 'https://webpath.med.utah.edu/HISTHTML/MANUALS/COLIRON.PDF',
    access: 'read',
    onAscpReadingList: false,
    accessedOn: '2026-11-06',
    readScope: 'Principle, control, reaction sequence and expected appearance read.',
    limitations:
      'Historical method, not a current approved SOP. Reagent recipes, heating instructions and waste-disposal directions are not reproduced. Simulation durations are separate illustrative parameters.',
  },
  {
    id: 'webpath-masson',
    title: 'WebPath historical staining manual: Masson trichrome',
    publisher: 'University of Utah WebPath',
    url: 'https://webpath.med.utah.edu/HISTHTML/MANUALS/MASSONS.PDF',
    access: 'read',
    onAscpReadingList: false,
    accessedOn: '2026-11-06',
    readScope: 'Principle, control, reaction sequence and expected appearance read.',
    limitations:
      'Historical method, not a current approved SOP. Reagent recipes, heating instructions and waste-disposal directions are not reproduced. Simulation durations are separate illustrative parameters.',
  },
  {
    id: 'webpath-elastic',
    title: 'WebPath historical staining manual: Verhoeff elastic / Van Gieson',
    publisher: 'University of Utah WebPath',
    url: 'https://webpath.med.utah.edu/HISTHTML/MANUALS/EVG.PDF',
    access: 'read',
    onAscpReadingList: false,
    accessedOn: '2026-11-06',
    readScope: 'Principle, control, reaction sequence and expected appearance read.',
    limitations:
      'Historical method, not a current approved SOP. Reagent recipes, heating instructions and waste-disposal directions are not reproduced. Simulation durations are separate illustrative parameters.',
  },
  {
    id: 'webpath-reticulin',
    title: 'WebPath historical staining manual: Reticulin silver',
    publisher: 'University of Utah WebPath',
    url: 'https://webpath.med.utah.edu/HISTHTML/MANUALS/RETIC.PDF',
    access: 'read',
    onAscpReadingList: false,
    accessedOn: '2026-11-06',
    readScope: 'Principle, control, reaction sequence and expected appearance read.',
    limitations:
      'Historical method, not a current approved SOP. Reagent recipes, heating instructions and waste-disposal directions are not reproduced. Simulation durations are separate illustrative parameters.',
  },
  {
    id: 'webpath-congo',
    title: 'WebPath historical staining manual: Congo red',
    publisher: 'University of Utah WebPath',
    url: 'https://webpath.med.utah.edu/HISTHTML/MANUALS/CONGORED.PDF',
    access: 'read',
    onAscpReadingList: false,
    accessedOn: '2026-11-06',
    readScope: 'Principle, control, reaction sequence and expected appearance read.',
    limitations:
      'Historical method, not a current approved SOP. Reagent recipes, heating instructions and waste-disposal directions are not reproduced. Simulation durations are separate illustrative parameters.',
  },
  {
    id: 'webpath-gram',
    title: 'WebPath historical staining manual: Tissue Gram',
    publisher: 'University of Utah WebPath',
    url: 'https://webpath.med.utah.edu/HISTHTML/MANUALS/GRAM.PDF',
    access: 'read',
    onAscpReadingList: false,
    accessedOn: '2026-11-06',
    readScope: 'Principle, control, reaction sequence and expected appearance read.',
    limitations:
      'Historical method, not a current approved SOP. Reagent recipes, heating instructions and waste-disposal directions are not reproduced. Simulation durations are separate illustrative parameters.',
  },
  {
    id: 'webpath-afb',
    title: 'WebPath historical staining manual: Acid-fast stain',
    publisher: 'University of Utah WebPath',
    url: 'https://webpath.med.utah.edu/HISTHTML/MANUALS/AFB.PDF',
    access: 'read',
    onAscpReadingList: false,
    accessedOn: '2026-11-06',
    readScope: 'Principle, control, reaction sequence and expected appearance read.',
    limitations:
      'Historical method, not a current approved SOP. Reagent recipes, heating instructions and waste-disposal directions are not reproduced. Simulation durations are separate illustrative parameters.',
  },
  {
    id: 'webpath-fite',
    title: 'WebPath historical staining manual: Fite method',
    publisher: 'University of Utah WebPath',
    url: 'https://webpath.med.utah.edu/HISTHTML/MANUALS/FITES.PDF',
    access: 'read',
    onAscpReadingList: false,
    accessedOn: '2026-11-06',
    readScope: 'Principle, control, reaction sequence and expected appearance read.',
    limitations:
      'Historical method, not a current approved SOP. Reagent recipes, heating instructions and waste-disposal directions are not reproduced. Simulation durations are separate illustrative parameters.',
  },
  {
    id: 'webpath-gms',
    title: 'WebPath historical staining manual: Grocott methenamine silver',
    publisher: 'University of Utah WebPath',
    url: 'https://webpath.med.utah.edu/HISTHTML/MANUALS/GMS.PDF',
    access: 'read',
    onAscpReadingList: false,
    accessedOn: '2026-11-06',
    readScope: 'Principle, control, reaction sequence and expected appearance read.',
    limitations:
      'Historical method, not a current approved SOP. Reagent recipes, heating instructions and waste-disposal directions are not reproduced. Simulation durations are separate illustrative parameters.',
  },
  {
    id: 'webpath-giemsa',
    title: 'WebPath historical staining manual: Rapid Giemsa variant',
    publisher: 'University of Utah WebPath',
    url: 'https://webpath.med.utah.edu/HISTHTML/MANUALS/GIEMSA.PDF',
    access: 'read',
    onAscpReadingList: false,
    accessedOn: '2026-11-06',
    readScope: 'Principle, control, reaction sequence and expected appearance read.',
    limitations:
      'Historical method, not a current approved SOP. Reagent recipes, heating instructions and waste-disposal directions are not reproduced. Simulation durations are separate illustrative parameters.',
  },
  {
    id: 'webpath-iron',
    title: 'WebPath historical staining manual: Perls iron',
    publisher: 'University of Utah WebPath',
    url: 'https://webpath.med.utah.edu/HISTHTML/MANUALS/IRON.PDF',
    access: 'read',
    onAscpReadingList: false,
    accessedOn: '2026-11-06',
    readScope: 'Principle, control, reaction sequence and expected appearance read.',
    limitations:
      'Historical method, not a current approved SOP. Reagent recipes, heating instructions and waste-disposal directions are not reproduced. Simulation durations are separate illustrative parameters.',
  },
  {
    id: 'webpath-fontana',
    title: 'WebPath historical staining manual: Fontana–Masson',
    publisher: 'University of Utah WebPath',
    url: 'https://webpath.med.utah.edu/HISTHTML/MANUALS/FONTANA.PDF',
    access: 'read',
    onAscpReadingList: false,
    accessedOn: '2026-11-06',
    readScope: 'Principle, control, reaction sequence and expected appearance read.',
    limitations:
      'Historical method, not a current approved SOP. Reagent recipes, heating instructions and waste-disposal directions are not reproduced. Simulation durations are separate illustrative parameters.',
  },
  {
    id: 'webpath-oil-red',
    title: 'WebPath historical staining manual: Oil Red O',
    publisher: 'University of Utah WebPath',
    url: 'https://webpath.med.utah.edu/HISTHTML/MANUALS/OILRED.PDF',
    access: 'read',
    onAscpReadingList: false,
    accessedOn: '2026-11-06',
    readScope: 'Principle, control, reaction sequence and expected appearance read.',
    limitations:
      'Historical method, not a current approved SOP. Reagent recipes, heating instructions and waste-disposal directions are not reproduced. Simulation durations are separate illustrative parameters.',
  },
  {
    id: 'webpath-lfb',
    title: 'WebPath historical staining manual: Luxol fast blue',
    publisher: 'University of Utah WebPath',
    url: 'https://webpath.med.utah.edu/HISTHTML/MANUALS/LFB.PDF',
    access: 'read',
    onAscpReadingList: false,
    accessedOn: '2026-11-06',
    readScope: 'Principle, control, reaction sequence and expected appearance read.',
    limitations:
      'Historical method, not a current approved SOP. Reagent recipes, heating instructions and waste-disposal directions are not reproduced. Simulation durations are separate illustrative parameters.',
  },
  {
    id: 'webpath-toluidine',
    title: 'WebPath historical staining manual: Toluidine blue',
    publisher: 'University of Utah WebPath',
    url: 'https://webpath.med.utah.edu/HISTHTML/MANUALS/TOLUID.PDF',
    access: 'read',
    onAscpReadingList: false,
    accessedOn: '2026-11-06',
    readScope: 'Principle, control, reaction sequence and expected appearance read.',
    limitations:
      'Historical method, not a current approved SOP. Reagent recipes, heating instructions and waste-disposal directions are not reproduced. Simulation durations are separate illustrative parameters.',
  },
  {
    id: 'fiji-stain-vectors',
    title: 'Colour Deconvolution preset vector data: H&E DAB',
    publisher: 'Fiji / Gabriel Landini',
    url: 'https://raw.githubusercontent.com/fiji/Colour_Deconvolution/master/src/main/resources/sc/fiji/colourDeconvolution/colourdeconvolution.txt',
    access: 'read',
    onAscpReadingList: false,
    accessedOn: '2026-11-06',
    readScope:
      'Read H&E DAB row: H (0.650, 0.704, 0.286); E (0.072, 0.990, 0.105); DAB (0.268, 0.570, 0.776).',
    limitations:
      'Preset color basis, not universal tissue absorptivity or calibrated stain kinetics. Numeric scientific data only; plugin implementation code is not copied.',
  },
  {
    id: 'landini-colour-deconvolution',
    title: 'Colour Deconvolution 2: method and calibration guidance',
    publisher: 'University of Birmingham / Gabriel Landini',
    url: 'https://blog.bham.ac.uk/intellimic/g-landini-software/colour-deconvolution-2/',
    access: 'read',
    onAscpReadingList: false,
    accessedOn: '2026-11-06',
    readScope:
      'Brightfield absorbance model, preset calibration limitations and stain-vector instructions read.',
    limitations:
      'Subtractive brightfield model does not apply to fluorescence. Stain/chromogen optical density is not a general stoichiometric measure of antigen quantity.',
  },
  {
    id: 'ruifrok-johnston-2001',
    title: 'Quantification of histochemical staining by color deconvolution',
    publisher: 'Ruifrok AC and Johnston DA; Analytical and Quantitative Cytology and Histology',
    url: 'https://pubmed.ncbi.nlm.nih.gov/11531144/',
    access: 'read',
    onAscpReadingList: false,
    accessedOn: '2026-11-06',
    readScope: 'PubMed abstract read; method provenance only.',
    limitations:
      'The original paper tables were not independently verified. Exact preset numbers are attributed to the separately read Fiji data file.',
  },
  {
    id: 'leica-ar',
    title: 'Androgen receptor: antigen background',
    publisher: 'Leica Biosystems',
    url: 'https://shop.leicabiosystems.com/us/ihc-ish/ihc-primary-antibodies/pid-androgen-receptor',
    access: 'read',
    onAscpReadingList: false,
    accessedOn: '2026-11-06',
    readScope: 'Nuclear localization, normal tissue examples and manufacturer image caption read.',
    limitations:
      'Catalog control suggestions are candidates inferred from normal expression and need assay validation.',
  },
  {
    id: 'leica-beta-catenin',
    title: 'Beta-catenin: antigen background',
    publisher: 'Leica Biosystems',
    url: 'https://shop.leicabiosystems.com/us/ihc-ish/ihc-primary-antibodies/pid-beta-catenin',
    access: 'read',
    onAscpReadingList: false,
    accessedOn: '2026-11-06',
    readScope:
      'Cell-adhesion function, cytoplasmic association and nuclear-localization example read.',
    limitations:
      'Membrane/nuclear control pair is a teaching design requiring local assay validation, not a manufacturer-approved universal control.',
  },
  {
    id: 'millipore-neun',
    title: 'Anti-NeuN MAB377: characteristics and controls',
    publisher: 'Merck / MilliporeSigma',
    url: 'https://www.sigmaaldrich.com/US/en/product/mm/mab377',
    access: 'read',
    onAscpReadingList: false,
    accessedOn: '2026-11-06',
    readScope:
      'Neuronal nuclear/perikaryal distribution, negative neuronal subsets and brain control read.',
    limitations:
      'Research reagent information. No clinical clone, dilution or protocol is prescribed.',
  },
  {
    id: 'agilent-light-chain-ish',
    title: 'Kappa and Lambda mRNA CISH: user manual',
    publisher: 'Agilent Technologies',
    url: 'https://www.agilent.com/cs/library/usermanuals/public/5991-9791.pdf',
    access: 'read',
    onAscpReadingList: false,
    accessedOn: '2026-11-06',
    readScope:
      'Target, cytoplasmic localization, paired slides and concurrent-control guidance read.',
    limitations:
      'A platform-specific manual supports principles only; parameters are not transferred to the simulation as clinical instructions.',
  },
  {
    id: 'agilent-eber',
    title: 'Epstein-Barr Virus PNA Probe/Fluorescein: target summary',
    publisher: 'Agilent Technologies',
    url: 'https://www.agilent.com/en/product/molecular-pathology/cish-probes/ebv-kappa-lambda-probes/epstein-barr-virus-pna-probe-fluorescein-76870',
    access: 'read',
    onAscpReadingList: false,
    accessedOn: '2026-11-06',
    readScope: 'EBER nuclear RNA target and FFPE in situ hybridization application read.',
    limitations:
      'Control strategy additionally follows general RNA-preservation principles; no universal negative-result interpretation is claimed.',
  },
  {
    id: 'biotechne-hpv-ish',
    title: 'RNAscope high-risk HPV target and control concepts',
    publisher: 'Bio-Techne / Advanced Cell Diagnostics',
    url: 'https://www.bio-techne.com/spatial/diagnostics/controls-reagents/rnascope-ish-probe-high-risk-hpv',
    access: 'read',
    onAscpReadingList: false,
    accessedOn: '2026-11-06',
    readScope: 'E6/E7 transcript target, assay control probes and p16 comparison read.',
    limitations:
      'Commercial assay-specific evidence; no clinical scoring thresholds or performance claims are imported.',
  },
  {
    id: 'biotechne-rna-controls',
    title: 'RNAscope RNA ISH troubleshooting and controls',
    publisher: 'Bio-Techne / Advanced Cell Diagnostics',
    url: 'https://www.bio-techne.com/spatial/resources/protocols-troubleshooting/rnascope-ish-troubleshooting',
    access: 'read',
    onAscpReadingList: false,
    accessedOn: '2026-11-06',
    readScope:
      'Housekeeping-RNA positive controls, negative probes, preparation and RNA integrity guidance read.',
    limitations:
      'Assay-specific quantitative thresholds and incubations are omitted; the learning model is not a clinical protocol.',
  },
  {
    id: 'leica-ish-controls',
    title: 'Steps to better ISH staining',
    publisher: 'Leica Biosystems',
    url: 'https://www.leicabiosystems.com/en-sg/knowledge-pathway/steps-to-better-ish/',
    access: 'read',
    onAscpReadingList: false,
    accessedOn: '2026-11-06',
    readScope:
      'Indexed manufacturer excerpts on RNA integrity, positive-control probe and drying artifact read.',
    limitations:
      'Full document was not retrieved in this research pass; scope limited to the retrieved excerpts.',
  },
  {
    id: 'leica-routine-troubleshoot',
    title: 'Troubleshooting routine histology: coverslipping',
    publisher: 'Leica Biosystems',
    url: 'https://www.leicabiosystems.com/sites/default/files/media_document-file/2023-06/211669_Rev_A_Knowledge_Pathway_Troubleshooting_Routine_Histology.pdf',
    access: 'read',
    onAscpReadingList: false,
    accessedOn: '2026-11-06',
    readScope:
      'Manufacturer PDF excerpts on medium viscosity, priming, coverslip dimensions and solvent compatibility read.',
    limitations:
      'Supports the scoped technical principle, not a universal approved protocol. Numerical exposures, product substitutions and clinical interpretation require the current method and qualified review.',
  },
  {
    id: 'leica-digital-slides',
    title: 'Digital-ready slides: coverslipping and focus',
    publisher: 'Leica Biosystems',
    url: 'https://www.leicabiosystems.com/sites/default/files/media_document-file/2022-01/211464_Rev_A_Digital_Ready_Slides%282%29.pdf',
    access: 'read',
    onAscpReadingList: false,
    accessedOn: '2026-11-06',
    readScope: 'Manufacturer PDF excerpt describing bubbles, focus and scanning artifacts read.',
    limitations:
      'Supports the scoped technical principle, not a universal approved protocol. Numerical exposures, product substitutions and clinical interpretation require the current method and qualified review.',
  },
  {
    id: 'leica-101-histology',
    title: '101 steps to better histology: reagent and mounting quality',
    publisher: 'Leica Biosystems',
    url: 'https://www.leicabiosystems.com/sites/default/files/media_document-file/2024-03/101_Steps_to_Better_Histology_Guid.pdf',
    access: 'read',
    onAscpReadingList: false,
    accessedOn: '2026-11-06',
    readScope:
      'Indexed manufacturer excerpts on hematoxylin drift, drying/corn-flaking and delayed mountant crystal formation read.',
    limitations:
      'Supports the scoped technical principle, not a universal approved protocol. Numerical exposures, product substitutions and clinical interpretation require the current method and qualified review.',
  },
  {
    id: 'leica-he-troubleshoot',
    title: 'H&E basics, part 4: troubleshooting',
    publisher: 'Leica Biosystems',
    url: 'https://www.leicabiosystems.com/knowledge-pathway/he-basics-part-4-troubleshooting-he/',
    access: 'read',
    onAscpReadingList: false,
    accessedOn: '2026-11-06',
    readScope:
      'Manufacturer text on water carryover, eosin extraction and frozen embedding-medium removal read.',
    limitations:
      'Supports the scoped technical principle, not a universal approved protocol. Numerical exposures, product substitutions and clinical interpretation require the current method and qualified review.',
  },
  {
    id: 'leica-he-webinar',
    title: 'How to create a high-quality H&E staining protocol',
    publisher: 'Leica Biosystems',
    url: 'https://www.leicabiosystems.com/educational-resources/webinars/how-to-create-a-high-quality-he-staining-protocol/',
    access: 'read',
    onAscpReadingList: false,
    accessedOn: '2026-11-06',
    readScope: 'Transcript excerpts on post-bluing washing, alkaline carryover and eosin pH read.',
    limitations:
      'Supports the scoped technical principle, not a universal approved protocol. Numerical exposures, product substitutions and clinical interpretation require the current method and qualified review.',
  },
  {
    id: 'leica-he-validation',
    title: 'Testing and validating H&E staining systems',
    publisher: 'Leica Biosystems',
    url: 'https://www.leicabiosystems.com/en-be/knowledge-pathway/validating-your-he-staining-systems/',
    access: 'read',
    onAscpReadingList: false,
    accessedOn: '2026-11-06',
    readScope:
      'Indexed manufacturer summary of representative tissues, system review and designated review/sign-off read.',
    limitations:
      'Supports the scoped technical principle, not a universal approved protocol. Numerical exposures, product substitutions and clinical interpretation require the current method and qualified review.',
  },
  {
    id: 'leica-he-fundamentals',
    title: 'Fundamentals of hematoxylin and eosin staining',
    publisher: 'Leica Biosystems',
    url: 'https://www.leicabiosystems.com/life-sciences-and-research-solutions/webinars/fundamentals-of-hematoxylin-and-eosin-staining/',
    access: 'read',
    onAscpReadingList: false,
    accessedOn: '2026-11-06',
    readScope:
      'Transcript excerpts on carryover, reagent checks and filtering to reduce particulates/floaters read.',
    limitations:
      'Supports the scoped technical principle, not a universal approved protocol. Numerical exposures, product substitutions and clinical interpretation require the current method and qualified review.',
  },
  {
    id: 'merck-pap',
    title: 'Papanicolaou stains, Procedure HT40, revision 10 (2025)',
    publisher: 'Merck / MilliporeSigma',
    url: 'https://www.sigmaaldrich.com/deepweb/assets/sigmaaldrich/product/documents/145/286/procedure-no-ht40-papanicolaou-staining-system-91896-ls-10-0-ms.pdf',
    access: 'read',
    onAscpReadingList: false,
    accessedOn: '2026-11-06',
    readScope:
      'English intended use, component roles, standard/rapid sequence and spray-fixative removal guidance read.',
    limitations:
      'Supports the scoped technical principle, not a universal approved protocol. Numerical exposures, product substitutions and clinical interpretation require the current method and qualified review.',
  },
  {
    id: 'merck-dpx',
    title: 'DPX new: optical specification and application',
    publisher: 'Merck / MilliporeSigma',
    url: 'https://www.sigmaaldrich.com/US/en/product/mm/100579',
    access: 'read',
    onAscpReadingList: false,
    accessedOn: '2026-11-06',
    readScope: 'Manufacturer product description and refractive-index specification read.',
    limitations:
      'Supports the scoped technical principle, not a universal approved protocol. Numerical exposures, product substitutions and clinical interpretation require the current method and qualified review.',
  },
  {
    id: 'merck-neomount',
    title: 'Neo-Mount: solvent compatibility',
    publisher: 'Merck / MilliporeSigma',
    url: 'https://www.sigmaaldrich.com/NA/en/product/mm/109016',
    access: 'read',
    onAscpReadingList: false,
    accessedOn: '2026-11-06',
    readScope:
      'Manufacturer description of required paired clearant and incompatibility with xylene read.',
    limitations:
      'Supports the scoped technical principle, not a universal approved protocol. Numerical exposures, product substitutions and clinical interpretation require the current method and qualified review.',
  },
  {
    id: 'merck-crystal-mount',
    title: 'Crystal Mount: chromogen and dye compatibility',
    publisher: 'Merck / MilliporeSigma',
    url: 'https://www.sigmaaldrich.com/deepweb/assets/sigmaaldrich/product/documents/268/871/c0612dat.pdf',
    access: 'read',
    onAscpReadingList: false,
    accessedOn: '2026-11-06',
    readScope:
      'Manufacturer data-sheet excerpt listing compatible and incompatible stains and chromogens read.',
    limitations:
      'Supports the scoped technical principle, not a universal approved protocol. Numerical exposures, product substitutions and clinical interpretation require the current method and qualified review.',
  },
]
