import Button from "@mui/material/Button"
import type { ButtonProps } from "@mui/material/Button"
import { styled } from "@mui/material/styles"

const paddings: Record<NonNullable<ButtonProps["size"]>, string> = {
  large: "12px",
  medium: "8px",
  small: "5px",
}
const fontSizes: Record<NonNullable<ButtonProps["size"]>, string> = {
  large: "1.75rem",
  medium: "1.5rem",
  small: "1.125rem",
}

/**
 * A circular button.
 */
const FilledIconButton = styled(Button)(({ size = "medium" }) => ({
  borderRadius: "50%",
  padding: paddings[size],
  fontSize: fontSizes[size],
  minWidth: 0,
}))

export { FilledIconButton }
type FilledIconButtonProps = ButtonProps
export type { FilledIconButtonProps }
