import React from "react"
import styled from "@emotion/styled"
import { pxToRem } from "../ThemeProvider/typography"

const AdornmentButton = styled("button")(({ theme }) => ({
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
    /**
     * Adornment button is 28px x 28px with a 20 by 20 icon.
     * Essentially, 4px of padding on all sides.
     * This makes the icon easier to click.
     */
    width: pxToRem(28),
    height: pxToRem(28),
    ".MuiSvgIcon-root": {
      fontSize: pxToRem(20),
    },
  },
  ".MuiInputBase-sizeHero &": {
    /**
     * Adornment button is 28px x 28px with a 20 by 20 icon.
     * Essentially, 4px of padding on all sides.
     * This makes the icon easier to click.
     */
    width: pxToRem(32),
    height: pxToRem(32),
    ".MuiSvgIcon-root": {
      fontSize: pxToRem(24),
    },
  },
}))

export { AdornmentButton }
