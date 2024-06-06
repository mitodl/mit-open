import React from "react"
import { Grid, Container, ChoiceBox } from "ol-components"
import { LearningFormatEnum } from "api/v0"

import Prompt from "./Prompt"
import { StepProps } from "./types"

const LABELS: Record<LearningFormatEnum, string> = {
  [LearningFormatEnum.Online]: "Online",
  [LearningFormatEnum.InPerson]: "In-Person",
  [LearningFormatEnum.Hybrid]: "Hybrid",
}

function LearningFormatStep({ onUpdate, profile }: StepProps) {
  const [learningFormat, setLearningFormat] = React.useState<
    LearningFormatEnum | ""
  >(profile.learning_format || "")

  const handleToggle = (event: React.SyntheticEvent) => {
    setLearningFormat(() => {
      const target = event.target as HTMLInputElement
      return target.value as LearningFormatEnum
    })
  }

  React.useEffect(() => {
    onUpdate({ learning_format: learningFormat })
  }, [learningFormat, onUpdate])

  return profile ? (
    <>
      <h3>What course format are you interested in?</h3>
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
          {Object.values(LearningFormatEnum).map((value, index) => {
            const checked = learningFormat === value
            return (
              <Grid item xs={4} key={index}>
                <ChoiceBox
                  type="radio"
                  label={LABELS[value]}
                  value={value}
                  onChange={handleToggle}
                  checked={checked}
                />
              </Grid>
            )
          })}
        </Grid>
      </Container>
    </>
  ) : null
}
export default LearningFormatStep
