import React from "react"
import { useFeatureFlagEnabled } from "posthog-js/react"
import { ForbiddenError } from "@/common/permissions"
import { FeatureFlags } from "@/common/feature_flags"

type EcommerceFeatureProps = {
  children: React.ReactNode
}

/**
 * Simple wrapper to standardize the feature flag check for ecommerce UI pages.
 * If the flag is enabled, display the children; if not, throw a ForbiddenError
 * like you'd get for an unauthenticated route.
 *
 * There's a PostHogFeature component that is provided but went this route
 * because it seemed to be inconsistent - sometimes having the flag enabled
 * resulted in it tossing to the error page.
 *
 * Set the feature flag here using the enum, and then make sure it's also
 * defined in commmon/feature_flags too.
 */

const EcommerceFeature: React.FC<EcommerceFeatureProps> = ({ children }) => {
  const ecommFlag = useFeatureFlagEnabled(FeatureFlags.EnableEcommerce)

  if (ecommFlag === false) {
    throw new ForbiddenError("Not enabled.")
  }

  return ecommFlag ? children : null
}

export default EcommerceFeature
