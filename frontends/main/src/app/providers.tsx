"use client"

import React from "react"
import { getQueryClient } from "./getQueryClient"
import { QueryClientProvider } from "api/ssr"
import { ThemeProvider, NextJsAppRouterCacheProvider } from "ol-components"
import { Provider as NiceModalProvider } from "@ebay/nice-modal-react"

export default function Providers({ children }: { children: React.ReactNode }) {
  const queryClient = getQueryClient()

  return (
    <QueryClientProvider client={queryClient}>
      <NextJsAppRouterCacheProvider>
        <ThemeProvider>
          <NiceModalProvider>{children}</NiceModalProvider>
        </ThemeProvider>
      </NextJsAppRouterCacheProvider>
    </QueryClientProvider>
  )
}
