import "@mui/material/styles"

declare module "@mui/material/styles" {
  interface TypographyVariants {
    h1: React.CSSProperties
    h2: React.CSSProperties
    h3: React.CSSProperties
    h4: React.CSSProperties
    h5: React.CSSProperties
    body1: React.CSSProperties
    body2: React.CSSProperties
    body3: React.CSSProperties
    body4: React.CSSProperties
    subtitle1: React.CSSProperties
    subtitle2: React.CSSProperties
    subtitle3: React.CSSProperties
    subtitle4: React.CSSProperties
    buttonLarge: React.CSSProperties
    button: React.CSSProperties
    buttonSmall: React.CSSProperties
  }
  interface TypographyVariantsOptions {
    h1: React.CSSProperties
    h2: React.CSSProperties
    h3: React.CSSProperties
    h4: React.CSSProperties
    h5: React.CSSProperties
    body1: React.CSSProperties
    body2: React.CSSProperties
    body3: React.CSSProperties
    body4: React.CSSProperties
    subtitle1: React.CSSProperties
    subtitle2: React.CSSProperties
    subtitle3: React.CSSProperties
    subtitle4: React.CSSProperties
    buttonLarge: React.CSSProperties
    button: React.CSSProperties
    buttonSmall: React.CSSProperties
  }
}

declare module "@mui/material/Typography" {
  interface TypographyPropsVariantOverrides {
    body1: true
    body2: true
    body3: true
    body4: true
    subtitle1: true
    subtitle2: true
    subtitle3: true
    subtitle4: true
    button: true
  }
}
