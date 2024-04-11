import type { ThemeOptions } from "@mui/material/styles"
import { pxToRem, typography } from "./typography"

const inputBaseComponent: NonNullable<
  ThemeOptions["components"]
>["MuiInputBase"] = {
  defaultProps: { size: "medium" },
  styleOverrides: {
    input: {
      padding: "0px",
    },
  },
  variants: [
    {
      props: { size: "hero" },
      style: {
        padding: "8px 16px",
        height: pxToRem(56),
      },
    },
    {
      props: { size: "medium" },
      style: {
        padding: "8px 12px",
        height: pxToRem(40),
        ...typography.body2,
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
    input: {
      padding: "0px",
    },
  },
}

export { inputBaseComponent, outlinedInputComponent }
