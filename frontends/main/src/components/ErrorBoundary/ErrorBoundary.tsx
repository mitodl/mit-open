"use client"

import React, { Component } from "react"
import NotFoundPage from "@/app-pages/ErrorPage/NotFoundPage"
import ForbiddenPage from "@/app-pages/ErrorPage/ForbiddenPage"
import { ForbiddenError } from "@/common/permissions"
import { usePathname } from "next/navigation"

interface ErrorBoundaryProps {
  children: React.ReactNode
}

interface ErrorBoundaryHandlerProps extends ErrorBoundaryProps {
  pathname: string
}

interface ErrorBoundaryHandlerState {
  hasError: boolean
  error: unknown
  previousPathname: string
}
const isForbiddenError = (error: unknown) => error instanceof ForbiddenError

class ErrorBoundaryHandler extends Component<
  ErrorBoundaryHandlerProps,
  ErrorBoundaryHandlerState
> {
  constructor(props: ErrorBoundaryHandlerProps) {
    super(props)
    this.state = {
      hasError: false,
      error: null,
      previousPathname: this.props.pathname,
    }
  }

  static getDerivedStateFromError(error: unknown) {
    return { hasError: true, error: error }
  }

  static getDerivedStateFromProps(
    props: ErrorBoundaryHandlerProps,
    state: ErrorBoundaryHandlerState,
  ): ErrorBoundaryHandlerState | null {
    if (props.pathname !== state.previousPathname && state.error) {
      return {
        error: null,
        hasError: false,
        previousPathname: props.pathname,
      }
    }
    return {
      error: state.error,
      hasError: state.hasError,
      previousPathname: props.pathname,
    }
  }

  render() {
    if (this.state.hasError) {
      if (isForbiddenError(this.state.error)) {
        return <ForbiddenPage />
      } else {
        return <NotFoundPage />
      }
    }

    return this.props.children
  }
}

export function ErrorBoundary({
  children,
}: ErrorBoundaryProps & { children: React.ReactNode }): JSX.Element {
  const pathname = usePathname()
  return (
    <ErrorBoundaryHandler pathname={pathname}>{children}</ErrorBoundaryHandler>
  )
}

export default ErrorBoundary
