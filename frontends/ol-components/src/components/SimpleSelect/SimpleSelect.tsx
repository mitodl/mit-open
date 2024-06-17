import React from "react"
import { Select } from "../SelectField/SelectField"
import MenuItem from "@mui/material/MenuItem"
import type { SelectChangeEvent } from "@mui/material/Select"
import ExpandMoreIcon from "@mui/icons-material/ExpandMore"
import { Theme, SxProps } from "@mui/material/styles"

interface SimpleSelectProps {
  /**
   * Value of initial selection for the dropdown
   */
  initialValue: string | string[]
  /**
   * Whether the dropdown allows multiple selections
   */
  isMultiple: boolean
  /**
  The function that runs when there is a selection from the dropdown
   */
  onChange: (event: SelectChangeEvent<string[] | string>) => void
  /**
   * The options for the dropdown
   */
  options: SimpleSelectOptionProps[]
  /**
   * Function that controls the display for the dropdown
   */
  renderValue?: (selected: string | string[] | void) => string
  /**
   * class name for the dropdown and base for key for dropdown options
   */
  className?: string
  /**
   * styles for the dropdown and options
   */
  sx?: SxProps<Theme>
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

const SimpleSelect: React.FC<SimpleSelectProps> = ({
  className,
  initialValue,
  isMultiple,
  onChange,
  options,
  renderValue,
  sx,
}) => {
  return (
    <Select
      multiple={isMultiple}
      displayEmpty
      value={initialValue}
      onChange={onChange}
      className={className}
      renderValue={renderValue}
      IconComponent={() => <ExpandMoreIcon />}
      sx={sx}
    >
      {options.map((option) => (
        <MenuItem
          value={option.key.toString()}
          key={option.key.toString()}
          sx={sx}
        >
          {option.label}
        </MenuItem>
      ))}
    </Select>
  )
}

export { SimpleSelect }
export type { SimpleSelectProps, SimpleSelectOptionProps }
