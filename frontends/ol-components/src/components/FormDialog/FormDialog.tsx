import React, { useCallback, useEffect, useMemo, useState } from "react"
import styled from "@emotion/styled"
import { Dialog } from "../Dialog/Dialog"
import type { DialogProps } from "../Dialog/Dialog"

const FormContent = styled.div`
  display: flex;
  flex-direction: column;
  gap: 20px;
  width: 100%;
`
interface FormDialogProps {
  /**
   * Whether the dialog is currently open.
   */
  open: boolean
  /**
   * Dialog title.
   */
  title: string
  /**
   * Content (e.g., text) of confirm button in DialogActions
   */
  confirmText?: string
  /**
   * Content (e.g., text) of cancel button in DialogActions
   */
  cancelText?: string
  /**
   * Called when modal is closed.
   */
  onClose: () => void
  /**
   * Form submission handler.
   */
  onSubmit: (event: React.FormEvent<HTMLFormElement>) => void | Promise<void>
  /**
   * A callback to reset the form. Called automatically when `open` changes.
   */
  onReset: () => void
  /**
   * Sets `novalidate` on the `<form />` element.
   *
   * One scenario where this is useful is when we want to use JS to validate
   * form inputs but still semantically mark inputs as `<input required />`.
   */
  noValidate?: boolean
  /**
   * The form content. These will be direct children of MUI's [DialogContent](https://mui.com/material-ui/api/dialog-content/)
   */
  children?: React.ReactNode
  actions?: DialogProps["actions"]
  /**
   * Class applied to the `<form />` element.
   */
  formClassName?: string

  /**
   * If `true`, the dialog stretches to its `maxWidth`.
   *
   * See [fullWidth](https://mui.com/material-ui/api/dialog/#Dialog-prop-fullWidth)
   */
  fullWidth?: boolean

  className?: string
}

/**
 * A wrapper around the Dialog components to be used with forms. Includes a
 * `<form />` element as well as cancel and submit buttons.
 *
 * See Also
 * --------
 *  - {@link FormDialogProps}
 *  - [MUI Dialog](https://mui.com/material-ui/api/dialog/)
 *
 */
const FormDialog: React.FC<FormDialogProps> = ({
  open,
  onSubmit,
  onReset,
  onClose,
  fullWidth,
  title,
  noValidate,
  children,
  actions,
  confirmText = "Submit",
  cancelText = "Cancel",
  className,
}) => {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const handleSubmit: React.FormEventHandler<HTMLFormElement> = useCallback(
    async (event) => {
      setIsSubmitting(true)
      try {
        await onSubmit(event)
      } finally {
        setIsSubmitting(false)
      }
    },
    [onSubmit],
  )

  const paperProps = useMemo(() => {
    const props: DialogProps["PaperProps"] = {
      component: "form",
      // when component is "form", as above, PaperProps should include
      // `onSubmit` and other form properties but does not.
      // This is the recommended approach for ensuring modal form content is
      // scrollable within a MUI dialog. See https://github.com/mui/material-ui/issues/13253#issuecomment-512208440
      onSubmit: handleSubmit,
      noValidate,
    }
    return props
  }, [handleSubmit, noValidate])

  useEffect(() => {
    onReset()
  }, [open, onReset])

  return (
    <Dialog
      title={title}
      open={open}
      fullWidth={fullWidth}
      confirmText={confirmText}
      cancelText={cancelText}
      onClose={onClose}
      isSubmitting={isSubmitting}
      className={className}
      PaperProps={paperProps}
      actions={actions}
    >
      <FormContent>{children}</FormContent>
    </Dialog>
  )
}

export { FormDialog }
export type { FormDialogProps }
