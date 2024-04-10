import React from "react"
import Chip from "@mui/material/Chip"
import { Link } from "react-router-dom"

import type { ChipProps } from "@mui/material/Chip"

type ChipLinkProps = { href: string } & Pick<
  ChipProps<typeof Link>,
  "color" | "label" | "disabled" | "className" | "variant" | "size" | "color"
>

/**
 * A link rendered as a "chip".
 *
 * See https://mui.com/material-ui/react-chip/#clickable-link
 */
const ChipLink = React.forwardRef<HTMLAnchorElement, ChipLinkProps>(
  ({ href, ...others }, ref) => (
    <Chip
      variant="outlined"
      {...others}
      color="primary"
      ref={ref}
      // Use React Router's Link
      component={Link}
      to={href}
      // Links are clickable.
      clickable
    />
  ),
)

export { ChipLink }
export type { ChipLinkProps }
