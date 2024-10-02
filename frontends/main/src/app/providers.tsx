"use client"

import React from "react"
import { getQueryClient } from "./getQueryClient"
import { QueryClientProvider } from "@tanstack/react-query"
import { ThemeProvider, NextJsAppRouterCacheProvider } from "ol-components"
import { Provider as NiceModalProvider } from "@ebay/nice-modal-react"
import { PostHogProvider } from "posthog-js/react"

export default function Providers({ children }: { children: React.ReactNode }) {
  const queryClient = getQueryClient()

  const apiKey = process.env.NEXT_PUBLIC_POSTHOG_PROJECT_API_KEY || ""
  const apiHost =
    process.env.NEXT_PUBLIC_POSTHOG_API_HOST || "https://us.i.posthog.com"
  const featureFlags = JSON.parse(process.env.FEATURE_FLAGS || "")

  const postHogOptions = {
    api_host: apiHost,
    bootstrap: {
      featureFlags: featureFlags,
    },
  }

  const interiorElements = (
    <QueryClientProvider client={queryClient}>
      <NextJsAppRouterCacheProvider>
        <ThemeProvider>
          <NiceModalProvider>{children}</NiceModalProvider>
        </ThemeProvider>
      </NextJsAppRouterCacheProvider>
    </QueryClientProvider>
  )

  return apiKey.length > 0 ? (
    <PostHogProvider apiKey={apiKey} options={postHogOptions}>
      {interiorElements}
    </PostHogProvider>
  ) : (
    interiorElements
  )
}
