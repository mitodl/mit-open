import React from "react"
import {
  FormControl,
  FormLabel,
  Select,
  SelectChangeEvent,
  MenuItem,
  RadioChoiceBoxField,
} from "ol-components"
import { TimeCommitmentEnum, TimeCommitmentEnumDescriptions } from "api/v0"

import { ProfileFieldUpdateProps } from "./types"

const CHOICES = [
  TimeCommitmentEnum._0To5Hours,
  TimeCommitmentEnum._5To10Hours,
  TimeCommitmentEnum._10To20Hours,
  TimeCommitmentEnum._20To30Hours,
  TimeCommitmentEnum._30PlusHours,
].map((value) => ({
  value,
  label: TimeCommitmentEnumDescriptions[value],
}))

type Props = ProfileFieldUpdateProps<"time_commitment">
type State = TimeCommitmentEnum | ""

const TimeCommitmentRadioChoiceBoxField: React.FC<Props> = ({
  label,
  value,
  onUpdate,
}) => {
  const [timeCommitment, setTimeCommitment] = React.useState<State>(value || "")

  const handleChange = (event: React.SyntheticEvent) => {
    setTimeCommitment(() => {
      const target = event.target as HTMLInputElement
      return target.value as TimeCommitmentEnum
    })
  }

  React.useEffect(() => {
    onUpdate("time_commitment", timeCommitment)
  }, [timeCommitment, onUpdate])

  return (
    <RadioChoiceBoxField
      label={label}
      onChange={handleChange}
      choices={CHOICES}
      value={timeCommitment}
      gridItemProps={{ xs: 4 }}
    />
  )
}

const TimeCommitmentSelect: React.FC<Props> = ({ label, value, onUpdate }) => {
  const [timeCommitment, setTimeCommitment] = React.useState<State>(value || "")

  const handleChange = (event: SelectChangeEvent<typeof timeCommitment>) => {
    setTimeCommitment(() => {
      const target = event.target as HTMLInputElement
      return target.value as TimeCommitmentEnum
    })
  }
  React.useEffect(() => {
    onUpdate("time_commitment", timeCommitment)
  }, [timeCommitment, onUpdate])

  return (
    <FormControl component="fieldset" fullWidth>
      <FormLabel component="label">{label}</FormLabel>
      <Select displayEmpty onChange={handleChange} value={timeCommitment}>
        <MenuItem disabled value="">
          <em>Please select</em>
        </MenuItem>
        {CHOICES.map((choice) => (
          <MenuItem value={choice.value} key={choice.value}>
            {choice.label}
          </MenuItem>
        ))}
      </Select>
    </FormControl>
  )
}

export { TimeCommitmentRadioChoiceBoxField, TimeCommitmentSelect }
