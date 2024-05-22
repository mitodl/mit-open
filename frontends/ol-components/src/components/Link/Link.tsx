import React from "react"
import styled from "@emotion/styled"
import { css } from "@emotion/react"
import { Link as RouterLink } from "react-router-dom"
import type { Theme } from "../ThemeProvider/ThemeProvider"

type LinkStyleProps = {
  size?: "small" | "medium" | "large"
  color?: "red" | "black"
}
const DEFAULT_PROPS: Required<LinkStyleProps> = {
  size: "medium",
  color: "black",
}

/**
 * Generate styles used for the Link component.
 *
 * If you need a Link, use Link directly.
 * If you want another element styled as a Link, use this function in conjunction
 * with `styled`. For example, `styled.span(linkStyles)`.
 */
const linkStyles = (props: LinkStyleProps & { theme: Theme }) => {
  const { theme, size, color } = { ...DEFAULT_PROPS, ...props }
  return css([
    size === "small" && {
      ...theme.typography.body3,
    },
    size === "medium" && {
      ...theme.typography.body2,
    },
    size === "large" && {
      ...theme.typography.h5,
    },
    {
      color: {
        black: theme.custom.colors.black,
        red: theme.custom.colors.red,
      }[color],
      ":hover": {
        color: theme.custom.colors.lightRed,
        textDecoration: "underline",
      },
    },
  ])
}

type LinkProps = LinkStyleProps &
  React.ComponentProps<"a"> & {
    nativeAnchor?: boolean
  }

/**
 * A styled link. By default, renders a medium-sized black link using the Link
 * component from `react-router`. This is appropriate for in-app routing.
 *
 * If you need to force a full-page reload, e.g., for login/logout links, use
 * set `nativeAnchor={true}`.
 *
 * For a link styled as a button, use ButtonLink.
 */
const Link = styled((props: LinkProps) => {
  if (props.nativeAnchor) {
    return <a {...props} />
  } else {
    return <RouterLink to={props.href ?? ""} {...props} />
  }
})<LinkStyleProps>(linkStyles)

export { Link, linkStyles }
export type { LinkProps }
