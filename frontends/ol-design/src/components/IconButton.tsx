import React from "react"
import MuiIconButton from "@mui/material/IconButton"
import type { IconButtonProps as MuiIconButtonProps } from "@mui/material/IconButton"

type IconButtonProps = Pick<
  MuiIconButtonProps,
  | "className"
  | "style"
  | "onClick"
  | "disabled"
  | "type"
  | "size"
  | "children"
  | "color"
  | "ref"
>
const IconButton: React.FC<IconButtonProps> = MuiIconButton

export { IconButton }
export type { IconButtonProps }
