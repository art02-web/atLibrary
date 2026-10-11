import { useState } from 'react'
import { initials } from '../utils/format'

// A user's profile picture, or their initials when they have none (or it fails to load)
export default function Avatar({ user, src, size = '', className = '' }) {
  const url = src ?? user?.avatarUrl
  const [failedUrl, setFailedUrl] = useState(null)
  return (
    <span className={`at-avatar ${size} ${className}`} style={{ borderRadius: '50%' }}>
      {url && url !== failedUrl ? (
        <img src={url} alt="" onError={() => setFailedUrl(url)} />
      ) : (
        initials(user?.name)
      )}
    </span>
  )
}
