import React from "react"
import { Select, SelectField } from "../SelectField/SelectField"
import type { SelectProps, SelectFieldProps } from "../SelectField/SelectField"
import { MenuItem } from "../MenuItem/MenuItem"

type SimpleSelectProps = Pick<
  SelectProps<string | string[]>,
  | "value"
  | "size"
  | "multiple"
  | "onChange"
  | "renderValue"
  | "className"
  | "name"
> & {
  /**
   * The options for the dropdown
   */
  options: SimpleSelectOption[]
}

interface SimpleSelectOption {
  /**
   * value for the dropdown option
   */
  value: string
  /**
   * label for the dropdown option
   */
  label: React.ReactNode
  disabled?: boolean
}

/**
 * An input for selection via dropdown.
 */
const SimpleSelect: React.FC<SimpleSelectProps> = ({ options, ...others }) => {
  return (
    <Select {...others} displayEmpty>
      {options.map(({ label, value, ...itemProps }) => (
        <MenuItem key={value} size={others.size} {...itemProps} value={value}>
          {label}
        </MenuItem>
      ))}
    </Select>
  )
}

type SimpleSelectFieldProps = Pick<
  SelectFieldProps<string | string[]>,
  | "fullWidth"
  | "label"
  | "helpText"
  | "errorText"
  | "required"
  | "size"
  | "value"
  | "onChange"
  | "name"
  | "className"
> & {
  /**
   * The options for the dropdown
   */
  options: SimpleSelectOption[]
}

/**
 * A form field for text input via select dropdowns. Supports labels, help text,
 * error text, and start/end adornments.
 */
const SimpleSelectField: React.FC<SimpleSelectFieldProps> = ({
  options,
  ...others
}) => {
  return (
    <SelectField {...others}>
      {options.map(({ value, label, ...itemProps }) => (
        <MenuItem size={others.size} value={value} key={value} {...itemProps}>
          {label}
        </MenuItem>
      ))}
    </SelectField>
  )
}

export { SimpleSelect, SimpleSelectField }
export type { SimpleSelectProps, SimpleSelectFieldProps, SimpleSelectOption }
