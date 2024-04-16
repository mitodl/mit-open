import Button from "@mui/material/Button"
import type { ButtonProps } from "@mui/material/Button"
import { styled } from "@mui/material/styles"

const paddings: Record<NonNullable<ButtonProps["size"]>, string> = {
  large: "12px",
  small: "5px",
}
const fontSizes: Record<NonNullable<ButtonProps["size"]>, string> = {
  large: "1.75rem",
  small: "1.125rem",
}

/**
 * A circular button.
 */
const FilledIconButton: React.FC<ButtonProps> = styled(Button)(
  ({ size = "large" }) => ({
    borderRadius: "50%",
    padding: paddings[size],
    fontSize: fontSizes[size],
    minWidth: 0,
  }),
)

export { FilledIconButton }
type FilledIconButtonProps = ButtonProps
export type { FilledIconButtonProps }
