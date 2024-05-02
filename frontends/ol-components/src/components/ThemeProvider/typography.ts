import type { ThemeOptions } from "@mui/material/styles"
import { createTheme } from "@mui/material/styles"

/**
 * This function converts from pixels to rems, assuming a base font size of 16px
 * (which is the default for most modern browsers).
 *
 * Using this function, we can:
 * - match desgins that are in pixels for default font size
 * - allow users to scale the font size up or down by chaning base font size.
 *
 * For example, a Chrome user might specify a base font size of 20px ("large")
 * in their browser settings. Then, `pxToRem(32)` would actually be 40px for
 * that user.
 */
const pxToRem = (px: number) => `${px / 16}rem`

const globalSettings: ThemeOptions["typography"] = {
  fontFamily: ['"Helvetica Neue"', "Arial", "sans-serif"].join(","),
  h1: {
    fontWeight: 700,
    fontSize: pxToRem(56),
    lineHeight: pxToRem(64),
  },
  h2: {
    fontWeight: 700,
    fontSize: pxToRem(40),
    lineHeight: pxToRem(48),
  },
  h3: {
    fontWeight: 700,
    fontSize: pxToRem(32),
    lineHeight: pxToRem(40),
  },
  h4: {
    fontWeight: 700,
    fontSize: pxToRem(24),
    lineHeight: pxToRem(30),
  },
  h5: {
    fontWeight: 500,
    fontSize: pxToRem(20),
    lineHeight: pxToRem(26),
  },
  subtitle1: {
    fontWeight: 500,
    fontSize: pxToRem(16),
    lineHeight: pxToRem(20),
  },
  subtitle2: {
    fontWeight: 500,
    fontSize: pxToRem(14),
    lineHeight: pxToRem(18),
  },
  subtitle3: {
    fontWeight: 500,
    fontSize: pxToRem(12),
    lineHeight: pxToRem(16),
  },
  subtitle4: {
    fontWeight: 500,
    fontSize: pxToRem(10),
    lineHeight: pxToRem(14),
  },
  body1: {
    fontSize: pxToRem(16),
  },
  body2: {
    fontSize: pxToRem(14),
  },
  body3: {
    fontSize: pxToRem(12),
  },
  body4: {
    fontSize: pxToRem(10),
  },
  button: {
    textTransform: "none",
  },
}
const component: NonNullable<ThemeOptions["components"]>["MuiTypography"] = {
  defaultProps: {
    variantMapping: {
      body1: "p",
      body2: "p",
      body3: "p",
      body4: "p",
      subtitle1: "p",
      subtitle2: "p",
      subtitle3: "p",
      subtitle4: "p",
      button: "span",
    },
  },
}

const { typography } = createTheme({
  typography: globalSettings,
  // @ts-expect-error: we only care about typography from this theme
  custom: {},
})

export { globalSettings, component, pxToRem, typography }
