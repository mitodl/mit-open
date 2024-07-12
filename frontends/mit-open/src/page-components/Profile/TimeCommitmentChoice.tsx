import React from "react"
import {
  FormControl,
  FormLabel,
  SimpleSelect,
  RadioChoiceBoxField,
} from "ol-components"
import type { SimpleSelectFieldProps, SimpleSelectOption } from "ol-components"
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

const SELECT_OPTIONS: SimpleSelectOption[] = [
  {
    label: <em>Please Select</em>,
    disabled: true,
    value: "",
  },
  ...CHOICES,
]

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

  const handleChange: SimpleSelectFieldProps["onChange"] = (event) => {
    setTimeCommitment(event.target.value as TimeCommitmentEnum)
  }
  React.useEffect(() => {
    onUpdate("time_commitment", timeCommitment)
  }, [timeCommitment, onUpdate])

  return (
    <FormControl component="fieldset" fullWidth>
      <FormLabel component="label">{label}</FormLabel>
      <SimpleSelect
        options={SELECT_OPTIONS}
        onChange={handleChange}
        value={timeCommitment}
      />
    </FormControl>
  )
}

export {
  TimeCommitmentRadioChoiceBoxField,
  TimeCommitmentSelect,
  CHOICES as TIME_COMMITMENT_CHOICES,
}
