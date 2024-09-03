import React from "react"
import Chip from "@mui/material/Chip"
import Link from "next/link"

import type { ChipProps } from "@mui/material/Chip"

type ChipLinkProps = { href: string } & Pick<
  ChipProps<typeof Link>,
  "label" | "disabled" | "className" | "variant" | "size" | "icon"
>

/**
 * A link rendered as a "chip".
 *
 * See https://mui.com/material-ui/react-chip/#clickable-link
 */
const ChipLink = React.forwardRef<HTMLAnchorElement, ChipLinkProps>(
  ({ href, ...others }, ref) => (
    <Chip {...others} ref={ref} component={Link} href={href || ""} clickable />
  ),
)

export { ChipLink }
export type { ChipLinkProps }
