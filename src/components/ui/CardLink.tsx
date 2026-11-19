import { Link, type LinkProps } from 'react-router'
import { cardClasses } from './styles'

/** Tarjeta completa que se puede tocar para navegar. */
export function CardLink({ className, ...props }: LinkProps) {
  return <Link className={cardClasses(true, className)} {...props} />
}
