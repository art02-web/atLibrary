import { useState } from 'react'

const COLORS = ['#5a81fa', '#2c3d8f', '#3f63d8', '#7c9bfb', '#4a5bb5', '#6a6f83', '#1f3a93', '#8fa8fc']
const colorFor = (text = '') => COLORS[[...text].reduce((s, c) => s + c.charCodeAt(0), 0) % COLORS.length]

// Shows the cover image, or a colored placeholder when there is none / it fails to load
export default function BookCover({ book, small = false }) {
  const [failed, setFailed] = useState(false)
  const showImage = book?.coverImage && !failed
  const bg = colorFor(book?.title)

  return (
    <div className={`at-cover ${small ? 'at-cover-sm' : ''}`} style={showImage ? undefined : { background: bg }}>
      {showImage ? (
        <img
          src={book.coverImage}
          alt={`Cover of ${book.title}`}
          loading="lazy"
          onError={() => setFailed(true)}
          onLoad={(e) => {
            // Open Library returns a 1x1 image when it has no cover
            if (e.currentTarget.naturalWidth < 10) setFailed(true)
          }}
        />
      ) : (
        <div className="at-cover-fallback" style={{ background: `linear-gradient(160deg, ${bg}, #1f1f1fcc)` }}>
          {small ? (
            <i className="bi bi-book" />
          ) : (
            <>
              <i className="bi bi-book fs-3 mb-auto opacity-75" />
              <span style={{ fontSize: '0.95rem' }}>{book?.title}</span>
              <small className="fw-normal opacity-75">{book?.author}</small>
            </>
          )}
        </div>
      )}
    </div>
  )
}
