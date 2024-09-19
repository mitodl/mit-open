import React from "react"
import { Metadata } from "next"
import OnboardingPage from "@/app-pages/OnboardingPage/OnboardingPage"
import { getMetadataAsync } from "@/common/metadata"

export const metadata: Metadata = getMetadataAsync({
  title: "Onboarding",
  social: false,
})

const Page: React.FC = () => {
  return <OnboardingPage />
}

export default Page
