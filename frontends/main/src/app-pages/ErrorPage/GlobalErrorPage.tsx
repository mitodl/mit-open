"use client"

import React from "react"
import ErrorPageTemplate from "./ErrorPageTemplate"
import { Typography } from "ol-components"

const GlobalErrorPage = ({ error }: { error: Pick<Error, "message"> }) => {
  return (
    <ErrorPageTemplate title="Unexpected Error">
      <Typography variant="h3" component="h1">
        Unexpected Error
      </Typography>
      {error.message || ""}
    </ErrorPageTemplate>
  )
}

export default GlobalErrorPage
