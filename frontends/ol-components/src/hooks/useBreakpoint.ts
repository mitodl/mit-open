import useMediaQuery from "@mui/material/useMediaQuery"
import type { Theme, Breakpoint } from "@mui/material/styles"

/**
 * Returns true if the screen width is at least as wide as the given MUI
 * breakpoint width.
 */
const useMuiBreakpointAtLeast = (breakpoint: Breakpoint): boolean => {
  return useMediaQuery<Theme>((theme) => theme.breakpoints.up(breakpoint))
}

export { useMuiBreakpointAtLeast }
