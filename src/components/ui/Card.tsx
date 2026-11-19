import type { HTMLAttributes } from 'react'
import { cardClasses } from './styles'

export function Card({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={cardClasses(false, className)} {...props} />
}
