import React from "react"
import { AxiosError } from "axios"
import ForbiddenPage from "./ForbiddenPage"
import NotFoundPage from "./NotFoundPage"
import { useRouteError } from "react-router"
import ErrorPageTemplate from "./ErrorPageTemplate"
import { ForbiddenError as ClientSideForbiddenError } from "@/common/permissions"

const AUTH_STATUS_CODES = [401, 403]
const NOT_FOUND_STATUS_CODES = [404]

const isNotFoundError = (error: unknown) =>
  error instanceof AxiosError &&
  error.response &&
  NOT_FOUND_STATUS_CODES.includes(Number(error.response.status))

const isForbiddenError = (error: unknown) =>
  error instanceof ClientSideForbiddenError ||
  (error instanceof AxiosError &&
    error.response &&
    AUTH_STATUS_CODES.includes(error.response.status))

const ErrorPage = () => {
  const error = useRouteError()

  if (isForbiddenError(error)) {
    return <ForbiddenPage />
  } else if (isNotFoundError(error)) {
    return <NotFoundPage />
  }

  return (
    /**
     * This should not happen, but it's better than the app crashing.
     */
    <ErrorPageTemplate title="Error">
      <h1>Something went wrong.</h1>
    </ErrorPageTemplate>
  )
}

export default ErrorPage
