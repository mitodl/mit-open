"use client"

import React from "react"
import ErrorPageTemplate from "./ErrorPageTemplate"
import { Typography } from "ol-components"

const FallbackErrorPage = ({ error }: { error: Pick<Error, "message"> }) => {
  return (
    <ErrorPageTemplate title="Unexpected Error">
      <Typography variant="h3" component="h1">
        Something went wrong.
      </Typography>
      {error.message}
    </ErrorPageTemplate>
  )
}

export default FallbackErrorPage
