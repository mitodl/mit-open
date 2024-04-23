import React from "react"
import { Input } from "../Input/Input"
import type { InputProps } from "../Input/Input"
import styled from "@emotion/styled"
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined"

type TextFieldProps = {
  label: React.ReactNode
  value?: string | null
  name: string
  size?: InputProps["size"]
  placeholder?: string
  helpText?: React.ReactNode
  error?: boolean
  errorText?: React.ReactNode
  required?: boolean
  disabled?: boolean
  onChange?: React.ChangeEventHandler<HTMLInputElement>
  onBlur?: React.FocusEventHandler<HTMLInputElement>
  multiline?: boolean
  /**
   * The id of the input element. If not provided, a unique id will be generated.
   */
  id?: string
  className?: string
  fullWidth?: boolean
  /**
   * Props forwarded to root of <Input />
   */
  InputProps?: InputProps
} & Pick<
  InputProps,
  | "type"
  | "startAdornment"
  | "endAdornment"
  | "multiline"
  | "required"
  | "minRows"
  | "inputProps"
>

const FormLabel = styled.label(({ theme }) => ({
  ...theme.typography.subtitle2,
}))
const Required = styled.span(({ theme }) => ({
  color: theme.custom.colors.lightRed,
  marginLeft: "4px",
}))

const Description = styled.div<{ error?: boolean }>(({ theme, error }) => [
  {
    ...theme.typography.body2,
    color: error
      ? theme.custom.colors.lightRed
      : theme.custom.colors.silverGray2,
  },
  error && {
    "> svg:first-of-type": {
      marginRight: "4px",
      transform: "translateY(2px)",
    },
  },
])

const Container = styled.div({
  display: "flex",
  flexDirection: "column",
  "> *": {
    marginBottom: "4px",
  },
})

const TextField: React.FC<TextFieldProps> = ({
  label,
  size,
  value,
  name,
  placeholder,
  helpText,
  errorText,
  error,
  required,
  disabled,
  onChange,
  onBlur,
  multiline,
  type,
  startAdornment,
  endAdornment,
  minRows,
  className,
  id,
  InputProps,
  inputProps,
}) => {
  const fallbackInputId = React.useId()
  const inputId = id || fallbackInputId
  const helpId = React.useId()
  const errorId = React.useId()
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
    <Container className={className}>
      <FormLabel htmlFor={inputId}>
        {label}
        {required ? <Required aria-hidden="true">*</Required> : null}
      </FormLabel>
      <Input
        id={inputId}
        type={type}
        multiline={multiline}
        value={value}
        name={name}
        error={error}
        placeholder={placeholder}
        required={required}
        disabled={disabled}
        onChange={onChange}
        onBlur={onBlur}
        size={size}
        startAdornment={startAdornment}
        endAdornment={endAdornment}
        minRows={minRows}
        aria-describedby={describedBy}
        /**
         * These allow for our custom TextField to be used with MUI's Autocomplete
         */
        inputProps={inputProps}
        {...InputProps}
      />
      {helpText && <Description id={helpId}>{helpText}</Description>}
      {error && errorText && (
        <Description id={errorId} error>
          <InfoOutlinedIcon fontSize="inherit" />
          {errorText}
        </Description>
      )}
    </Container>
  )
}

export { TextField }
export type { TextFieldProps }
