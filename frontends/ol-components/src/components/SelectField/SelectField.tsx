import React from "react"
import MuiSelect from "@mui/material/Select"
import type {
  SelectProps as MuiSelectProps,
  SelectChangeEvent,
} from "@mui/material/Select"
import { Input } from "../Input/Input"
import { FormFieldWrapper } from "../FormHelpers/FormHelpers"
import type { FormFieldWrapperProps } from "../FormHelpers/FormHelpers"

type SelectProps<Value = unknown> = Omit<MuiSelectProps<Value>, "input">

function Select<Value = unknown>(props: SelectProps<Value>) {
  return (
    <MuiSelect
      variant="standard"
      {...props}
      input={<Input size={props.size} />}
    />
  )
}

type SelectFieldProps = Omit<FormFieldWrapperProps, "children"> & SelectProps

const SelectField: React.FC<SelectFieldProps> = ({
  label,
  required,
  className,
  id,
  fullWidth,
  error,
  errorText,
  helpText,
  ...props
}) => {
  const wrapperProps = {
    label,
    required,
    className,
    id,
    fullWidth,
    error,
    errorText,
    helpText,
  }
  return (
    <FormFieldWrapper {...wrapperProps}>
      {(childProps) => (
        <Select displayEmpty label={label} {...childProps} {...props} />
      )}
    </FormFieldWrapper>
  )
}

export { Select, SelectField }
export type { SelectChangeEvent, SelectProps, SelectFieldProps }
