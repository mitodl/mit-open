import React, { useEffect } from "react"

import { usePostHog } from "posthog-js/react"

import type { LearningResource } from "api"
import { RoutedDrawer } from "ol-components"
import type { RoutedDrawerProps } from "ol-components"

const PostHogView: React.FC<RoutedDrawerProps> = <
  K extends string,
  R extends K = K,
>(
  props: RoutedDrawerProps<K, R>,
) => {
  const { posthog: posthogSettings } = window.SETTINGS
  const posthog = usePostHog()

  const hndOnView = async (params: readonly K[]) => {
    /*
        Notes to self: this seems like a reliable way to both use the posthog provider
        and also async hit the thing, so we need to now load the data about the resource
        from the query client and hit the pageview event
        */
    const ourParams = params as Record<K, string>

    if (posthogSettings?.enabled) {
      console.log("our resource is", params)
      posthog.capture("lrd_view", {
        resourceId: ourParams["resource"] || "unknown",
      })
    }
  }

  return <RoutedDrawer {...props} onView={hndOnView} />
}

export default PostHogView
