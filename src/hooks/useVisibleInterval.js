import { useEffect, useRef } from 'react'

export function useVisibleInterval(callback, delay) {
  const savedCallback = useRef(callback)
  savedCallback.current = callback

  useEffect(() => {
    if (!delay) return
    let id

    function start() {
      clearInterval(id)
      id = setInterval(() => savedCallback.current(), delay)
    }

    function onVisibility() {
      if (document.hidden) {
        clearInterval(id)
      } else {
        start()
      }
    }

    start()
    document.addEventListener('visibilitychange', onVisibility)
    return () => {
      clearInterval(id)
      document.removeEventListener('visibilitychange', onVisibility)
    }
  }, [delay])
}
