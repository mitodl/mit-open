import React, { StrictMode } from "react"
import { HelmetProvider } from "react-helmet-async"
import { QueryClientProvider, QueryClient } from "@tanstack/react-query"
import { ReactQueryDevtools } from "@tanstack/react-query-devtools"
import { Provider as NiceModalProvider } from "@ebay/nice-modal-react"
import { ThemeProvider } from "ol-components"
import GlobalStyles from "./GlobalStyles"
import { PostHogProvider } from "posthog-js/react"

import type { PostHogSettings } from "./types/settings"

interface ExportedComponentProps {
  queryClient: QueryClient
}

/**
 * Renders child with Router, QueryClientProvider, and other such context provides.
 */
const ExportedComponentProviders: React.FC<ExportedComponentProps> = ({
  queryClient,
}) => {
  const phSettings: PostHogSettings = APP_SETTINGS.posthog?.enabled
    ? APP_SETTINGS.posthog
    : {
        api_key: "",
        enabled: false,
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
          <NiceModalProvider></NiceModalProvider>
        </HelmetProvider>
        <ReactQueryDevtools
          initialIsOpen={false}
          toggleButtonProps={{ style: { opacity: 0.5 } }}
        />
      </QueryClientProvider>
    </ThemeProvider>
  )

  return phSettings.enabled ? (
    <StrictMode>
      <PostHogProvider apiKey={phSettings.api_key} options={phOptions}>
        {interiorElements}
      </PostHogProvider>
    </StrictMode>
  ) : (
    <StrictMode>{interiorElements}</StrictMode>
  )
}

export default ExportedComponentProviders
