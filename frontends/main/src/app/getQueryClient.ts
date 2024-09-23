// Based on https://tanstack.com/query/v5/docs/framework/react/guides/advanced-ssr

import { QueryClient, isServer } from "@tanstack/react-query"

type MaybeHasStatus = {
  response?: {
    status?: number
  }
}

const RETRY_STATUS_CODES = [408, 429, 502, 503, 504]
const MAX_RETRIES = 3

const makeQueryClient = (): QueryClient => {
  return new QueryClient({
    defaultOptions: {
      queries: {
        refetchOnWindowFocus: false,
        staleTime: Infinity,
        retry: (failureCount, error) => {
          const status = (error as MaybeHasStatus)?.response?.status
          /**
           * React Query's default behavior is to retry all failed queries 3
           * times. Many things (e.g., 403, 404) are not worth retrying. Let's
           * just retry some explicit whitelist of status codes.
           */
          if (status !== undefined && RETRY_STATUS_CODES.includes(status)) {
            return failureCount < MAX_RETRIES
          }
          return false
        },
      },
    },
  })
}

let browserQueryClient: QueryClient | undefined = undefined

function getQueryClient() {
  if (isServer) {
    // Server: always make a new query client
    return makeQueryClient()
  } else {
    // Browser: make a new query client if we don't already have one
    // This is very important, so we don't re-make a new client if React
    // suspends during the initial render. This may not be needed if we
    // have a suspense boundary BELOW the creation of the query client
    if (!browserQueryClient) browserQueryClient = makeQueryClient()
    return browserQueryClient
  }
}

export { makeQueryClient, getQueryClient }
