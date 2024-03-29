import React, { useEffect } from "react"
import ErrorPageTemplate from "./ErrorPageTemplate"
import { useLocation } from "react-router"

const ForbiddenPage: React.FC = () => {
  const { user } = window.SETTINGS
  const location = useLocation()
  useEffect(() => {
    if (!user.is_authenticated) {
      window.location.assign(`/login/ol-oidc/?next=${location.pathname}`)
    }
  })
  return (
    <ErrorPageTemplate title="Not Allowed">
      <h1>Not Allowed</h1>
      You do not have permission to access this resource.
    </ErrorPageTemplate>
  )
}

export default ForbiddenPage
