import React from "react"
import { Select } from "../SelectField/SelectField"
import type { SelectProps } from "../SelectField/SelectField"
import { MenuItem } from "../MenuItem/MenuItem"

type SimpleSelectProps = Pick<
  SelectProps<string | string[]>,
  "value" | "size" | "multiple" | "onChange" | "renderValue" | "className"
> & {
  /**
   * The options for the dropdown
   */
  options: SimpleSelectOptionProps[]
}

interface SimpleSelectOptionProps {
  /**
   * value for the dropdown option
   */
  key: string
  /**
   * label for the dropdown option
   */
  label: string
}

const SimpleSelect: React.FC<SimpleSelectProps> = ({ options, ...others }) => {
  return (
    <Select {...others} displayEmpty>
      {options.map((option) => (
        <MenuItem
          size={others.size}
          value={option.key.toString()}
          key={option.key.toString()}
        >
          {option.label}
        </MenuItem>
      ))}
    </Select>
  )
}

export { SimpleSelect }
export type { SimpleSelectProps, SimpleSelectOptionProps }
