import React, { useEffect } from "react"
import ErrorPageTemplate from "./ErrorPageTemplate"
import { useUserMe } from "api/hooks/user"
import { Typography } from "ol-components"
import { login } from "@/common/urls"
import { useLocation } from "react-router"

const ForbiddenPage: React.FC = () => {
  const location = useLocation()
  const { data: user } = useUserMe()

  useEffect(() => {
    if (!user?.is_authenticated) {
      window.location.assign(login(location))
    }
  })
  return (
    <ErrorPageTemplate title="Not Allowed">
      <Typography variant="h3" component="h1">
        Not Allowed
      </Typography>
      You do not have permission to access this resource.
    </ErrorPageTemplate>
  )
}

export default ForbiddenPage
