import type { ThemeOptions } from "@mui/material/styles"
import { pxToRem } from "./typography"

const buttonBaseComponent = {
  defaultProps: {
    disableElevation: true,
    disableRipple: true,
  },
  styleOverrides: {
    root: {
      ":focus-visible": {
        outline: "revert",
      },
    },
  },
}

const buttonComponent: NonNullable<ThemeOptions["components"]>["MuiButton"] = {
  defaultProps: {
    size: "large",
    disableElevation: true,
  },
  variants: [
    {
      props: { size: "large" },
      style: {
        fontSize: pxToRem(16),
      },
    },
    {
      props: { size: "small" },
      style: {
        fontSize: pxToRem(12),
      },
    },
  ],
}

export { buttonComponent, buttonBaseComponent }
