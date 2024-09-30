import React from "react"
import { Metadata } from "next"
import OnboardingPage from "@/app-pages/OnboardingPage/OnboardingPage"
import { standardizeMetadata } from "@/common/metadata"
import RestrictedRoute from "@/components/RestrictedRoute/RestrictedRoute"
import { Permissions } from "@/common/permissions"

export const metadata: Metadata = standardizeMetadata({
  title: "Onboarding",
  social: false,
})

const Page: React.FC = () => {
  return (
    <RestrictedRoute requires={Permissions.Authenticated}>
      <OnboardingPage />
    </RestrictedRoute>
  )
}

export default Page
