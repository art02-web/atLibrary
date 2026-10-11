import { Link } from 'react-router-dom'

// The app logo and name, used in the sidebar, landing page and login/sign-up pages.
// To change the logo, replace client/public/logo.svg (it is also the browser tab icon).
// To change the name, edit BRAND_NAME / BRAND_ACCENT below and <title> in client/index.html.
const LOGO_SRC = '/logo.svg'
const BRAND_ACCENT = 'at' // highlighted in the primary color
const BRAND_NAME = 'Library'

export default function Brand({ to = '/', light = false }) {
  return (
    <Link to={to} className={`at-brand d-inline-flex align-items-center gap-2 ${light ? 'text-white' : ''}`}>
      <img src={LOGO_SRC} alt="" className="logo" />
      <span>
        <span className={light ? '' : 'at'}>{BRAND_ACCENT}</span>{BRAND_NAME}
      </span>
    </Link>
  )
}
