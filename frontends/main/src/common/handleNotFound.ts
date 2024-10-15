import type { AxiosError } from "axios"
import { notFound } from "next/navigation"

/* This is intended to wrap API calls that fetch resources during server render,
 * such as to gather metadata for the learning resource drawer.
 *
 * The ./app/global-error.tsx boundary for root layout errors is only supplied the
 * error message so we cannot determine that it is a 404 to show the NotFoundPage.
 * Instead we must handle at each point of use so need a utility function. Below we
 * use next/navigation's notFound() to render ./app/not-found.tsx
 */

const handleNotFound = async <T>(promise: Promise<T | never>): Promise<T> => {
  try {
    return await promise
  } catch (error) {
    if ((error as AxiosError).status === 404) {
      return notFound()
    }
    throw error
  }
}

export default handleNotFound
