import React from "react"
import {
  createTheme,
  ThemeProvider as MuiThemeProvider,
} from "@mui/material/styles"
import type { ThemeOptions } from "@mui/material/styles"
import type {} from "@mui/lab/themeAugmentation"
import * as typography from "./typography"
import * as buttons from "./buttons"
import * as inputs from "./inputs"

const colors = {
  colorGray1: "#fff",
  colorGray2: "#f0f5f7",
  colorGray3: "#b0b0b0",
  colorGray4: "#898a8b",
  colorGray5: "#000",
  colorRed1: "#e3d5d5",
  colorRed2: "#d6b2b3",
  colorRed3: "#a31f34",
  colorRed4: "#57081a",
  colorRed5: "#30020e",
  colorBlue1: "#edeff5",
  colorBlue3: "#126f9a",
  colorBlue4: "#0c1b66",
  colorBlue5: "#03152d",
}

const shadow = {
  shadowOffsetX: 3,
  shadowOffsetY: 4,
  shadowColor: "rgb(0 0 0 / 36%)",
  shadowBlurRadius: 12,
}

// To replace ../scss/theme.scss for #236 as we refactor it out
const custom = {
  ...colors,
  ...shadow,
  colorPrimary: colors.colorRed3,

  colorPrimaryTest: colors.colorRed3,

  colorSecondaryLight: colors.colorBlue1,
  colorSecondary: colors.colorBlue5,
  colorBackground: colors.colorBlue1,
  colorBackgroundLight: colors.colorGray1,
  fontColorLight: colors.colorGray3,
  fontColorDefault: colors.colorBlue5,
  fontFamilyDefault: "Roboto, helvetica, arial, sans-serif !important",
  fontSizeSmall: 12,
  fontSizeNormal: 16,
  fontSizeH1: "1.5rem",
  fontSizeH2: "1.125rem",
  fontSizeH4: "1rem",
  fontWeightBold: "bold",
  fontWeightSemiBold: "400",
  transitionDuration: "300ms",
  borderRadius: 5,
  shadow: `${shadow.shadowOffsetX} ${shadow.shadowOffsetY} ${shadow.shadowBlurRadius} ${shadow.shadowColor}`,
  shadowOverflowTop: shadow.shadowBlurRadius - shadow.shadowOffsetX,
  shadowOverflowBottom: shadow.shadowBlurRadius + shadow.shadowOffsetY,
  channelAvatarBg: "#2aab8b",
  fontBlack: "rgb(0 0 0 / 87%)",
  stdBorderRadius: 3,
  validationBg: "#ffe8ec",
  validationText: "#f07183",
  fontGreyLight: "#b0b0b0",
  inputBorderGrey: "#b7b7b7",
  navy: "#03152d",
  linkBlue: "#0b51bf",
  fontXxxl: "2rem",
  fontXxl: "1.75rem",
  fontXl: "1.5rem",
  fontLg: "1.25rem",
  fontMd: "1.125rem",
  fontNormal: "1rem",
  fontSm: "0.875rem",
  fontXs: "0.75rem",
  muiAppBarZIndex: "11000",
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
    primary: {
      main: "#a31f34",
    },
    secondary: {
      main: "#03152d",
    },
  },
  shape: {
    borderRadius: 8,
  },
  typography: typography.globalSettings,
  breakpoints: BREAKPOINTS,
  components: {
    MuiButton: buttons.buttonComponent,
    MuiTypography: typography.component,
    MuiInputBase: inputs.inputBaseComponent,
    MuiOutlinedInput: inputs.outlinedInputComponent,
    MuiTabPanel: {
      styleOverrides: {
        root: {
          paddingLeft: "0px",
          paddingRight: "0px",
        },
      },
    },
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

export type Theme = typeof themeOptions

export { ThemeProvider }
export type { ThemeProviderProps }
