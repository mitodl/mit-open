import type { ThemeOptions } from "@mui/material/styles"
import { createTheme } from "@mui/material/styles"

const BREAKPOINT_VALUES: ThemeOptions["breakpoints"] = {
  values: {
    xs: 0,
    sm: 600,
    md: 900,
    lg: 1280,
    xl: 1536,
  },
}

const { breakpoints } = createTheme({
  breakpoints: BREAKPOINT_VALUES,
  // @ts-expect-error only using breakpoints
  custom: {},
})

export { BREAKPOINT_VALUES, breakpoints }
