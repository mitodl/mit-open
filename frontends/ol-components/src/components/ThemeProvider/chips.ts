import type { ThemeOptions } from "@mui/material/styles"
import * as colors from "./colors"

const chipComponent: NonNullable<ThemeOptions["components"]>["MuiChip"] = {
  defaultProps: { size: "medium" },
  styleOverrides: {
    root: {
      borderRadius: "100vh",
      borderWidth: "1px",
    },
  },
  variants: [
    {
      props: { color: "default" },
      style: {
        borderColor: colors.LIGHT_GRAY_2,
        "&.MuiChip-clickable:hover, &.MuiChip-clickable:focus": {
          backgroundColor: colors.LIGHT_GRAY_2,
        },
        "&.MuiChip-deletable:hover, &.MuiChip-deletable:focus": {
          backgroundColor: colors.LIGHT_GRAY_2,
        },
      },
    },
    {
      props: { color: "primary" },
      style: ({ theme }) => {
        return {
          "&.MuiChip-clickable:hover, &.MuiChip-clickable:focus": {
            backgroundColor: theme.palette.primary.active,
          },
          "&.MuiChip-deletable:hover, &.MuiChip-deletable:focus": {
            backgroundColor: theme.palette.primary.active,
          },
        }
      },
    },
    {
      props: { size: "medium" },
      style: {
        height: "24px",
        ".MuiChip-label": {
          paddingLeft: "12px",
          paddingRight: "12px",
        },
      },
    },
    {
      props: { size: "large" },
      style: {
        height: "32px",
        ".MuiChip-label": {
          paddingLeft: "16px",
          paddingRight: "16px",
        },
      },
    },
  ],
}

export { chipComponent }
