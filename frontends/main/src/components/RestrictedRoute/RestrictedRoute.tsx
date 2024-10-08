"use client"

import React from "react"
import { ForbiddenError, Permissions } from "@/common/permissions"
import { useUserMe } from "api/hooks/user"
import { redirect } from "next/navigation"
import * as urls from "@/common/urls"

type RestrictedRouteProps = {
  children?: React.ReactNode
  requires: Permissions
}

/**
 * Use `<RestrictedRoute />` to restrict access to routes based on user. This
 * component can be used in two ways:
 *
 * 1. Restrict a single page by directly wrapping a page component:
 * ```tsx
 * routes = [
 *   {
 *     element: <RestrictedRoute requires={...}> <SomePage /> </RestrictedRoute>
 *     path: "/some/url"
 *   }
 * ]
 * ```
 * 2. Restrict multiple pages by using as a "layout route" grouping child routes
 * ```
 * routes = [
 *   {
 *     element: <RestrictedRoute requires={...} />
 *     children: [
 *        { element: <SomePage />, path: "/some/url" },
 *        { element: <AnotherPage />, path: "/other/url"},
 *     ]
 *   }
 * ]
 * ```
 */
const RestrictedRoute: React.FC<RestrictedRouteProps> = ({
  children,
  requires,
}) => {
  const { isLoading, data: user } = useUserMe()
  if (isLoading) return null
  if (!user?.is_authenticated) {
    // Redirect unauthenticated users to login
    const loginUrl = urls.login()
    redirect(loginUrl)
    return null
  }
  if (!isLoading && !user?.[requires]) {
    // This error should be caught by an [`errorElement`](https://reactrouter.com/en/main/route/error-element).
    throw new ForbiddenError("Not allowed.")
  }

  return children
}

export default RestrictedRoute
