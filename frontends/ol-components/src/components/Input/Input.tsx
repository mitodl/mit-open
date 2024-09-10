import React from "react"
import styled from "@emotion/styled"
import { pxToRem } from "../ThemeProvider/typography"
import InputBase from "@mui/material/InputBase"
import type { InputBaseProps } from "@mui/material/InputBase"
import type { Theme } from "@mui/material/styles"

const defaultProps = {
  size: "medium",
  multiline: false,
}

/**
 * Base styles for Input and Select components. Includes border, color, hover effects.
 */
const baseInputStyles = (theme: Theme) => ({
  backgroundColor: "white",
  color: theme.custom.colors.silverGrayDark,
  borderColor: theme.custom.colors.silverGrayLight,
  borderWidth: "1px",
  borderStyle: "solid",
  "&.Mui-disabled": {
    backgroundColor: theme.custom.colors.lightGray1,
  },
  "&:hover:not(.Mui-disabled):not(.Mui-focused)": {
    borderColor: theme.custom.colors.darkGray2,
  },
  "&.Mui-focused": {
    /**
     * When change border width, it affects either the elements outside of it or
     * inside based on the border-box setting.
     *
     * Instead of changing the border width, we hide the border and change width
     * using outline.
     */
    borderColor: "transparent",
    outline: "2px solid currentcolor",
    outlineOffset: "-2px",
    color: theme.custom.colors.darkGray2,
  },
  "&.Mui-error": {
    borderColor: theme.custom.colors.red,
    outlineColor: theme.custom.colors.red,
  },
  "& input::placeholder": {
    color: theme.custom.colors.silverGrayDark,
    opacity: 1, // some browsers apply opacity to placeholder text
  },
  "& input:placeholder-shown": {
    textOverflow: "ellipsis",
  },
  "& textarea": {
    paddingTop: "6px",
    paddingBottom: "7px",
  },
  "&.MuiInputBase-adornedStart": {
    paddingLeft: "0",
    input: {
      paddingLeft: "8px",
    },
  },
  "&.MuiInputBase-adornedEnd": {
    paddingRight: "0",
    input: {
      paddingRight: "8px",
    },
  },
})

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
    baseInputStyles(theme),
    size === "medium" && {
      "& .MuiInputBase-input": {
        ...theme.typography.body2,
      },
      paddingLeft: "12px",
      paddingRight: "12px",
      borderRadius: "4px",
    },
    size === "small" &&
      !multiline && {
        height: "40px",
      },
    size === "medium" &&
      !multiline && {
        height: "48px",
      },
    size === "hero" && {
      "& .MuiInputBase-input": {
        ...theme.typography.body1,
      },
      paddingLeft: "16px",
      paddingRight: "16px",
      borderRadius: "8px",
      [theme.breakpoints.down("sm")]: {
        "& .MuiInputBase-input": {
          ...theme.typography.body3,
        },
      },
    },
    size === "hero" &&
      !multiline && {
        height: "72px",
        [theme.breakpoints.down("sm")]: {
          height: "56px",
        },
      },
  ]
})

const AdornmentButtonStyled = styled("button")(({ theme }) => ({
  // font
  ...theme.typography.button,
  // display
  display: "flex",
  flexShrink: 0,
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
  height: "100%",
  ".MuiInputBase-root &": {
    width: "48px",
    ".MuiSvgIcon-root": {
      fontSize: pxToRem(20),
    },
  },
  ".MuiInputBase-sizeHero &": {
    width: "72px",
    ".MuiSvgIcon-root": {
      fontSize: pxToRem(24),
    },
    [theme.breakpoints.down("sm")]: {
      width: "56px",
      ".MuiSvgIcon-root": {
        fontSize: pxToRem(16),
      },
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

export { AdornmentButton, Input, baseInputStyles }
export type { InputProps, AdornmentButtonProps }
