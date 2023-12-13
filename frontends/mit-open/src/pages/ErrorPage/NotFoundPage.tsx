import React from "react"
import ErrorPageTemplate from "./ErrorPageTemplate"

const NotFoundPage: React.FC = () => {
  return (
    <ErrorPageTemplate title="Not Found">
      <h1>404 Not Found Error</h1>
      Resource Not Found
    </ErrorPageTemplate>
  )
}

export default NotFoundPage
