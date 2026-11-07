import { teachingParameter } from './registry'
const rows: [string, number, string, string][] = [
  ['ish.hybridization-time',30,'simulation minute','Synthetic hybridization exposure scale'],
  ['ish.temperature',40,'°C','Synthetic target temperature, not an assay protocol'],
  ['ish.temperature-width',20,'°C','Teaching temperature compatibility width'],
  ['ish.protease',1,'relative exposure','Synthetic access optimum'],
  ['ish.stringency',1,'relative exposure','Synthetic wash specificity optimum'],
  ['ish.signal',2,'OD','Synthetic signal scale'],
  ['ish.background',.3,'OD','Synthetic nonspecific probe signal'],
  ['ish.positive-min',.3,'OD','Educational positive-control threshold'],
  ['ish.background-max',.2,'OD','Educational negative-control threshold'],
]
export const MOLECULAR_PARAMETERS = rows.map(([id,value,unit,note]) => teachingParameter(id,value,unit,'Illustrative ISH response only',note))
export const MOLECULAR = Object.fromEntries(MOLECULAR_PARAMETERS.map(p => [p.id,p.value as number]))
