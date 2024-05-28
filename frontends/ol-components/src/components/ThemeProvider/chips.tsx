import React from "react"
import type { ThemeOptions } from "@mui/material/styles"
import { colors } from "./colors"
import { RiCloseLine } from "@remixicon/react"

const chipComponent: NonNullable<ThemeOptions["components"]>["MuiChip"] = {
  defaultProps: {
    size: "medium",
    color: "default",
    variant: "outlined",
    deleteIcon: <RiCloseLine aria-hidden="true" />,
  },
  styleOverrides: {
    root: {
      borderRadius: "100vh",
      borderWidth: "1px",
    },
    deleteIcon: {
      "&:hover": {
        color: "inherit",
      },
      "&.MuiChip-deleteIconLarge": {
        width: "16px",
        height: "16px",
      },
      "&.MuiChip-deleteIconMedium": {
        width: "14px",
        height: "14px",
      },
      margin: "0 -2px 0 8px",
      color: "inherit",
    },
    icon: {
      margin: "0 8px 0 -2px",
      color: "inherit",
      "&.MuiChip-iconLarge": {
        width: "16px",
        height: "16px",
      },
      "&.MuiChip-iconMedium": {
        width: "14px",
        height: "14px",
      },
    },
  },
  variants: [
    {
      props: { size: "medium" },
      style: ({ theme }) => ({
        ...theme.typography.body3,
        boxSizing: "border-box",
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
      props: { variant: "outlined" },
      style: {
        borderColor: colors.silverGrayLight,
        color: colors.darkGray1,
        "&.MuiChip-clickable:hover, &.MuiChip-deletable:hover": {
          color: colors.darkGray1,
          borderColor: colors.silverGrayDark,
          backgroundColor: "transparent", // mui has a default background color for hover
        },
      },
    },
    {
      props: { variant: "outlinedWhite" },
      style: {
        backgroundColor: "white",
        border: "1px solid",
        borderColor: colors.silverGrayLight,
        color: colors.darkGray1,
        "&.MuiChip-clickable:hover, &.MuiChip-deletable:hover": {
          color: colors.darkGray1,
          borderColor: colors.silverGrayDark,
          backgroundColor: "white", // mui has a default background color hover
        },
      },
    },
    {
      props: { variant: "gray" },
      style: {
        backgroundColor: colors.lightGray2,
        border: "none",
        color: colors.darkGray2,
        "&.MuiChip-clickable:hover, &.MuiChip-deletable:hover": {
          color: colors.darkGray1,
          backgroundColor: colors.silverGrayLight,
        },
      },
    },
    {
      props: { variant: "dark" },
      style: {
        backgroundColor: colors.silverGrayDark,
        border: "none",
        color: colors.white,
        "&.MuiChip-clickable:hover, &.MuiChip-deletable:hover": {
          backgroundColor: colors.darkGray1,
        },
      },
    },
    {
      props: { variant: "filled" },
      style: {
        backgroundColor: colors.mitRed,
        border: "none",
        color: colors.white,
        "&.MuiChip-clickable:hover, &.MuiChip-deletable:hover": {
          backgroundColor: colors.red,
        },
      },
    },
  ],
}

export { chipComponent }
