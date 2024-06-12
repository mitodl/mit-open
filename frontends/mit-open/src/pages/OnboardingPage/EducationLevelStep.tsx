import React from "react"

import {
  Select,
  MenuItem,
  SelectChangeEvent,
  Container,
  FormControl,
} from "ol-components"
import { CurrentEducationEnum, CurrentEducationEnumDescriptions } from "api/v0"

import { StepProps } from "./types"

function EducationLevelStep({ profile, onUpdate }: StepProps) {
  const [educationLevel, setEducationLevel] = React.useState<
    CurrentEducationEnum | ""
  >(profile.current_education || "")

  const onChange = (
    event: SelectChangeEvent<typeof educationLevel>,
    _: React.ReactNode,
  ) => {
    setEducationLevel(() => {
      const target = event.target as HTMLInputElement
      return target.value as CurrentEducationEnum
    })
  }

  React.useEffect(() => {
    onUpdate({ current_education: educationLevel })
  }, [educationLevel, onUpdate])

  return (
    <>
      <h3>What is your current level of education?</h3>
      <Container maxWidth="xs">
        <FormControl fullWidth>
          <Select
            displayEmpty
            onChange={onChange}
            value={educationLevel}
            labelId="education-level-label"
          >
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
      </Container>
    </>
  )
}

export default EducationLevelStep
