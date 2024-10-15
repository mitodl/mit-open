"use client"

/* This is the catch-all error page that receives errors from server rendered root layout
 * components and metadata.
 * It is only enabled in production so that in development we see the Next.js error overlay.
 * It is passed an error object as an argument, though this has been stripped of everything except
 * the message and a digest for server logs correlation; to prevent leaking anything to the client
 *
 * https://nextjs.org/docs/app/building-your-application/routing/error-handling#handling-errors-in-root-layouts
 */

import React from "react"
import GlobalErrorPage from "@/app-pages/ErrorPage/GlobalErrorPage"

const GlobalError = ({ error }: { error: Error }) => {
  return <GlobalErrorPage error={error} />
}

export default GlobalError
