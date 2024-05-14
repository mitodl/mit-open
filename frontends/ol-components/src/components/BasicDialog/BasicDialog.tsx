import React, { useCallback, useState } from "react"
import Dialog from "@mui/material/Dialog"
import type { DialogProps } from "@mui/material/Dialog"
import DialogContent from "@mui/material/DialogContent"
import DialogTitle from "@mui/material/DialogTitle"
import { Button, ActionButton } from "../Button/Button"
import DialogActions from "@mui/material/DialogActions"
import Close from "@mui/icons-material/Close"

const topRightStyle: React.CSSProperties = {
  position: "absolute",
  top: 0,
  right: 0,
}

type BasicDialogProps = {
  className?: string
  open: boolean
  onClose: () => void
  /**
   * MUI Dialog's [TransitionProps](https://mui.com/material-ui/api/dialog/#props)
   */
  TransitionProps?: DialogProps["TransitionProps"]
  onConfirm?: () => void | Promise<void>
  title: string
  children?: React.ReactNode
  /**
   * The text to display on the cancel button. Defaults to "Cancel".
   */
  cancelText?: string
  /**
   * The text to display on the confirm button. Defaults to "Confirm".
   */
  confirmText?: string
  /**
   * Defaults to `true`. If `true`, dialog grows to `maxWidth`. See
   * [Dialog Props](https://mui.com/material-ui/api/dialog/#props).
   */
  fullWidth?: boolean
  /**
   * Whether to show the footer buttons. Defaults to `true`.
   */
  showFooter?: boolean
}

/**
 * A basic modal dialog.
 *
 * This is useful for things like confirmation or notifications, but not
 * particularly good for forms, where a <form /> element should wrap the inputs
 * and footer buttons.
 */
const BasicDialog: React.FC<BasicDialogProps> = ({
  title,
  children,
  open,
  onClose,
  onConfirm,
  cancelText = "Cancel",
  confirmText = "Confirm",
  fullWidth,
  className,
  showFooter = true,
}) => {
  const [confirming, setConfirming] = useState(false)
  const handleConfirm = useCallback(async () => {
    try {
      setConfirming(true)
      if (onConfirm) {
        await onConfirm()
      }
      onClose()
    } finally {
      setConfirming(false)
    }
  }, [onClose, onConfirm])
  return (
    <Dialog
      className={className}
      fullWidth={fullWidth}
      open={open}
      onClose={onClose}
    >
      <DialogTitle>{title}</DialogTitle>
      <div style={topRightStyle}>
        <ActionButton variant="text" color="secondary" onClick={onClose}>
          <Close />
        </ActionButton>
      </div>
      <DialogContent>{children}</DialogContent>
      {showFooter && (
        <DialogActions>
          <Button variant="outlined" onClick={onClose}>
            {cancelText}
          </Button>
          <Button
            variant="filled"
            onClick={handleConfirm}
            disabled={confirming}
          >
            {confirmText}
          </Button>
        </DialogActions>
      )}
    </Dialog>
  )
}

export { BasicDialog }
export type { BasicDialogProps }
