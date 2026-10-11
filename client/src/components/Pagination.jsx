import { Pagination as BsPagination } from 'react-bootstrap'

// Numbered pagination with ellipsis, driven by the API's pagination block
export default function Pagination({ pagination, onChange }) {
  if (!pagination || pagination.pages <= 1) return null
  const { page, pages, total, limit } = pagination

  const nums = []
  for (let i = 1; i <= pages; i++) {
    if (i === 1 || i === pages || Math.abs(i - page) <= 1) nums.push(i)
    else if (nums[nums.length - 1] !== '…') nums.push('…')
  }
  const from = (page - 1) * limit + 1
  const to = Math.min(page * limit, total)

  return (
    <div className="d-flex flex-wrap align-items-center justify-content-between gap-2 mt-3">
      <small className="text-muted">
        Showing {from}–{to} of {total}
      </small>
      <BsPagination className="mb-0" size="sm">
        <BsPagination.Prev disabled={page === 1} onClick={() => onChange(page - 1)} />
        {nums.map((n, i) =>
          n === '…' ? (
            <BsPagination.Ellipsis key={`e${i}`} disabled />
          ) : (
            <BsPagination.Item key={n} active={n === page} onClick={() => onChange(n)}>
              {n}
            </BsPagination.Item>
          ),
        )}
        <BsPagination.Next disabled={page === pages} onClick={() => onChange(page + 1)} />
      </BsPagination>
    </div>
  )
}
