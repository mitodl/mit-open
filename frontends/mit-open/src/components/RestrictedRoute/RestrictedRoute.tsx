import React from "react"
import { Outlet } from "react-router"
import { ForbiddenError, Permissions } from "@/common/permissions"
import { useUserMe } from "api/hooks/user"
import { login, next } from "@/common/urls"

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
    window.location.assign(login({ pathname: next() }))
    return null
  }
  if (!isLoading && !user?.[requires]) {
    // This error should be caught by an [`errorElement`](https://reactrouter.com/en/main/route/error-element).
    throw new ForbiddenError("Not allowed.")
  }
  /**
   * Rendering an Outlet allows this to be used as a layout route grouping many
   * child routes with the same auth condition.
   */
  return children ? children : <Outlet />
}

export default RestrictedRoute
