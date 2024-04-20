import type { ThemeOptions } from "@mui/material/styles"

const buttonBaseComponent: NonNullable<
  ThemeOptions["components"]
>["MuiButtonBase"] = {
  defaultProps: {
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

export { buttonBaseComponent }
