import type { ThemeOptions } from "@mui/material/styles"

// Used via OutlinedInput, Select, TextField, ....
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
  variants: [
    {
      props: { size: "medium" },
      style: {
        paddingLeft: "12px",
        paddingRight: "12px",
        "&.MuiInputBase-adornedStart": {
          // 4 less to account for padding on the adornment
          paddingLeft: "8px",
        },
        "&.MuiInputBase-adornedEnd": {
          // 4 less to account for padding on the adornment
          paddingRight: "8px",
        },
      },
    },
    {
      props: { size: "medium", multiline: false },
      style: {
        height: "40px",
      },
    },
    {
      props: { size: "hero", multiline: false },
      style: {
        height: "56px",
      },
    },
    {
      props: { size: "hero" },
      style: {
        paddingLeft: "16px",
        paddingRight: "16px",
        "&.MuiInputBase-adornedStart": {
          // 6 less to account for padding on the adornment
          paddingLeft: "10px",
        },
        "&.MuiInputBase-adornedEnd": {
          // 6 less to account for padding on the adornment
          paddingRight: "10px",
        },
      },
    },
  ],
}

export { inputBaseComponent, outlinedInputComponent }
