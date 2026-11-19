import '@testing-library/jest-dom/vitest'
import { cleanup } from '@testing-library/react'
import { afterEach } from 'vitest'

// jsdom no implementa scrollTo (lo usa ScrollRestoration de React Router).
window.scrollTo = () => {}

afterEach(() => {
  cleanup()
})
