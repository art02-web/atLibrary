import { useEffect, useState } from 'react'

// Delays a fast-changing value (like a search box) so we don't call the API on every keystroke
export default function useDebounce(value, delay = 400) {
  const [debounced, setDebounced] = useState(value)
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay)
    return () => clearTimeout(t)
  }, [value, delay])
  return debounced
}
