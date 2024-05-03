import React, { useEffect } from "react"
import styled from "@emotion/styled"
import { default as MuiAlert, AlertColor } from "@mui/material/Alert"
import { theme } from "../ThemeProvider/ThemeProvider"
import type { AlertProps as MuiAlertProps } from "@mui/material/Alert"
import { pxToRem } from "../ThemeProvider/typography"

type Colors = {
  [Severity in AlertColor]: string
}

const COLORS: Colors = {
  info: theme.custom.colors.blue,
  success: theme.custom.colors.green,
  warning: theme.custom.colors.orange,
  error: theme.custom.colors.lightRed,
}

type AlertStyleProps = {
  severity: AlertColor
}

const AlertStyled = styled(MuiAlert)<AlertStyleProps>(({ severity }) => ({
  padding: "11px 16px",
  borderRadius: 4,
  borderWidth: 2,
  borderStyle: "solid",
  borderColor: COLORS[severity],
  background: "#FFF",
  ".MuiAlert-message": {
    lineHeight: pxToRem(22),
    verticalAlign: "middle",
    fontSize: pxToRem(14),
    color: theme.custom.colors.darkGray2,
  },
  "> div": {
    paddingTop: 0,
    paddingBottom: 0,
  },
  ".MuiAlert-icon": {
    marginRight: 8,
    svg: {
      width: 16,
      fill: COLORS[severity],
    },
  },
  button: {
    padding: 0,
    ":hover": {
      margin: 0,
      background: "none",
    },
  },
}))

type AlertProps = {
  visible?: boolean
  closeable?: boolean
  className?: string
} & Pick<MuiAlertProps, "severity" | "children">

const Alert: React.FC<AlertProps> = ({
  visible = true,
  severity = "info",
  closeable,
  children,
  className,
}) => {
  const [open, setOpen] = React.useState(visible)

  const onCloseClick = () => {
    setOpen(false)
  }

  useEffect(() => {
    setOpen(visible)
  }, [visible])

  if (!open) {
    return null
  }

  return (
    <AlertStyled
      severity={severity!}
      onClose={closeable ? onCloseClick : undefined}
      role="alert"
      aria-description={`${severity} message`}
      className={className}
    >
      {children}
    </AlertStyled>
  )
}

export { Alert }
export type { AlertProps }
