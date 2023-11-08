import React from "react"
import { createTheme } from "@mui/material/styles"
import { ThemeProvider as MuiThemeProvider } from "@mui/material/styles"

/**
 * MaterialUI Theme for MIT Open
 */
const muiTheme = createTheme({
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
})

type ThemeProviderProps = {
  children?: React.ReactNode
}

const ThemeProvider: React.FC<ThemeProviderProps> = ({ children }) => {
  return <MuiThemeProvider theme={muiTheme}>{children}</MuiThemeProvider>
}

export { ThemeProvider }
export type { ThemeProviderProps }
