"use client"

/*
 * This file wraps the page in a Client Component to avoid errors such as:
 * You're importing a component that needs usePathname. It only works in a Client Component but none of
 * its parents are marked with "use client", so they're Server Components by default.
 */

import React from "react"
import LearningPathDetailsPage from "@/app-pages/LearningPathDetailsPage/LearningPathDetailsPage"

const Page: React.FC = () => {
  return <LearningPathDetailsPage />
}

export default Page
