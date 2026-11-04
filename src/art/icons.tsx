import type { SVGProps } from 'react'

const base = { width: 22, height: 22, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 1.7, strokeLinecap: 'round', strokeLinejoin: 'round', 'aria-hidden': true } as const

export const IconToday = (p: SVGProps<SVGSVGElement>) => (
  <svg {...base} {...p}><rect x="3" y="8" width="18" height="8" rx="1.5" /><path d="M8 8v8" /><circle cx="14.5" cy="12" r="2" /></svg>
)
export const IconLearn = (p: SVGProps<SVGSVGElement>) => (
  <svg {...base} {...p}><path d="M4 5.5C6.5 4.5 9.5 4.5 12 6c2.5-1.5 5.5-1.5 8-.5V19c-2.5-1-5.5-1-8 .5-2.5-1.5-5.5-1.5-8-.5z" /><path d="M12 6v13.5" /></svg>
)
export const IconLab = (p: SVGProps<SVGSVGElement>) => (
  <svg {...base} {...p}><path d="M9 3h6M10 3v6l-5 9a2 2 0 0 0 1.7 3h10.6A2 2 0 0 0 19 18l-5-9V3" /><path d="M7.5 14h9" /></svg>
)
export const IconPractice = (p: SVGProps<SVGSVGElement>) => (
  <svg {...base} {...p}><circle cx="12" cy="12" r="8.5" /><path d="M8.5 12.2l2.4 2.4 4.8-5" /></svg>
)
export const IconProgress = (p: SVGProps<SVGSVGElement>) => (
  <svg {...base} {...p}><path d="M4 20V10M10 20V4M16 20v-7M22 20H2" /></svg>
)
export const IconAtlas = (p: SVGProps<SVGSVGElement>) => (
  <svg {...base} {...p}><circle cx="11" cy="11" r="6.5" /><path d="M20 20l-4.3-4.3" /></svg>
)
export const IconRoute = (p: SVGProps<SVGSVGElement>) => (
  <svg {...base} {...p}><path d="M6 3h9l3 3v15H6z" /><path d="M9 11h6M9 15h6M9 7h3" /></svg>
)
export const IconSettings = (p: SVGProps<SVGSVGElement>) => (
  <svg {...base} {...p}><circle cx="12" cy="12" r="3" /><path d="M12 2.5v3M12 18.5v3M2.5 12h3M18.5 12h3M5.3 5.3l2.1 2.1M16.6 16.6l2.1 2.1M5.3 18.7l2.1-2.1M16.6 7.4l2.1-2.1" /></svg>
)
export const IconFlag = (p: SVGProps<SVGSVGElement>) => (
  <svg {...base} {...p}><path d="M5 21V4M5 4h11l-2 4 2 4H5" /></svg>
)
export const IconUp = (p: SVGProps<SVGSVGElement>) => (
  <svg {...base} width={18} height={18} {...p}><path d="M6 15l6-6 6 6" /></svg>
)
export const IconDown = (p: SVGProps<SVGSVGElement>) => (
  <svg {...base} width={18} height={18} {...p}><path d="M6 9l6 6 6-6" /></svg>
)
export const IconRotate = (p: SVGProps<SVGSVGElement>) => (
  <svg {...base} width={18} height={18} {...p}><path d="M20 11a8 8 0 1 0-2.3 5.7" /><path d="M20 4v7h-7" /></svg>
)
export const IconCheck = (p: SVGProps<SVGSVGElement>) => (
  <svg {...base} width={18} height={18} {...p}><path d="M5 12.5l4.5 4.5L19 7.5" /></svg>
)
