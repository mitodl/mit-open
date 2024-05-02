import React from "react"
import ListItemButton from "@mui/material/ListItemButton"
import type { ListItemButtonProps } from "@mui/material/ListItemButton"
import { styled } from "@mui/material/styles"
import { Link } from "react-router-dom"

type ListItemLinkProps = ListItemButtonProps<"a">

const ListItemLink: React.FC<ListItemLinkProps> = styled(
  ({ href, ...props }: ListItemLinkProps) => (
    <ListItemButton component={Link} to={href} {...props} />
  ),
)(({ theme }) => [
  {
    "&:hover": {
      backgroundColor: theme.custom.colors.lightGray1,
      ".MuiListItemText-root": {
        color: theme.custom.colors.red,
      },
    },
    ".MuiListItemText-root": {
      marginTop: 0,
      marginBottom: 0,
    },
  },
])

export { ListItemLink }
export type { ListItemLinkProps }
