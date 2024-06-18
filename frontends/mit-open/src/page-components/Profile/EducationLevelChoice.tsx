import React from "react"

import {
  Select,
  MenuItem,
  FormControl,
  FormLabel,
  SelectChangeEvent,
} from "ol-components"
import { CurrentEducationEnum, CurrentEducationEnumDescriptions } from "api/v0"

import { ProfileFieldUpdateProps } from "./types"

const EducationLevelSelect: React.FC<
  ProfileFieldUpdateProps<"current_education">
> = ({ label, value, onUpdate }) => {
  const [educationLevel, setEducationLevel] = React.useState<
    CurrentEducationEnum | ""
  >(value || "")

  const handleChange = (event: SelectChangeEvent<typeof educationLevel>) => {
    setEducationLevel(event.target.value as CurrentEducationEnum)
  }

  React.useEffect(() => {
    onUpdate("current_education", educationLevel)
  }, [educationLevel, onUpdate])

  return (
    <FormControl component="fieldset" fullWidth>
      <FormLabel component="label">{label}</FormLabel>
      <Select displayEmpty onChange={handleChange} value={educationLevel}>
        <MenuItem disabled value="">
          <em>Please select</em>
        </MenuItem>
        {Object.values(CurrentEducationEnum).map((value, index) => {
          return (
            <MenuItem value={value} key={index}>
              {CurrentEducationEnumDescriptions[value]}
            </MenuItem>
          )
        })}
      </Select>
    </FormControl>
  )
}

export { EducationLevelSelect }
