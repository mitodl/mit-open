import React, { useEffect } from "react"
import ErrorPageTemplate from "./ErrorPageTemplate"
import { useUserMe } from "api/hooks/user"
import { Typography } from "ol-components"
import { redirect } from "next/navigation"
import * as urls from "@/common/urls"

const ForbiddenPage: React.FC = () => {
  const { data: user } = useUserMe()

  useEffect(() => {
    if (!user?.is_authenticated) {
      const loginUrl = urls.login()
      redirect(loginUrl)
    }
  }, [user])
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
