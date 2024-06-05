import React from "react"

import {
  Select,
  MenuItem,
  SelectChangeEvent,
  Container,
  FormControl,
} from "ol-components"
import { CurrentEducationEnum } from "api/v0"

import { StepProps } from "./types"

const LABELS = {
  [CurrentEducationEnum.Ged]: "GED",
  [CurrentEducationEnum.Primary]: "Primary Education",
  [CurrentEducationEnum.NoFormal]: "No Formal Education",
  [CurrentEducationEnum.SecondaryOrHighSchool]:
    "Secondary Education or High School",
  [CurrentEducationEnum.VocationalQualification]: "Vocational Qualification",
}

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
                  {LABELS[value]}
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
