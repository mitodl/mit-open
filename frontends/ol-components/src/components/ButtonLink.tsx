import React from "react"
import MuiButton from "@mui/material/Button"
import { Link } from "react-router-dom"
import type { LinkProps } from "react-router-dom"
import type { ButtonProps as MuiButtonProps } from "@mui/material/Button"

type ButtonLinkProps = Pick<
  MuiButtonProps,
  | "className"
  | "disabled"
  | "type"
  | "size"
  | "startIcon"
  | "endIcon"
  | "children"
  | "variant"
  | "color"
> & { to: LinkProps["to"] }

/**
 * A button rendered as a link that uses react-router-dom's Link component
 * for routing.
 */
const ButtonLink = React.forwardRef<HTMLAnchorElement, ButtonLinkProps>(
  (props, ref) => {
    return <MuiButton {...props} disableElevation component={Link} ref={ref} />
  },
)

export { ButtonLink }
export type { ButtonLinkProps }
