import React from "react"
import { Grid, Container, ChoiceBox } from "ol-components"
import { GoalsEnum, GoalsEnumDescriptions } from "api/v0"

import Prompt from "./Prompt"
import type { StepProps } from "./types"

const GoalsDescriptions: Record<string, string> = {
  [GoalsEnum.CareerGrowth]:
    "Looking for career growth through new skills & certification",
  [GoalsEnum.SupplementalLearning]:
    "Additional learning to integrate with degree work",
  [GoalsEnum.JustToLearn]: "I just want more knowledge",
}

function GoalsStep({ profile, onUpdate }: StepProps) {
  const [goals, setGoals] = React.useState<GoalsEnum[]>(profile.goals || [])

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
    onUpdate({ goals })
  }, [goals, onUpdate])

  return (
    <>
      <h3>What do you want MIT online education to help you reach?</h3>
      <Prompt>Select all that apply:</Prompt>
      <Container maxWidth="lg">
        <Grid
          container
          spacing={2}
          justifyContent="center"
          columns={{
            lg: 12,
            xs: 4,
          }}
        >
          {Object.values(GoalsEnum).map((value, index) => {
            const checked = goals.includes(value)
            return (
              <Grid item xs={4} key={index}>
                <ChoiceBox
                  label={GoalsEnumDescriptions[value]}
                  description={GoalsDescriptions[value]}
                  value={value}
                  type="checkbox"
                  checked={checked}
                  onChange={handleToggle}
                />
              </Grid>
            )
          })}
        </Grid>
      </Container>
    </>
  )
}

export default GoalsStep
