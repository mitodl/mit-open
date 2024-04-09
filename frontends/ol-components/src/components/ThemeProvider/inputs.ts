import type { ThemeOptions } from "@mui/material/styles"
import { pxToRem } from "./typography"

const inputBaseComponent: NonNullable<
  ThemeOptions["components"]
>["MuiInputBase"] = {
  defaultProps: { size: "medium" },
  variants: [
    {
      props: { size: "hero" },
      style: {
        padding: "8px 16px",
        lineHeight: pxToRem(40),
      },
    },
    {
      props: { size: "medium" },
      style: {
        padding: "8px 12px",
      },
    },
  ],
}

const outlinedInputComponent: NonNullable<
  ThemeOptions["components"]
>["MuiOutlinedInput"] = {
  styleOverrides: {
    root: {
      backgroundColor: "white",
    },
  },
}

export { inputBaseComponent, outlinedInputComponent }
