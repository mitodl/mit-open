import React, { useEffect } from "react"
import ErrorPageTemplate from "./ErrorPageTemplate"
import { useLocation } from "react-router"

const ForbiddenPage: React.FC = () => {
  const { user } = window.SETTINGS
  const location = useLocation()
  useEffect(() => {
    if (!user.is_authenticated) {
      window.location.assign(`/login/?next=${location.pathname}`)
    }
  })
  return (
    <ErrorPageTemplate title="Forbidden">
      <h1>403 Forbidden Error</h1>
      You do not have permission to access this resource.
    </ErrorPageTemplate>
  )
}

export default ForbiddenPage
