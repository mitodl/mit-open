import "@mui/material/styles"

declare module "@mui/material/styles" {
  interface TypographyVariants {
    body1: React.CSSProperties
    body2: React.CSSProperties
    body3: React.CSSProperties
    body4: React.CSSProperties
    subtitle1: React.CSSProperties
    subtitle2: React.CSSProperties
    subtitle3: React.CSSProperties
    subtitle4: React.CSSProperties
    button: React.CSSProperties
  }
  interface TypographyVariantsOptions {
    body1: React.CSSProperties
    body2: React.CSSProperties
    body3: React.CSSProperties
    body4: React.CSSProperties
    subtitle1: React.CSSProperties
    subtitle2: React.CSSProperties
    subtitle3: React.CSSProperties
    subtitle4: React.CSSProperties
    button: React.CSSProperties
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
