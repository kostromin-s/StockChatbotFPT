import { useState, useCallback, useRef, useEffect } from 'react'

export function useResizable({ initial = 400, min = 280, max = 700 } = {}) {
  const [size, setSize] = useState(initial)
  const isDragging = useRef(false)
  const startX = useRef(0)
  const startSize = useRef(0)

  const onMouseDown = useCallback((e) => {
    isDragging.current = true
    startX.current = e.clientX
    startSize.current = size
    document.body.style.cursor = 'col-resize'
    document.body.style.userSelect = 'none'
  }, [size])

  useEffect(() => {
    const onMouseMove = (e) => {
      if (!isDragging.current) return
      const delta = startX.current - e.clientX
      const next = Math.min(max, Math.max(min, startSize.current + delta))
      setSize(next)
    }
    const onMouseUp = () => {
      if (isDragging.current) {
        isDragging.current = false
        document.body.style.cursor = ''
        document.body.style.userSelect = ''
      }
    }
    window.addEventListener('mousemove', onMouseMove)
    window.addEventListener('mouseup', onMouseUp)
    return () => {
      window.removeEventListener('mousemove', onMouseMove)
      window.removeEventListener('mouseup', onMouseUp)
    }
  }, [min, max])

  return { size, onMouseDown }
}
