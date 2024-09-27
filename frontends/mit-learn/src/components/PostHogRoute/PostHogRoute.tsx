import React from "react"
import { Navigate, Outlet } from "react-router"
import { PostHogFeature } from "posthog-js/react"
import { Permissions } from "@/common/permissions"
import RestrictedRoute from "../RestrictedRoute/RestrictedRoute"

type PostHogRouteProps = {
  children?: React.ReactNode
  flag: string
  match: boolean | string
  requires?: Permissions
}

/**
 * Use `<PostHogRoute />` to feature flag a particular route (or set of routes).
 * This can also wrap your output in RestrictedRoute so you can also require
 * permissions for your route.
 *
 * The use of it mirrors the RestrictedRoute. However, there are a couple of
 * additional props to control the PostHog part of this:
 *  - flag: the flag to check for
 *  - match: either true, or the variant string to match on
 *
 * These PostHog things aren't supported:
 *  - fallback: this is really meant more for flagging parts of pages, so instead
 *    we'll redirect you to the homepage.
 *  - payload: the PostHog component can provide a payload if you want, but I'm
 *    not bothering with that just yet.
 */

const NavigateWrapper: React.FC = () => {
  console.log("hit the fallback!")
  return <Navigate to="/" />
}

const PostHogRoute: React.FC<PostHogRouteProps> = ({
  children,
  flag,
  match,
  requires,
}) => {
  if (requires) {
    console.log("this route is Restricted too!")
    return (
      <RestrictedRoute requires={requires}>
        <PostHogFeature
          flag={flag}
          match={match}
          fallback={<NavigateWrapper />}
        >
          {children ? children : <Outlet />}
        </PostHogFeature>
      </RestrictedRoute>
    )
  } else {
    return (
      <PostHogFeature flag={flag} match={match} fallback={<NavigateWrapper />}>
        {children ? children : <Outlet />}
      </PostHogFeature>
    )
  }
}

export default PostHogRoute
