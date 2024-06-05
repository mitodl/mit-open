import React from "react"
import { Grid, Container, ChoiceBox } from "ol-components"
import { TimeCommitmentEnum } from "api/v0"

import Prompt from "./Prompt"
import { StepProps } from "./types"

const LABELS: Record<TimeCommitmentEnum, string> = {
  [TimeCommitmentEnum._0To5Hours]: "< 5 hours/week",
  [TimeCommitmentEnum._5To10Hours]: "5-10 hours/week",
  [TimeCommitmentEnum._10To20Hours]: "10-20 hours/week",
  [TimeCommitmentEnum._20To30Hours]: "20-30 hours/week",
  [TimeCommitmentEnum._30PlusHours]: "30+ hours/week",
}

function TimeCommitmentStep({ onUpdate, profile }: StepProps) {
  const [timeCommitment, setTimeCommitment] = React.useState<
    TimeCommitmentEnum | ""
  >(profile.time_commitment || "")

  const handleToggle = (event: React.SyntheticEvent) => {
    setTimeCommitment(() => {
      const target = event.target as HTMLInputElement
      return target.value as TimeCommitmentEnum
    })
  }

  React.useEffect(() => {
    onUpdate({ time_commitment: timeCommitment })
  }, [timeCommitment, onUpdate])

  return profile ? (
    <>
      <h3>How much time per week do you want to commit to learning?</h3>
      <Prompt>Select one:</Prompt>
      <Container maxWidth="md">
        <Grid
          container
          spacing={2}
          justifyContent="center"
          columns={{
            md: 12,
            xs: 4,
          }}
        >
          {Object.values(TimeCommitmentEnum).map((value, index) => {
            const checked = timeCommitment === value
            return (
              <Grid item xs={4} key={index}>
                <ChoiceBox
                  label={LABELS[value]}
                  value={value}
                  onChange={handleToggle}
                  checked={checked}
                  type="radio"
                />
              </Grid>
            )
          })}
        </Grid>
      </Container>
    </>
  ) : null
}
export default TimeCommitmentStep
