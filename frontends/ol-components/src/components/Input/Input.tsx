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

/**
 * A styled input that supports start and end adornments. In most cases, the
 * higher-level TextField component should be used instead of this component.
 */
const Input = styled(InputBase)(({
  theme,
  size = defaultProps.size,
  multiline,
}) => {
  return [
    {
      backgroundColor: "white",
      color: theme.custom.colors.silverGrayDark,
      borderColor: theme.custom.colors.silverGrayLight,
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
      "&:hover:not(.Mui-disabled), &.Mui-focused": {
        paddingLeft: "15px",
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
      "&:hover:not(.Mui-disabled), &.Mui-focused": {
        paddingLeft: "15px",
      },
    },
    size === "hero" &&
      !multiline && {
        height: "56px",
      },
  ]
})

const AdornmentButtonStyled = styled("button")(({ theme }) => ({
  // font
  lineHeight: 1,
  fontFamily: theme.typography.fontFamily,
  fontWeight: 500,
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

  color: theme.custom.colors.silverGray,
  ".MuiInputBase-root:hover &": {
    color: "inherit",
  },
  ".MuiInputBase-root.Mui-focused &": {
    color: "inherit",
  },
  ".MuiInputBase-root.Mui-disabled &": {
    color: "inherit",
  },
}))

const noFocus: React.MouseEventHandler = (e) => e.preventDefault()

type AdornmentButtonProps = React.ComponentProps<typeof AdornmentButtonStyled>
/**
 * Button to be used with `startAdornment` and `endAdornment` props on Input and
 * TextField components. AdornmentButton takes care of positioning and other
 * styling concerns.
 *
 * NOTES:
 *  - It is generally expected that the content of the AdornmentButton is an
 *    Mui Icon component. https://mui.com/material-ui/material-icons/
 *  - By defualt, the AdornmentButton calls `preventDefault` on `mouseDown`
 *    events. This prevents the button from stealing focus from the input on
 *    click. The button is still focusable via keyboard events. You can override
 *    this behavior by passing your own `onMouseDown` handler.
 */
const AdornmentButton: React.FC<AdornmentButtonProps> = (props) => {
  return (
    <AdornmentButtonStyled
      /**
       * If the input is focused and user clicks the AdornmentButton, we don't
       * want to steal focus from the input.
       */
      onMouseDown={noFocus}
      {...props}
    />
  )
}

type InputProps = Omit<InputBaseProps, "color">

export { AdornmentButton, Input }
export type { InputProps, AdornmentButtonProps }
