import React from "react"
import { Metadata } from "next"
import OnboardingPage from "@/app-pages/OnboardingPage/OnboardingPage"
import { standardizeMetadata } from "@/common/metadata"

export const metadata: Metadata = standardizeMetadata({
  title: "Onboarding",
  social: false,
})

const Page: React.FC = () => {
  return <OnboardingPage />
}

export default Page
