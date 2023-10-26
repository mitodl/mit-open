import React from "react"
import Chip from "@mui/material/Chip"
import { Link } from "react-router-dom"

import type { ChipProps } from "@mui/material/Chip"
import type { LinkProps } from "react-router-dom"

type ChipLinkProps = Pick<LinkProps, "to"> &
  Pick<ChipProps, "color" | "label" | "disabled" | "className">

/**
 * A link rendered as a "chip", an ovular button.
 *
 * See https://mui.com/material-ui/react-chip/#clickable-link
 */
const ChipLink: React.FC<ChipLinkProps> = (props) => (
  <Chip
    {...props}
    // Use React Router's Link
    component={Link}
    // Links are clickable.
    clickable
    variant="outlined"
  />
)

export { ChipLink }
