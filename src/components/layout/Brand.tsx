import { Link } from 'react-router'

export function Logo({ className = 'size-8' }: { className?: string }) {
  return (
    <svg viewBox="0 0 64 64" className={className} aria-hidden="true">
      <rect width="64" height="64" rx="14" className="fill-accent" />
      <path
        d="M19 45c0-11 26-15 26-26"
        fill="none"
        strokeWidth="4.5"
        strokeLinecap="round"
        className="stroke-accent-fg"
      />
      <circle cx="19" cy="45" r="5.5" className="fill-accent-fg" />
      <circle cx="45" cy="19" r="7" className="fill-accent-soft stroke-accent-fg" strokeWidth="3" />
    </svg>
  )
}

export function Brand() {
  return (
    <Link
      to="/"
      className="flex min-h-11 items-center gap-2 rounded-xl text-lg font-semibold tracking-tight"
    >
      <Logo />
      LearnAI
    </Link>
  )
}
