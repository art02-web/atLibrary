import { useCallback, useEffect, useState } from 'react'
import { Col, Form, Row } from 'react-bootstrap'
import { useSearchParams } from 'react-router-dom'
import { bookApi } from '../../api/services'
import { errorMessage } from '../../api/axios'
import { useAuth } from '../../context/AuthContext'
import useDebounce from '../../hooks/useDebounce'
import Notice from '../../components/Notice'
import useBorrow from '../../hooks/useBorrow'
import PageHeader from '../../components/PageHeader'
import SearchBar from '../../components/SearchBar'
import BookCard from '../../components/BookCard'
import Pagination from '../../components/Pagination'
import Loader from '../../components/Loader'
import EmptyState from '../../components/EmptyState'

export default function BrowseBooks() {
  const { isAdmin } = useAuth()
  const [params, setParams] = useSearchParams()
  const [search, setSearch] = useState(params.get('search') || '')
  const [category, setCategory] = useState('')
  const [onlyAvailable, setOnlyAvailable] = useState(false)
  const [sort, setSort] = useState('newest')
  const [page, setPage] = useState(1)
  const [categories, setCategories] = useState([])
  const [data, setData] = useState({ books: [], pagination: null })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const debounced = useDebounce(search)

  const load = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const res = await bookApi.list({
        search: debounced, category, available: onlyAvailable || undefined, sort, page, limit: 12,
      })
      setData(res.data)
    } catch (err) {
      setError(errorMessage(err))
    } finally {
      setLoading(false)
    }
  }, [debounced, category, onlyAvailable, sort, page])

  const { requestBorrow, busyId, notice, clearNotice } = useBorrow(load)

  useEffect(() => {
    bookApi.categories().then(({ data }) => setCategories(data.categories)).catch(() => {})
  }, [])

  useEffect(() => {
    load()
  }, [load])

  // New search text: go back to page 1 and keep ?search= in the URL
  useEffect(() => {
    setPage(1)
    setParams(debounced ? { search: debounced } : {}, { replace: true })
  }, [debounced, setParams])

  // Changing a filter also resets to page 1
  const withReset = (setter) => (value) => {
    setter(value)
    setPage(1)
  }

  return (
    <>
      <PageHeader title="Browse Books" subtitle="Find your next read and send a borrow request." />
      <Notice message={notice?.message} variant={notice?.variant} onClose={clearNotice} />

      <div className="at-card p-3 mb-4">
        <Row className="g-2 align-items-center">
          <Col md={6}>
            <SearchBar value={search} onChange={setSearch} placeholder="Search by title, author, ISBN or publisher" />
          </Col>
          <Col xs={7} md={3}>
            <Form.Select value={sort} onChange={(e) => withReset(setSort)(e.target.value)} aria-label="Sort books">
              <option value="newest">Newest added</option>
              <option value="title">Title A–Z</option>
              <option value="author">Author A–Z</option>
              <option value="year">Publication year</option>
            </Form.Select>
          </Col>
          <Col xs={5} md={3}>
            <Form.Check
              type="switch" id="onlyAvailable" label="Available only"
              checked={onlyAvailable} onChange={(e) => withReset(setOnlyAvailable)(e.target.checked)}
            />
          </Col>
        </Row>
        <div className="chips mt-3">
          <button className={`chip ${category === '' ? 'active' : ''}`} onClick={() => withReset(setCategory)('')}>All</button>
          {categories.map((c) => (
            <button key={c} className={`chip ${category === c ? 'active' : ''}`} onClick={() => withReset(setCategory)(c)}>
              {c}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <Loader />
      ) : error ? (
        <EmptyState icon="bi-wifi-off" title="Could not load books" text={error} />
      ) : data.books.length === 0 ? (
        <div className="at-card">
          {debounced || category || onlyAvailable ? (
            <EmptyState icon="bi-search" title="No books found" text="Try a different search or category." />
          ) : (
            <EmptyState icon="bi-book" title="The catalog is empty" text="No books have been added yet. Check back soon." />
          )}
        </div>
      ) : (
        <>
          <Row className="g-3">
            {data.books.map((b) => (
              <Col key={b._id} xs={6} md={4} lg={3} xxl={2}>
                <BookCard book={b} canBorrow={!isAdmin} busy={busyId === b._id} onBorrow={requestBorrow} />
              </Col>
            ))}
          </Row>
          <Pagination pagination={data.pagination} onChange={setPage} />
        </>
      )}
    </>
  )
}
