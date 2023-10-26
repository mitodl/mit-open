import React from "react"
import MuiButton from "@mui/material/Button"
import type { ButtonProps as MuiButtonProps } from "@mui/material/Button"

type ButtonProps = Pick<
  MuiButtonProps,
  | "className"
  | "onClick"
  | "disabled"
  | "type"
  | "size"
  | "startIcon"
  | "endIcon"
  | "children"
  | "variant"
  | "color"
>
const Button: React.FC<ButtonProps> = (props) => {
  return <MuiButton {...props} disableElevation />
}

export { Button }
export type { ButtonProps }
