import React, { StrictMode } from "react"
import { createRoot } from "react-dom/client"
import { HelmetProvider } from "react-helmet-async"
import { createBrowserRouter, RouterProvider } from "react-router-dom"
import type { RouterProviderProps } from "react-router-dom"
import invariant from "tiny-invariant"
import * as Sentry from "@sentry/react"
import { QueryClientProvider, QueryClient } from "@tanstack/react-query"
import { ReactQueryDevtools } from "@tanstack/react-query-devtools"
import { Provider as NiceModalProvider } from "@ebay/nice-modal-react"
import { ThemeProvider } from "ol-components"
import { createQueryClient } from "services/react-query/react-query"
import routes from "common/routes"

Sentry.init({
  dsn: window.SETTINGS.sentry_dsn,
  release: window.SETTINGS.release_version,
  environment: window.SETTINGS.environment,
})

const container = document.getElementById("app-container")
invariant(container, "Could not find container element")

const root = createRoot(container)
const router = createBrowserRouter(routes)
const queryClient = createQueryClient()

interface AppProps {
  router: RouterProviderProps["router"]
  queryClient: QueryClient
}

/**
 * Renders child with Router, QueryClientProvider, and other such context provides.
 */
const App: React.FC<AppProps> = ({ router, queryClient }) => {
  return (
    <StrictMode>
      <ThemeProvider>
        <QueryClientProvider client={queryClient}>
          <HelmetProvider>
            <NiceModalProvider>
              <RouterProvider router={router} />
            </NiceModalProvider>
          </HelmetProvider>
          <ReactQueryDevtools
            initialIsOpen={false}
            toggleButtonProps={{ style: { opacity: 0.5 } }}
          />
        </QueryClientProvider>
      </ThemeProvider>
    </StrictMode>
  )
}

root.render(<App queryClient={queryClient} router={router} />)

export default App
