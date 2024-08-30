import type { ThemeOptions } from "@mui/material/styles"
import { createTheme } from "@mui/material/styles"

const fontWeights = {
  text: {
    roman: 400,
    medium: 500,
    bold: 700,
  },
}

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
  // Note: Figma calls this "Neue Haas Grotesk Text", but that is incorrect based on Adobe's font family.
  fontFamily: "neue-haas-grotesk-text, sans-serif",
  fontWeightLight: fontWeights.text.roman,
  fontWeightRegular: fontWeights.text.roman,
  fontWeightMedium: fontWeights.text.medium,
  fontWeightBold: fontWeights.text.bold,
  h1: {
    fontFamily: "neue-haas-grotesk-text, sans-serif",
    fontWeight: fontWeights.text.bold,
    fontStyle: "normal",
    fontSize: pxToRem(52),
    lineHeight: pxToRem(60),
  },
  h2: {
    fontFamily: "neue-haas-grotesk-text, sans-serif",
    fontWeight: fontWeights.text.bold,
    fontStyle: "normal",
    fontSize: pxToRem(34),
    lineHeight: pxToRem(40),
  },
  h3: {
    fontFamily: "neue-haas-grotesk-text, sans-serif",
    fontWeight: fontWeights.text.bold,
    fontStyle: "normal",
    fontSize: pxToRem(28),
    lineHeight: pxToRem(36),
  },
  h4: {
    fontFamily: "neue-haas-grotesk-text, sans-serif",
    fontWeight: fontWeights.text.bold,
    fontStyle: "normal",
    fontSize: pxToRem(24),
    lineHeight: pxToRem(30),
  },
  h5: {
    fontFamily: "neue-haas-grotesk-text, sans-serif",
    fontWeight: fontWeights.text.medium,
    fontStyle: "normal",
    fontSize: pxToRem(18),
    lineHeight: pxToRem(22),
  },
  subtitle1: {
    fontFamily: "neue-haas-grotesk-text, sans-serif",
    fontWeight: fontWeights.text.medium,
    fontStyle: "normal",
    fontSize: pxToRem(16),
    lineHeight: pxToRem(20),
  },
  subtitle2: {
    fontFamily: "neue-haas-grotesk-text, sans-serif",
    fontWeight: fontWeights.text.medium,
    fontStyle: "normal",
    fontSize: pxToRem(14),
    lineHeight: pxToRem(18),
  },
  subtitle3: {
    fontFamily: "neue-haas-grotesk-text, sans-serif",
    fontWeight: fontWeights.text.medium,
    fontStyle: "normal",
    fontSize: pxToRem(12),
    lineHeight: pxToRem(16),
  },
  subtitle4: {
    fontFamily: "neue-haas-grotesk-text, sans-serif",
    fontWeight: fontWeights.text.medium,
    fontStyle: "normal",
    fontSize: pxToRem(10),
    lineHeight: pxToRem(14),
  },
  body1: {
    fontFamily: "neue-haas-grotesk-text, sans-serif",
    fontWeight: fontWeights.text.roman,
    fontStyle: "normal",
    fontSize: pxToRem(16),
    lineHeight: pxToRem(20),
  },
  body2: {
    fontFamily: "neue-haas-grotesk-text, sans-serif",
    fontWeight: fontWeights.text.roman,
    fontStyle: "normal",
    fontSize: pxToRem(14),
    lineHeight: pxToRem(18),
  },
  body3: {
    fontFamily: "neue-haas-grotesk-text, sans-serif",
    fontWeight: fontWeights.text.roman,
    fontStyle: "normal",
    fontSize: pxToRem(12),
    lineHeight: pxToRem(16),
  },
  body4: {
    fontFamily: "neue-haas-grotesk-text, sans-serif",
    fontWeight: fontWeights.text.roman,
    fontStyle: "normal",
    fontSize: pxToRem(10),
    lineHeight: pxToRem(14),
  },
  buttonLarge: {
    fontFamily: "neue-haas-grotesk-text, sans-serif",
    fontWeight: fontWeights.text.medium,
    fontStyle: "normal",
    fontSize: pxToRem(16),
    lineHeight: pxToRem(20),
  },
  button: {
    fontFamily: "neue-haas-grotesk-text, sans-serif",
    fontWeight: fontWeights.text.medium,
    fontStyle: "normal",
    fontSize: pxToRem(14),
    lineHeight: pxToRem(18),
    textTransform: "none",
  },
  buttonSmall: {
    fontFamily: "neue-haas-grotesk-text, sans-serif",
    fontWeight: fontWeights.text.medium,
    fontStyle: "normal",
    fontSize: pxToRem(12),
    lineHeight: pxToRem(16),
  },
}
const component: NonNullable<ThemeOptions["components"]>["MuiTypography"] = {
  defaultProps: {
    variantMapping: {
      h1: "span",
      h2: "span",
      h3: "span",
      h4: "span",
      h5: "span",
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
