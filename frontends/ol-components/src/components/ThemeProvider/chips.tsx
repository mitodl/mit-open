import React from "react"
import type { ThemeOptions } from "@mui/material/styles"
import { colors } from "./colors"
import tinycolor from "tinycolor2"
import ClearIcon from "@mui/icons-material/Clear"

const chipComponent: NonNullable<ThemeOptions["components"]>["MuiChip"] = {
  defaultProps: {
    size: "medium",
    deleteIcon: <ClearIcon />,
  },
  styleOverrides: {
    root: {
      borderRadius: "100vh",
      borderWidth: "1px",
    },
    deleteIcon: {
      fontSize: "1.25em",
      margin: "0 -2px 0 8px",
    },
    icon: {
      fontSize: "1.25em",
      margin: "0 8px 0 -2px",
    },
  },
  variants: [
    {
      props: { size: "medium" },
      style: ({ theme }) => ({
        ...theme.typography.body3,
        height: "24px",
        paddingRight: "12px",
        paddingLeft: "12px",
        ".MuiChip-label": {
          paddingLeft: "0px",
          paddingRight: "0px",
        },
      }),
    },
    {
      props: { size: "large" },
      style: ({ theme }) => ({
        ...theme.typography.body2,
        height: "32px",
        paddingLeft: "16px",
        paddingRight: "16px",
        ".MuiChip-label": {
          paddingLeft: "0px",
          paddingRight: "0px",
        },
      }),
    },
    {
      props: { color: "default" },
      style: {
        borderColor: colors.lightGray2,
        color: colors.silverGrayDark,
        "&.MuiChip-clickable:hover, &.MuiChip-deletable:hover": {
          clor: colors.darkGray2,
          backgroundColor: colors.lightGray2,
        },
      },
    },
    {
      props: { color: "primary", variant: "filled" },
      style: ({ theme }) => {
        return {
          "&.MuiChip-clickable:hover, &.MuiChip-deletable:hover": {
            backgroundColor: theme.palette.primary.active,
          },
          "&.MuiChip-clickable:focus-visible, &.MuiChip-deletable:focus-visible":
            {
              backgroundColor: theme.palette.primary.active,
            },
        }
      },
    },
    {
      props: { color: "primary", variant: "outlined" },
      style: ({ theme }) => ({
        "&.MuiChip-clickable:hover, &.MuiChip-deletable:hover": {
          backgroundColor: tinycolor(theme.palette.primary.main)
            .setAlpha(0.06)
            .toRgbString(),
        },
      }),
    },
    {
      props: { color: "secondary", variant: "filled" },
      style: ({ theme }) => {
        return {
          "&.MuiChip-clickable:hover, &.MuiChip-deletable:hover": {
            backgroundColor: theme.palette.secondary.active,
          },
          "&.MuiChip-clickable:focus-visible, &.MuiChip-deletable:focus-visible":
            {
              backgroundColor: theme.palette.secondary.active,
            },
        }
      },
    },
    {
      props: { color: "secondary", variant: "outlined" },
      style: ({ theme }) => ({
        "&.MuiChip-clickable:hover, &.MuiChip-deletable:hover": {
          backgroundColor: tinycolor(theme.palette.secondary.main)
            .setAlpha(0.06)
            .toRgbString(),
        },
      }),
    },
  ],
}

export { chipComponent }
