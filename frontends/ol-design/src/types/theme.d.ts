import "@mui/material/styles"
import "@emotion/react"

interface CustomTheme {
  colorGray1: string
  colorGray2: string
  colorGray3: string
  colorGray4: string
  colorGray5: string
  colorRed1: string
  colorRed2: string
  colorRed3: string
  colorRed4: string
  colorRed5: string
  colorBlue1: string
  colorBlue3: string
  colorBlue4: string
  colorBlue5: string

  shadowOffsetX: number
  shadowOffsetY: number
  shadowColor: string
  shadowBlurRadius: number

  colorPrimary: string
  colorSecondaryLight: string
  colorSecondary: string
  colorBackground: string
  colorBackgroundLight: string
  fontColorLight: string
  fontColorDefault: string
  fontFamilyDefault: string
  fontSizeSmall: number
  fontSizeNormal: number
  fontSizeH1: number
  fontSizeH2: number
  fontSizeH4: number
  fontWeightBold: string
  fontWeightSemiBold: string
  transitionDuration: string
  borderRadius: number
  shadow: string
  shadowOverflowTop: number
  shadowOverflowBottom: number
  channelAvatarBg: string
  fontBlack: string
  stdBorderRadius: number
  validationBg: string
  validationText: string
  fontGreyLight: string
  inputBorderGrey: string
  navy: string
  linkBlue: string
  fontXxxl: string
  fontXxl: string
  fontXl: string
  fontLg: string
  fontMd: string
  fontNormal: string
  fontSm: string
  fontXs: string
  muiAppBarZIndex: string
}

declare module "@mui/material/styles" {
  interface Theme {
    custom: CustomTheme
  }

  interface ThemeOptions {
    custom: CustomTheme
  }
}

declare module "@emotion/react" {
  export interface Theme {
    custom: CustomTheme
  }
}
