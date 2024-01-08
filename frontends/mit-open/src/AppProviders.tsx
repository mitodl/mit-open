import React, { StrictMode } from "react"
import { HelmetProvider } from "react-helmet-async"
import { RouterProvider } from "react-router-dom"
import type { RouterProviderProps } from "react-router-dom"
import { QueryClientProvider, QueryClient } from "@tanstack/react-query"
import { Provider as NiceModalProvider } from "@ebay/nice-modal-react"
import { ThemeProvider } from "ol-components"

interface AppProps {
  router: RouterProviderProps["router"]
  queryClient: QueryClient
}

/**
 * Renders child with Router, QueryClientProvider, and other such context provides.
 */
const AppProviders: React.FC<AppProps> = ({ router, queryClient }) => {
  return (
    <StrictMode>
      <ThemeProvider>
        <QueryClientProvider client={queryClient}>
          <HelmetProvider>
            <NiceModalProvider>
              <RouterProvider router={router} />
            </NiceModalProvider>
          </HelmetProvider>
        </QueryClientProvider>
      </ThemeProvider>
    </StrictMode>
  )
}

export default AppProviders
