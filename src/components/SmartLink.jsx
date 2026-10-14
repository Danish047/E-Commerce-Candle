import { Link } from 'react-router-dom'

// Internal paths use the router, full URLs open in a new tab.
export default function SmartLink({ to, children, ...props }) {
  if (!to) return <span {...props}>{children}</span>
  if (/^https?:\/\//.test(to)) return <a href={to} target="_blank" rel="noreferrer" {...props}>{children}</a>
  return <Link to={to} {...props}>{children}</Link>
}
