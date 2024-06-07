import React from "react"
import {
  RadioChoiceBoxField,
  Select,
  SelectChangeEvent,
  MenuItem,
  FormControl,
  FormLabel,
} from "ol-components"
import { LearningFormatEnum, LearningFormatEnumDescriptions } from "api/v0"

import { ProfileFieldUpdateProps, ProfileFieldStateHook } from "./types"

const CHOICES = [
  LearningFormatEnum.InPerson,
  LearningFormatEnum.Online,
  LearningFormatEnum.Hybrid,
].map((value) => ({
  value,
  label: LearningFormatEnumDescriptions[value],
}))

type Props = ProfileFieldUpdateProps<"learning_format">
type State = LearningFormatEnum | ""

const useLearningFormatChoice: ProfileFieldStateHook<"learning_format"> = (
  value,
  onUpdate,
): [State, React.ChangeEventHandler] => {
  const [learningFormat, setLearningFormat] = React.useState<State>(value || "")

  const handleChange = (event: React.SyntheticEvent) => {
    setLearningFormat(() => {
      const target = event.target as HTMLInputElement
      return target.value as LearningFormatEnum
    })
  }

  React.useEffect(() => {
    onUpdate("learning_format", learningFormat)
  }, [learningFormat, onUpdate])

  return [learningFormat, handleChange]
}

const LearningFormatChoiceBoxField: React.FC<Props> = ({
  label,
  value,
  onUpdate,
}) => {
  const [learningFormat, handleChange] = useLearningFormatChoice(
    value,
    onUpdate,
  )

  return (
    <RadioChoiceBoxField
      label={label}
      onChange={handleChange}
      choices={CHOICES}
      value={learningFormat}
      gridItemProps={{ xs: 4 }}
    />
  )
}
const LearningFormatSelect: React.FC<Props> = ({ label, value, onUpdate }) => {
  const [learningFormat, setLearningFormat] = React.useState<State>(value || "")

  const handleChange = (event: SelectChangeEvent<typeof learningFormat>) => {
    setLearningFormat(() => {
      const target = event.target as HTMLInputElement
      return target.value as LearningFormatEnum
    })
  }
  React.useEffect(() => {
    onUpdate("learning_format", learningFormat)
  }, [learningFormat, onUpdate])

  return (
    <FormControl component="fieldset" fullWidth>
      <FormLabel component="label">{label}</FormLabel>
      <Select displayEmpty onChange={handleChange} value={learningFormat}>
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

export { LearningFormatChoiceBoxField, LearningFormatSelect }
