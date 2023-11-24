import "bootstrap/dist/css/bootstrap-utilities.css"
import "../scss/combined.scss"

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
const theme = {
  ...colors,
  ...shadow,
  colorPrimary: colors.colorRed3,
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

export type Theme = typeof theme

export default theme
