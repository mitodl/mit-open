import React from "react"
import styled from "@emotion/styled"
import { RiErrorWarningLine } from "@remixicon/react"
import Typography from "@mui/material/Typography"

const Required = styled.span(({ theme }) => ({
  color: theme.custom.colors.lightRed,
  marginLeft: "4px",
}))

const Description = styled.div<{ error?: boolean }>(({ theme, error }) => [
  {
    ...theme.typography.body2,
    color: error
      ? theme.custom.colors.lightRed
      : theme.custom.colors.silverGrayDark,
  },
  error && {
    textIndent: "-24px",
    paddingLeft: "24px",

    "> svg:first-of-type": {
      marginRight: "4px",
      transform: "translateY(2px)",
      width: "18px",
      height: "18px",
      position: "relative",
      top: "2px",
    },
  },
])

const Container = styled.div<{ fullWidth?: boolean }>(({ fullWidth }) => [
  {
    display: "inline-flex",
    flexDirection: "column",
    alignItems: "start",
    "> *:not(:last-child)": {
      marginBottom: "4px",
    },
  },
  fullWidth && {
    width: "100%",
  },
])

type ControlLabelProps = {
  htmlFor: string
  label: React.ReactNode
  required?: boolean
  id?: string
  fullWidth?: boolean
}
const ControlLabel: React.FC<ControlLabelProps> = ({
  htmlFor,
  label,
  required,
  id,
  fullWidth,
}) => {
  return (
    <Typography
      id={id}
      component="label"
      htmlFor={htmlFor}
      variant="subtitle2"
      sx={{ marginBottom: "4px", width: fullWidth ? "100%" : "auto" }}
    >
      {label}
      {required ? <Required aria-hidden="true">*</Required> : null}
    </Typography>
  )
}

type FormFieldWrapperProps = {
  label: React.ReactNode
  required?: boolean
  helpText?: string
  error?: boolean
  errorText?: string
  className?: string
  fullWidth?: boolean
  /**
   * The id of the input element. If not provided, a unique id will be generated.
   */
  id?: string
  children: (childProps: {
    id: string
    required?: boolean
    error?: boolean
    fullWidth?: boolean
    labelId: string
    "aria-describedby"?: string
  }) => React.ReactNode
}

const FormFieldWrapper: React.FC<FormFieldWrapperProps> = ({
  label,
  required,
  helpText,
  error,
  errorText,
  className,
  fullWidth,
  id,
  children,
}) => {
  const fallbackInputId = React.useId()
  const inputId = id || fallbackInputId
  const helpId = React.useId()
  const errorId = React.useId()
  const labelId = React.useId()
  /**
   * aria-errormessage would be more semantic for the error message but has
   * somewhat limited support. See https://github.com/w3c/aria/issues/2048 for
   * some related information.
   */
  const describedBy =
    [helpText && helpId, error && errorText && errorId]
      .filter(Boolean)
      .join(" ") || undefined
  return (
    <Container className={className} fullWidth={fullWidth}>
      <ControlLabel
        htmlFor={inputId}
        id={labelId}
        label={label}
        required={required}
        fullWidth={fullWidth}
      />
      {children({
        id: inputId,
        error,
        required,
        labelId,
        fullWidth,
        "aria-describedby": describedBy,
      })}
      {helpText && <Description id={helpId}>{helpText}</Description>}
      {error && errorText && (
        <Description id={errorId} error>
          <RiErrorWarningLine fontSize="inherit" />
          {errorText}
        </Description>
      )}
    </Container>
  )
}

export { FormFieldWrapper, ControlLabel, Description }
export type { FormFieldWrapperProps, ControlLabelProps }
