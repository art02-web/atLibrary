import { useState } from 'react'
import { borrowApi } from '../api/services'
import { errorMessage } from '../api/axios'

// Shared "request to borrow" action used by the catalog and the book details page.
// The result is shown in place with <Notice> (no pop-ups).
export default function useBorrow(onDone) {
  const [busyId, setBusyId] = useState(null)
  const [notice, setNotice] = useState(null) // { variant, message }

  const requestBorrow = async (book) => {
    setBusyId(book._id)
    setNotice(null)
    try {
      await borrowApi.request(book._id)
      setNotice({ variant: 'success', message: `Request sent for "${book.title}". Follow it in My Borrowings.` })
      onDone?.()
    } catch (err) {
      setNotice({ variant: 'danger', message: errorMessage(err) })
    } finally {
      setBusyId(null)
    }
  }

  return { requestBorrow, busyId, notice, clearNotice: () => setNotice(null) }
}
