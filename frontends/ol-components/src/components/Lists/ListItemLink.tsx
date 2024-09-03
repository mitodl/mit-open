import React from "react"
import ListItemButton from "@mui/material/ListItemButton"
import type { ListItemButtonProps } from "@mui/material/ListItemButton"
import { styled } from "@mui/material/styles"
import Link from "next/link"

type ListItemLinkProps = ListItemButtonProps<"a">

/**
 * A ListItemButton that uses a Link component from react-router-dom.
 *
 * The purpose is to make the entire clickable area of a ListItem a link. Note
 * that `ListItem` should have `disablePadding` when it contains a `ListItemLink`
 * since the padding is applied to the link itself.
 */
const ListItemLink: React.FC<ListItemLinkProps> = styled(
  ({ href, ...props }: ListItemLinkProps) => (
    <ListItemButton component={Link} to={href} {...props} />
  ),
)(() => [
  {
    ".MuiListItemText-root": {
      marginTop: 0,
      marginBottom: 0,
    },
  },
])

export { ListItemLink }
export type { ListItemLinkProps }
