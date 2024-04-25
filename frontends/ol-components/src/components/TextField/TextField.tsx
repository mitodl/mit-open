import React from "react"
import { Input } from "../Input/Input"
import type { InputProps } from "../Input/Input"
import { FormFieldWrapper } from "../FormHelpers/FormHelpers"
import type { FormFieldWrapperProps } from "../FormHelpers/FormHelpers"

type TextFieldProps = Omit<FormFieldWrapperProps, "children"> & {
  name: string
  disabled?: boolean
  value?: string | null
  size?: InputProps["size"]
  placeholder?: string
  onChange?: React.ChangeEventHandler<HTMLInputElement>
  onBlur?: React.FocusEventHandler<HTMLInputElement>
  multiline?: boolean
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
  return (
    <FormFieldWrapper
      id={id}
      label={label}
      required={required}
      helpText={helpText}
      error={error}
      errorText={errorText}
      className={className}
      fullWidth
    >
      {({ labelId, ...childProps }) => (
        <Input
          size={size}
          value={value}
          name={name}
          placeholder={placeholder}
          onChange={onChange}
          onBlur={onBlur}
          multiline={multiline}
          type={type}
          startAdornment={startAdornment}
          endAdornment={endAdornment}
          minRows={minRows}
          disabled={disabled}
          inputProps={inputProps}
          {...InputProps}
          {...childProps}
        />
      )}
    </FormFieldWrapper>
  )
}

export { TextField }
export type { TextFieldProps }
