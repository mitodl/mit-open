import React from "react"
import { PostHogProvider } from "posthog-js/react"

const ConfiguredPostHogProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const apiKey = process.env.NEXT_PUBLIC_POSTHOG_API_KEY || ""
  const apiHost =
    process.env.NEXT_PUBLIC_POSTHOG_API_HOST || "https://us.i.posthog.com"
  const featureFlags = JSON.parse(process.env.FEATURE_FLAGS || "")

  const postHogOptions = {
    api_host: apiHost,
    bootstrap: {
      featureFlags: featureFlags,
    },
  }

  return apiKey ? (
    <PostHogProvider apiKey={apiKey} options={postHogOptions}>
      {children}
    </PostHogProvider>
  ) : (
    children
  )
}

export default ConfiguredPostHogProvider
