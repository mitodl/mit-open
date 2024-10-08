"use client"

import React from "react"
import { getQueryClient } from "./getQueryClient"
import { QueryClientProvider } from "@tanstack/react-query"
import { ThemeProvider, NextJsAppRouterCacheProvider } from "ol-components"
import { Provider as NiceModalProvider } from "@ebay/nice-modal-react"
import ConfiguredPostHogProvider from "@/components/ConfiguredPostHogProvider/ConfiguredPostHogProvider"

export default function Providers({ children }: { children: React.ReactNode }) {
  const queryClient = getQueryClient()

  return (
    <ConfiguredPostHogProvider>
      <QueryClientProvider client={queryClient}>
        <NextJsAppRouterCacheProvider>
          <ThemeProvider>
            <NiceModalProvider>{children}</NiceModalProvider>
          </ThemeProvider>
        </NextJsAppRouterCacheProvider>
      </QueryClientProvider>
    </ConfiguredPostHogProvider>
  )
}
