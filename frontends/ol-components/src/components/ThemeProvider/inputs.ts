import type { ThemeOptions } from "@mui/material/styles"

const inputBaseComponent: NonNullable<
  ThemeOptions["components"]
>["MuiInputBase"] = {
  defaultProps: { size: "medium" },
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
