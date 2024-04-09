import "@mui/material/styles"

declare module "@mui/material/styles" {
  interface TypographyVariants {
    p1: React.CSSProperties
    p2: React.CSSProperties
    p3: React.CSSProperties
    p4: React.CSSProperties
    subtitle1: React.CSSProperties
    subtitle2: React.CSSProperties
    subtitle3: React.CSSProperties
    subtitle4: React.CSSProperties
    button: React.CSSProperties
  }
  interface TypographyVariantsOptions {
    p1?: React.CSSProperties
    p2?: React.CSSProperties
    p3?: React.CSSProperties
    p4?: React.CSSProperties
    subtitle1?: React.CSSProperties
    subtitle2?: React.CSSProperties
    subtitle3?: React.CSSProperties
    subtitle4?: React.CSSProperties
    button?: React.CSSProperties
  }
}

declare module "@mui/material/Typography" {
  interface TypographyPropsVariantOverrides {
    p1: true
    p2: true
    p3: true
    p4: true
    subtitle1: true
    subtitle2: true
    subtitle3: true
    subtitle4: true
    button: true
    body1: false
    body2: false
  }
}
