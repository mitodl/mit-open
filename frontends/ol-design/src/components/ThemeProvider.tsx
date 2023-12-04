import React from "react"
import { createTheme } from "@mui/material/styles"
import { ThemeProvider as MuiThemeProvider } from "@mui/material/styles"

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
  fontFamilyDefault:
    '"Source Sans Pro", helvetica, arial, sans-serif !important',
  fontSizeSmall: 12,
  fontSizeNormal: 16,
  fontSizeH1: 24,
  fontSizeH2: 18,
  fontSizeH4: 14,
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

const themeOptions = {
  custom: custom,
  palette: {
    primary: {
      main: "#a31f34",
    },
    secondary: {
      main: "#03152d",
    },
  },
  breakpoints: {
    values: {
      // These match our theme breakpoints in breakpoints.scss
      xs: 0, // mui default
      sm: 600, // mui defailt
      md: 840, // custom
      lg: 1200, // mui default
      xl: 1536, // mui default
    },
  },
  components: {
    MuiButton: {
      defaultProps: { disableElevation: true },
    },
  },
}

/**
 * MaterialUI Theme for MIT Open
 */
const theme = createTheme(themeOptions)

type ThemeProviderProps = {
  children?: React.ReactNode
}

const ThemeProvider: React.FC<ThemeProviderProps> = ({ children }) => {
  return <MuiThemeProvider theme={theme}>{children}</MuiThemeProvider>
}

export type Theme = typeof themeOptions
export type ThemeProps = {
  theme?: typeof themeOptions
}

export { ThemeProvider }
export type { ThemeProviderProps }
