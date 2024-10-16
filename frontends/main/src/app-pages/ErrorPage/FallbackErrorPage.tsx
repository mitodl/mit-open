"use client"

import React from "react"
import ErrorPageTemplate from "./ErrorPageTemplate"
import { Typography } from "ol-components"

// Double check type Error below
// Sentry wizard thinks it should be
// import Error from "next/error";

const GlobalErrorPage = ({ error }: { error: Pick<Error, "message"> }) => {
  return (
    <ErrorPageTemplate title="Unexpected Error">
      <Typography variant="h3" component="h1">
        Something went wrong.
      </Typography>
      {error.message || ""}
    </ErrorPageTemplate>
  )
}

export default GlobalErrorPage
