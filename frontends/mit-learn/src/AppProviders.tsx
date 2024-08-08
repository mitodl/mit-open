import React, { StrictMode } from "react"
import { HelmetProvider } from "react-helmet-async"
import { RouterProvider } from "react-router-dom"
import type { RouterProviderProps } from "react-router-dom"
import { QueryClientProvider, QueryClient } from "@tanstack/react-query"
import { ReactQueryDevtools } from "@tanstack/react-query-devtools"
import { Provider as NiceModalProvider } from "@ebay/nice-modal-react"
import { ThemeProvider } from "ol-components"
import GlobalStyles from "./GlobalStyles"
import { PostHogProvider } from "posthog-js/react"
import type { PostHogSettings } from "./types/settings"

interface AppProps {
  router: RouterProviderProps["router"]
  queryClient: QueryClient
}

/**
 * Renders child with Router, QueryClientProvider, and other such context provides.
 */
const AppProviders: React.FC<AppProps> = ({ router, queryClient }) => {
  const { POSTHOG } = APP_SETTINGS

  const phSettings: PostHogSettings = POSTHOG?.api_key?.length
    ? POSTHOG
    : {
        api_key: "",
      }

  const phOptions = {
    feature_flag_request_timeout_ms: phSettings.timeout || 3000,
    bootstrap: {
      featureFlags: phSettings.bootstrap_flags,
    },
  }

  const interiorElements = (
    <ThemeProvider>
      <GlobalStyles />
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
  )

  return phSettings.api_key.length > 0 ? (
    <StrictMode>
      <PostHogProvider apiKey={phSettings.api_key} options={phOptions}>
        {interiorElements}
      </PostHogProvider>
    </StrictMode>
  ) : (
    <StrictMode>{interiorElements}</StrictMode>
  )
}

export default AppProviders
