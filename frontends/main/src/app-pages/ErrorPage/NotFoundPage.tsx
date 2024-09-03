"use client"

import React from "react"
import ErrorPageTemplate from "./ErrorPageTemplate"
import { Typography } from "ol-components"

const NotFoundPage: React.FC = () => {
  return (
    <ErrorPageTemplate title="Not Found">
      <Typography variant="h3" component="h1">
        404 Not Found Error
      </Typography>
      Resource Not Found
    </ErrorPageTemplate>
  )
}

export default NotFoundPage
