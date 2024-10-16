import { QueryClient } from "@tanstack/react-query"
import axios from "@/services/axios"

type MaybeHasStatus = {
  response?: {
    status?: number
  }
}

const RETRY_STATUS_CODES = [408, 429, 502, 503, 504]
const MAX_RETRIES = 3

const THROW_ERROR_CODES: (number | undefined)[] = [404, 403, 401]

const createQueryClient = (): QueryClient => {
  return new QueryClient({
    defaultOptions: {
      queries: {
        refetchOnWindowFocus: false,
        staleTime: Infinity,
        queryFn: async ({ queryKey }) => {
          const url = queryKey[0]
          if (typeof url !== "string" || queryKey.length !== 1) {
            throw new Error(
              "Query key must be a single string for use with default queryFn",
            )
          }
          const { data } = await axios.get(url)
          return data
        },
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
        // Throw runtime errors instead of marking query as errored.
        // The runtime error will be caught by an error boundary.
        // For now, only do this for 404s, 403s, and 401s. Other errors should
        // be handled locally by components.
        useErrorBoundary: (error) => {
          const status = (error as MaybeHasStatus)?.response?.status
          return THROW_ERROR_CODES.includes(status)
        },
      },
    },
  })
}

export { createQueryClient }
