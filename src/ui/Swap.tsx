import type { ReactNode } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { useReducedMotion } from './prefs'

/**
 * Cross-fades between keyed content. With reduced motion it renders the new content
 * immediately, with no presence wrapper waiting on animation frames.
 */
export default function Swap({ id, children, as = 'div', x = 14, className, style, ...rest }: { id: string | number; children: ReactNode; as?: 'div' | 'section'; x?: number; className?: string; style?: React.CSSProperties } & Record<`aria-${string}`, string | undefined>) {
  const reduced = useReducedMotion()
  if (reduced) {
    const Tag = as
    return <Tag key={id} className={className} style={style} {...rest}>{children}</Tag>
  }
  const M = as === 'section' ? motion.section : motion.div
  return (
    <AnimatePresence mode="wait">
      <M key={id} className={className} style={style} {...rest} initial={{ opacity: 0, x }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -x }} transition={{ duration: 0.22 }}>
        {children}
      </M>
    </AnimatePresence>
  )
}
