import React from "react"
import getQueryClient from "./getQueryClient"
import { QueryClientProvider } from 'api/ssr'

export default function Providers({ children }: { children: React.ReactNode }) {
  const queryClient = getQueryClient()

  return (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  )
}