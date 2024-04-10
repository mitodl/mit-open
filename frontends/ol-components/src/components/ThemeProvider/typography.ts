import type { ThemeOptions } from "@mui/material/styles"

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

const styles = {
  h1: {
    fontWeight: 700,
    fontSize: pxToRem(56),
  },
  h2: {
    fontWeight: 700,
    fontSize: pxToRem(40),
  },
  h3: {
    fontWeight: 700,
    fontSize: pxToRem(32),
  },
  h4: {
    fontWeight: 700,
    fontSize: pxToRem(24),
  },
  h5: {
    fontWeight: 500,
    fontSize: pxToRem(16),
  },
  subtitle1: {
    fontWeight: 500,
    fontSize: pxToRem(16),
    lineHeight: 1.75,
  },
  subtitle2: {
    fontWeight: 500,
    fontSize: pxToRem(14),
    lineHeight: 1.57,
  },
  subtitle3: {
    fontWeight: 500,
    fontSize: pxToRem(12),
    lineHeight: 1.41,
  },
  subtitle4: {
    fontWeight: 500,
    fontSize: pxToRem(10),
    lineHeight: 1.26,
  },
  p1: {
    fontSize: pxToRem(16),
  },
  p2: {
    fontSize: pxToRem(14),
  },
  p3: {
    fontSize: pxToRem(12),
  },
  p4: {
    fontSize: pxToRem(10),
  },
  button: {
    textTransform: "none",
  },
} as const

const globalSettings: ThemeOptions["typography"] = {
  fontFamily: ['"Helvetica Neue"', "Arial", "sans-serif"].join(","),
  ...styles,
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

export { globalSettings, component, pxToRem }
