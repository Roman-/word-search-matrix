import { useEffect, useState } from 'react'

const MIN_PREVIEW_HEIGHT = 240

const calculateBounds = (verticalPadding) => {
  if (typeof window === 'undefined') {
    return { maxHeight: undefined }
  }
  const header = typeof document !== 'undefined' ? document.querySelector('header') : null
  const headerHeight = header?.getBoundingClientRect().height ?? 0
  const viewportHeight = window.innerHeight ?? 0
  const availableHeight = Math.max(
    MIN_PREVIEW_HEIGHT,
    viewportHeight - headerHeight - verticalPadding
  )
  return { maxHeight: availableHeight }
}

export const usePreviewBounds = ({ verticalPadding = 64 } = {}) => {
  const [bounds, setBounds] = useState(() => calculateBounds(verticalPadding))

  useEffect(() => {
    if (typeof window === 'undefined') {
      return undefined
    }

    let frame = null

    const update = () => {
      setBounds(calculateBounds(verticalPadding))
    }

    const scheduleUpdate = () => {
      if (frame) {
        window.cancelAnimationFrame(frame)
      }
      frame = window.requestAnimationFrame(update)
    }

    scheduleUpdate()

    window.addEventListener('resize', scheduleUpdate)
    window.addEventListener('orientationchange', scheduleUpdate)

    return () => {
      if (frame) {
        window.cancelAnimationFrame(frame)
      }
      window.removeEventListener('resize', scheduleUpdate)
      window.removeEventListener('orientationchange', scheduleUpdate)
    }
  }, [verticalPadding])

  return bounds
}

export default usePreviewBounds
