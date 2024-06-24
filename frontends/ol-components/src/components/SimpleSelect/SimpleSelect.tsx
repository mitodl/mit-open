import React from "react"
import { Select, SelectField } from "../SelectField/SelectField"
import type { SelectProps, SelectFieldProps } from "../SelectField/SelectField"
import { MenuItem } from "../MenuItem/MenuItem"

type SimpleSelectProps = Pick<
  SelectProps<string | string[]>,
  "value" | "size" | "multiple" | "onChange" | "renderValue" | "className"
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
