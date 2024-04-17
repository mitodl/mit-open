import type { ThemeOptions } from "@mui/material/styles"

const chipComponent: NonNullable<ThemeOptions["components"]>["MuiChip"] = {
  defaultProps: { size: "medium" },
  styleOverrides: {
    root: {
      borderRadius: "20px",
    },
  },
  variants: [
    {
      props: { size: "small" },
      style: {
        height: "24px",
      },
    },
  ],
}

export { chipComponent }
