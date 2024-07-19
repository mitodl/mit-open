import React, { useCallback, useState } from "react"
import styled from "@emotion/styled"
import { theme } from "../ThemeProvider/ThemeProvider"
import { default as MuiDialog } from "@mui/material/Dialog"
import type { DialogProps as MuiDialogProps } from "@mui/material/Dialog"
import { Button, ActionButton } from "../Button/Button"
import DialogActions from "@mui/material/DialogActions"
import { RiCloseLine } from "@remixicon/react"
import Typography from "@mui/material/Typography"

const Close = styled.div`
  position: absolute;
  top: 11px;
  right: 20px;
`

const Header = styled.div`
  border-bottom: 1px solid ${theme.custom.colors.lightGray2};
  background-color: ${theme.custom.colors.lightGray1};
  padding: 20px 58px 20px 28px;
`

const Content = styled.div`
  margin: 28px 28px 40px 28px;
`

const Actions = styled(DialogActions)`
  margin: 0 28px 28px 28px;
  padding: 0;
  gap: 4px;
  button {
    margin-left: 0;
  }
`

type DialogProps = {
  className?: string
  open: boolean
  onClose: () => void
  /**
   * MUI Dialog's [TransitionProps](https://mui.com/material-ui/api/dialog/#props)
   */
  TransitionProps?: MuiDialogProps["TransitionProps"]
  onConfirm?: () => void | Promise<void>
  title: string
  message?: string
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
const Dialog: React.FC<DialogProps> = ({
  title,
  children,
  message,
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
    <MuiDialog
      className={className}
      fullWidth={fullWidth}
      open={open}
      onClose={onClose}
    >
      <Close>
        <ActionButton variant="text" color="primary" onClick={onClose}>
          <RiCloseLine />
        </ActionButton>
      </Close>
      <Header>
        <Typography variant="h5">{title}</Typography>
      </Header>
      <Content>
        {message && <Typography variant="body1">{message}</Typography>}
        {children}
      </Content>
      {showFooter && (
        <Actions>
          <Button variant="secondary" onClick={onClose}>
            {cancelText}
          </Button>
          <Button
            variant="primary"
            onClick={handleConfirm}
            disabled={confirming}
          >
            {confirmText}
          </Button>
        </Actions>
      )}
    </MuiDialog>
  )
}

export { Dialog }
export type { DialogProps }
