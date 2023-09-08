import React from "react"
import { useEffect } from "react"
import { useHistory, useLocation } from "react-router"
import ForbiddenPage from "./ForbiddenPage"
import NotFoundPage from "./NotFoundPage"

type AppLocationState =
  | undefined
  | {
      forbidden?: boolean
      notFound?: boolean
    }

const ErrorPageRedirect: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const history = useHistory<AppLocationState>()
  const location = useLocation<AppLocationState>()

  useEffect(() => {
    const state = history.location.state
    if (state?.forbidden) {
      delete state.forbidden
    }

    history.replace({ ...history.location, state: state })
  }, [history])
  if (location.state?.forbidden) {
    return <ForbiddenPage />
  }
  if (location.state?.notFound) {
    return <NotFoundPage />
  }
  return children
}

export default ErrorPageRedirect
