import React from "react"
import { Metadata } from "next"
import { getMetadata } from "@/common/metadata"
import OnboardingPage from "@/app-pages/OnboardingPage/OnboardingPage"

export const metadata: Metadata = getMetadata({
  title: "Onboarding",
  social: false,
})

const Page: React.FC = () => {
  return <OnboardingPage />
}

export default Page
