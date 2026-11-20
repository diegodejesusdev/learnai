import { createBrowserRouter } from 'react-router'
import { RouterProvider } from 'react-router/dom'
import { Providers } from './Providers'
import { routes } from './routes'
import { UpdatePrompt } from './UpdatePrompt'

const router = createBrowserRouter(routes)

export function App() {
  return (
    <Providers>
      <RouterProvider router={router} />
      <UpdatePrompt />
    </Providers>
  )
}
