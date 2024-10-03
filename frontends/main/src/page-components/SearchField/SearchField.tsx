import React from "react"
import { SearchInput } from "ol-components"
import type { SearchInputProps, SearchSubmissionEvent } from "ol-components"
import { usePostHog } from "posthog-js/react"

type SearchFieldProps = SearchInputProps & {
  onSubmit: (event: SearchSubmissionEvent) => void
  setPage: (page: number) => void
}

/**
 * A wrapper around SearchInput that handles a little application logic like
 * - resetting search page to 1 on submission
 * - firing tracking events
 */
const SearchField: React.FC<SearchFieldProps> = ({
  onSubmit,
  setPage,
  ...others
}) => {
  const posthog = usePostHog()
  const handleSubmit: SearchInputProps["onSubmit"] = (
    event,
    { isEnter } = {},
  ) => {
    onSubmit(event)
    setPage(1)
    if (process.env.NEXT_PUBLIC_POSTHOG_PROJECT_API_KEY) {
      posthog.capture("search_update", { isEnter: isEnter })
    }
  }

  return <SearchInput onSubmit={handleSubmit} {...others} />
}

export { SearchField }
