import React from "react"
import {
  createTheme,
  ThemeProvider as MuiThemeProvider,
} from "@mui/material/styles"
import type { ThemeOptions, Theme } from "@mui/material/styles"
import type {} from "@mui/lab/themeAugmentation"
import * as typography from "./typography"
import * as buttons from "./buttons"
import * as chips from "./chips"
import { colors } from "./colors"

const shadow = {
  shadowOffsetX: 3,
  shadowOffsetY: 4,
  shadowColor: "rgb(0 0 0 / 36%)",
  shadowBlurRadius: 12,
}

// To replace ../scss/theme.scss for #236 as we refactor it out
const custom: ThemeOptions["custom"] = {
  transitionDuration: "300ms",
  shadow: `${shadow.shadowOffsetX} ${shadow.shadowOffsetY} ${shadow.shadowBlurRadius} ${shadow.shadowColor}`,
  colors,
}

const BREAKPOINTS = {
  values: {
    xs: 0,
    sm: 600,
    md: 900,
    lg: 1280,
    xl: 1536,
  },
}

const themeOptions: ThemeOptions = {
  custom: custom,
  palette: {
    action: {
      disabled: colors.lightGray2,
    },
    text: {
      primary: "#000",
      secondary: colors.silverGrayDark,
    },
    primary: {
      main: colors.mitRed,
      light: colors.lightRed,
      active: colors.red,
      contrastText: colors.white,
    },
    secondary: {
      light: colors.lightGray2,
      active: colors.silverGrayDark,
      main: colors.black,
      contrastText: colors.white,
    },
  },
  shape: {
    borderRadius: 8,
  },
  spacing: 8,
  typography: typography.globalSettings,
  breakpoints: BREAKPOINTS,
  components: {
    MuiButtonBase: buttons.buttonBaseComponent,
    MuiTypography: typography.component,
    MuiTabPanel: {
      styleOverrides: {
        root: {
          paddingLeft: "0px",
          paddingRight: "0px",
        },
      },
    },
    MuiChip: chips.chipComponent,
  },
}

/**
 * MaterialUI Theme for MIT Open
 */
export const theme = createTheme(themeOptions)

type ThemeProviderProps = {
  children?: React.ReactNode
}

const ThemeProvider: React.FC<ThemeProviderProps> = ({ children }) => {
  return <MuiThemeProvider theme={theme}>{children}</MuiThemeProvider>
}

export { ThemeProvider }
export type { ThemeProviderProps, Theme }
