// To replace ../../assets/breakpoint.scss for #236 as we refactor it out

const spacer = 0.05

// Alert! If you change these values, change them in mui.ts, too.
const breakpoints = {
  xs: 0,
  sm: 600,
  md: 840,
  lg: 1200,
  xl: 1536,
  xsDown: 0 - spacer,
  smDown: 600 - spacer,
  mdDown: 840 - spacer,
  lgDown: 1200 - spacer,
  xlDown: 1536 - spacer,
}

export const mediaQueries = {
  down: (breakpoint: keyof typeof breakpoints) => {
    return `@media (max-width: ${breakpoints[breakpoint]}px)`
  },
  up: (breakpoint: keyof typeof breakpoints) => {
    return `@media (min-width: ${breakpoints[breakpoint]}px)`
  },
}
console.log("mediaQueries", mediaQueries)
