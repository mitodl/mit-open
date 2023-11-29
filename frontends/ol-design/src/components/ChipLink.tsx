import React from "react"
import Chip from "@mui/material/Chip"
import { Link } from "react-router-dom"

import type { ChipProps } from "@mui/material/Chip"
import type { LinkProps } from "react-router-dom"

type ChipLinkProps = Pick<LinkProps, "to"> &
  Pick<ChipProps<typeof Link>, "color" | "label" | "disabled" | "className">

/**
 * A link rendered as a "chip".
 *
 * See https://mui.com/material-ui/react-chip/#clickable-link
 */
const ChipLink = React.forwardRef<HTMLAnchorElement, ChipLinkProps>(
  (props, ref) => (
    <Chip
      {...props}
      ref={ref}
      // Use React Router's Link
      component={Link}
      // Links are clickable.
      clickable
      variant="outlined"
    />
  ),
)

export { ChipLink }
