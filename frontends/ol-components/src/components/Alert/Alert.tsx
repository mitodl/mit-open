import React, { useEffect } from "react"
import { default as MuiAlert } from "@mui/material/Alert"

import type { AlertProps as MuiAlertProps } from "@mui/material/Alert"

type AlertProps = { visible?: boolean; closeable?: boolean } & Pick<
  MuiAlertProps,
  "severity" | "children"
>

const Alert: React.FC<AlertProps> = ({
  visible,
  severity,
  closeable,
  children,
}) => {
  visible = typeof visible === "undefined" || visible

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
    <MuiAlert
      severity={severity}
      onClose={closeable ? onCloseClick : undefined}
    >
      {children}
    </MuiAlert>
  )
}

export { Alert }
export type { AlertProps }
