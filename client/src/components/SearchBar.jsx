import { Form } from 'react-bootstrap'

export default function SearchBar({ value, onChange, placeholder = 'Search...', className = '' }) {
  return (
    <div className={`search-input ${className}`}>
      <i className="bi bi-search" />
      <Form.Control
        type="search"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        aria-label={placeholder}
        maxLength={100}
      />
    </div>
  )
}
