import { Link } from 'react-router'
import { cn } from '@/lib/cn'

/** «LearnAI» con «AI» en un bloque vinotinto. Va sobre negro o sobre vinotinto. */
export function Wordmark({ className }: { className?: string }) {
  return (
    <span className={cn('inline-flex items-center font-extrabold tracking-tighter', className)}>
      Learn
      <span className="ml-[0.08em] bg-hero-fg px-[0.18em] text-hero">AI</span>
    </span>
  )
}

export function Brand() {
  return (
    <Link to="/" className="flex min-h-11 items-center text-2xl leading-none">
      <Wordmark />
    </Link>
  )
}
