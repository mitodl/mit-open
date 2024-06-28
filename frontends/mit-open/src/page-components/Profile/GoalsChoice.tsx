import React from "react"
import {
  styled,
  MuiCheckbox,
  CheckboxChoiceBoxField,
  ChoiceBoxGridProps,
  FormLabel,
  FormControl,
} from "ol-components"
import { GoalsEnum, GoalsEnumDescriptions, PatchedProfileRequest } from "api/v0"

import type { ProfileFieldUpdateProps, ProfileFieldUpdateFunc } from "./types"

const CHOICES = [
  {
    value: GoalsEnum.CareerGrowth,
    label: GoalsEnumDescriptions[GoalsEnum.CareerGrowth],
    description: "Looking for career growth through new skills & certification",
  },
  {
    value: GoalsEnum.SupplementalLearning,
    label: GoalsEnumDescriptions[GoalsEnum.SupplementalLearning],
    description: "Additional learning to integrate with degree work",
  },
  {
    value: GoalsEnum.JustToLearn,
    label: GoalsEnumDescriptions[GoalsEnum.JustToLearn],
    description: "I just want more knowledge",
  },
]

type State = GoalsEnum[]

const useGoalsChoice = (
  value: PatchedProfileRequest["goals"],
  onUpdate: ProfileFieldUpdateFunc<"goals">,
): [State, React.ChangeEventHandler] => {
  const [goals, setGoals] = React.useState<State>(value || [])

  const handleToggle = (event: React.SyntheticEvent) => {
    setGoals((prevGoals) => {
      const target = event.target as HTMLInputElement
      if (target.checked) {
        return [...prevGoals, target.value as GoalsEnum]
      } else {
        return prevGoals.filter((goal) => goal !== target.value)
      }
    })
  }

  React.useEffect(() => {
    onUpdate("goals", goals)
  }, [goals, onUpdate])

  return [goals, handleToggle]
}

function GoalsChoiceBoxField({
  value,
  label,
  gridProps,
  gridItemProps,
  onUpdate,
}: ProfileFieldUpdateProps<"goals"> & ChoiceBoxGridProps) {
  const [goals, handleToggle] = useGoalsChoice(value, onUpdate)

  return (
    <CheckboxChoiceBoxField
      label={label}
      choices={CHOICES}
      values={goals}
      onChange={handleToggle}
      gridProps={Object.assign(
        {
          justifyContent: "center",
          columns: {
            lg: 12,
            xs: 4,
          },
          maxWidth: "md",
          margin: "0 auto",
        },
        gridProps,
      )}
      gridItemProps={Object.assign({ xs: 4 }, gridItemProps)}
    />
  )
}

const CheckboxContainer = styled.div(({ theme }) => ({
  display: "flex",
  flexDirection: "column",
  flexWrap: "wrap",
  "& label": {
    flexShrink: 0,
  },
  [theme.breakpoints.up("md")]: {
    display: "flex",
    flexDirection: "row",
    "& label": {
      marginRight: theme.spacing(3),
    },
  },
}))

function GoalsCheckboxChoiceField({
  label,
  value,
  onUpdate,
}: ProfileFieldUpdateProps<"goals">) {
  const [goals, handleToggle] = useGoalsChoice(value, onUpdate)

  return (
    <FormControl component="fieldset" sx={{ width: "100%" }}>
      <FormLabel component="legend" sx={{ width: "100%" }}>
        {label}
      </FormLabel>
      <CheckboxContainer>
        {CHOICES.map((choice) => {
          return (
            <label key={choice.value}>
              <MuiCheckbox
                edge="start"
                checked={goals.indexOf(choice.value) !== -1}
                onChange={handleToggle}
                value={choice.value}
                disableRipple
              />
              {choice.label}
            </label>
          )
        })}
      </CheckboxContainer>
    </FormControl>
  )
}
export { GoalsChoiceBoxField, GoalsCheckboxChoiceField }
