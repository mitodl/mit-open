import React from "react"

import { FormControl, FormLabel, SimpleSelect } from "ol-components"
import type { SimpleSelectFieldProps, SimpleSelectOption } from "ol-components"
import { CurrentEducationEnum, CurrentEducationEnumDescriptions } from "api/v0"

import { ProfileFieldUpdateProps } from "./types"

const OPTIONS: SimpleSelectOption[] = [
  {
    label: <em>Please select</em>,
    disabled: true,
    value: "",
  },
  ...Object.values(CurrentEducationEnum).map((value) => ({
    value,
    label: CurrentEducationEnumDescriptions[value],
  })),
]

const EducationLevelSelect: React.FC<
  ProfileFieldUpdateProps<"current_education">
> = ({ label, value, onUpdate }) => {
  const [educationLevel, setEducationLevel] = React.useState<
    CurrentEducationEnum | ""
  >(value || "")

  const handleChange: SimpleSelectFieldProps["onChange"] = (event) => {
    setEducationLevel(event.target.value as CurrentEducationEnum)
  }

  React.useEffect(() => {
    onUpdate("current_education", educationLevel)
  }, [educationLevel, onUpdate])

  return (
    <FormControl component="fieldset" fullWidth>
      <FormLabel component="label">{label}</FormLabel>
      <SimpleSelect
        value={educationLevel}
        onChange={handleChange}
        options={OPTIONS}
      />
    </FormControl>
  )
}

export { EducationLevelSelect }
