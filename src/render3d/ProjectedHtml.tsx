import { useLayoutEffect, useRef, type ReactNode } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { useFrame, useThree } from '@react-three/fiber'
import { Vector3, type Group } from 'three'
import type { Vec3 } from './types'

/** DOM labels stay ordinary HTML. Deferred cleanup avoids nested-root unmount races in React 19. */
export default function ProjectedHtml({
  position,
  children,
  interactive = false,
}: {
  position: Vec3
  children: ReactNode
  interactive?: boolean
}) {
  const anchor = useRef<Group>(null)
  const host = useRef<HTMLDivElement | null>(null)
  const root = useRef<Root | null>(null)
  const point = useRef(new Vector3())
  const { gl, camera, size, invalidate } = useThree()
  useLayoutEffect(() => {
    const element = document.createElement('div')
    element.className = 'scene-projected-label'
    element.style.position = 'absolute'
    element.style.left = '0'
    element.style.top = '0'
    element.style.pointerEvents = interactive ? 'auto' : 'none'
    element.style.zIndex = '10'
    element.style.visibility = 'hidden'
    gl.domElement.parentElement?.appendChild(element)
    const mountedRoot = createRoot(element)
    host.current = element
    root.current = mountedRoot
    invalidate()
    return () => {
      host.current = null
      root.current = null
      // R3F may be committing a different React root. Defer this separate DOM root's teardown.
      queueMicrotask(() => {
        mountedRoot.unmount()
        element.remove()
      })
    }
  }, [gl, interactive, invalidate])
  useLayoutEffect(() => {
    root.current?.render(children)
    invalidate()
    const frame = requestAnimationFrame(() => invalidate())
    return () => cancelAnimationFrame(frame)
  }, [children, invalidate])
  useFrame(() => {
    if (!anchor.current || !host.current) return
    anchor.current.getWorldPosition(point.current)
    point.current.project(camera)
    const visible =
      point.current.z > -1 &&
      point.current.z < 1 &&
      Math.abs(point.current.x) < 1.1 &&
      Math.abs(point.current.y) < 1.1
    host.current.style.visibility = visible ? 'visible' : 'hidden'
    // Keep the complete label readable near a viewport edge, including narrow touch views.
    const halfWidth = host.current.offsetWidth / 2 + 4
    const halfHeight = host.current.offsetHeight / 2 + 4
    const x = Math.max(
      halfWidth,
      Math.min(size.width - halfWidth, (point.current.x * 0.5 + 0.5) * size.width),
    )
    const y = Math.max(
      halfHeight,
      Math.min(size.height - halfHeight, (-point.current.y * 0.5 + 0.5) * size.height),
    )
    host.current.style.transform = `translate(${x}px, ${y}px) translate(-50%, -50%)`
  })
  return <group ref={anchor} position={position} />
}
