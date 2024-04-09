import type { ThemeOptions } from "@mui/material/styles"
import { pxToRem } from "./typography"

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
    {
      props: { size: "micro" },
      style: {
        fontSize: pxToRem(10),
        padding: "2px 3px",
      },
    },
  ],
}

export { buttonComponent }
