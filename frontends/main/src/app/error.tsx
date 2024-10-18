"use client"
/*
 * Fallback error UI for errors within page content.
 *
 * Notes:
 *  - DOES use root layout
 *
 * See for more:
 * https://nextjs.org/docs/app/building-your-application/routing/error-handling#handling-errors-in-root-layouts
 */

import React, { useEffect } from "react"
import * as Sentry from "@sentry/nextjs"
import FallbackErrorPage from "@/app-pages/ErrorPage/FallbackErrorPage"
import { ForbiddenError } from "@/common/permissions"
import ForbiddenPage from "@/app-pages/ErrorPage/ForbiddenPage"
const Error = ({ error }: { error: Error }) => {
  useEffect(() => {
    Sentry.captureException(error)
  }, [error])

  if (error instanceof ForbiddenError) {
    return <ForbiddenPage />
  }

  return <FallbackErrorPage error={error} />
}

export default Error
