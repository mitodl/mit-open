import React from "react"
import styled from "@emotion/styled"
import { pxToRem } from "../ThemeProvider/typography"
import InputBase from "@mui/material/InputBase"
import type { InputBaseProps } from "@mui/material/InputBase"

const defaultProps = {
  size: "medium",
  multiline: false,
}

const buttonPadding = {
  medium: 4,
  hero: 6,
}

const Input = styled(InputBase)(({
  theme,
  size = defaultProps.size,
  multiline,
}) => {
  return [
    {
      backgroundColor: "white",
      color: theme.custom.colors.silverGray2,
      borderColor: theme.custom.colors.silverGray1,
      borderWidth: "1px",
      borderStyle: "solid",
      "&:hover:not(.Mui-disabled)": {
        borderWidth: "2px",
      },
      "&.Mui-focused": {
        borderWidth: "2px",
        color: theme.custom.colors.black,
        borderColor: "currentcolor",
      },
      "&.Mui-error": {
        borderWidth: "2px",
        borderColor: theme.custom.colors.red,
      },
      "& input::placeholder": {
        opacity: "0.3",
        color: theme.custom.colors.black,
      },
    },
    size === "medium" && {
      ...theme.typography.body2,
      paddingLeft: "12px",
      paddingRight: "12px",
      borderRadius: "4px",
      "&.MuiInputBase-adornedStart": {
        marginLeft: `-${buttonPadding.medium}px`,
      },
      "&.MuiInputBase-adornedEnd": {
        marginRight: `-${buttonPadding.medium}px`,
      },
    },
    size === "medium" &&
      !multiline && {
        height: "40px",
      },
    size === "hero" && {
      ...theme.typography.body1,
      paddingLeft: "16px",
      paddingRight: "16px",
      borderRadius: "8px",

      "&.MuiInputBase-adornedStart": {
        marginLeft: `-${buttonPadding.hero}px`,
      },
      "&.MuiInputBase-adornedEnd": {
        marginRight: `-${buttonPadding.hero}px`,
      },
    },
    size === "hero" &&
      !multiline && {
        height: "56px",
      },
  ]
})

const AdornmentButton = styled("button")(({ theme }) => ({
  // font
  lineHeight: 1,
  fontFamily: theme.typography.fontFamily,
  fontWeight: 500,
  color: "inherit",
  // display
  display: "flex",
  justifyContent: "center",
  alignItems: "center",
  // background and border
  border: "none",
  background: "transparent",
  transition: `background ${theme.transitions.duration.short}ms`,
  // cursor
  cursor: "pointer",
  ":disabled": {
    cursor: "default",
  },
  ":hover": {
    background: "rgba(0, 0, 0, 0.06)",
  },
  ".MuiInputBase-root &": {
    // Extra padding to make button easier to click
    width: pxToRem(20 + 2 * buttonPadding.medium),
    height: pxToRem(20 + 2 * buttonPadding.medium),
    ".MuiSvgIcon-root": {
      fontSize: pxToRem(20),
    },
  },
  ".MuiInputBase-sizeHero &": {
    // Extra padding to make button easier to click
    width: pxToRem(24 + 2 * buttonPadding.hero),
    height: pxToRem(24 + 2 * buttonPadding.hero),
    ".MuiSvgIcon-root": {
      fontSize: pxToRem(24),
    },
  },
}))

type InputProps = Omit<InputBaseProps, "color">
type AdornmentButtonProps = React.ComponentProps<typeof AdornmentButton>

export { AdornmentButton }
export default Input
export type { InputProps, AdornmentButtonProps }
