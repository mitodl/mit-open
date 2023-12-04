import React from "react"
import { Outlet } from "react-router"
import { ForbiddenError } from "../util/permissions"
import type { User } from "../types/settings"

type RestrictedRouteProps = {
  children?: React.ReactNode
  allow: (user: User) => boolean
}

/**
 * Use `<RestrictedRoute />` to restrict access to routes based on user. This
 * component can be used in two ways:
 *
 * 1. Restrict a single page by directly wrapping a page component:
 * ```tsx
 * routes = [
 *   {
 *     element: <RestrictedRoute allow={...}> <SomePage /> </RestrictedRoute>
 *     path: "/some/url"
 *   }
 * ]
 * ```
 * 2. Restrict multiple pages by using as a "layout route" grouping child routes
 * ```
 * routes = [
 *   {
 *     element: <RestrictedRoute allow={...} />
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
  allow,
}) => {
  const { user } = window.SETTINGS

  if (!allow(user)) {
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
