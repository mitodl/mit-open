import React from "react"
import { Grid, Container, ChoiceBox } from "ol-components"

import { useLearningResourceTopics } from "api/hooks/learningResources"
import Prompt from "./Prompt"
import { StepProps } from "./types"

function TopicInterestsStep({ onUpdate, profile }: StepProps) {
  const { data: topics } = useLearningResourceTopics({ is_toplevel: true })
  const [topicInterests, setTopicInterests] = React.useState<number[]>(
    profile.topic_interests?.map((topic) => topic.id) || [],
  )

  const handleToggle = (value: number, checked: boolean) => {
    setTopicInterests((prevTopicInterests) => {
      if (checked) {
        return [...prevTopicInterests, value]
      } else {
        return prevTopicInterests.filter((interest) => interest !== value)
      }
    })
  }

  React.useEffect(() => {
    onUpdate({ topic_interests: topicInterests })
  }, [topicInterests, onUpdate])

  return profile ? (
    <>
      <h3>
        Welcome{profile.name ? `, ${profile.name}` : ""}! What are you
        interested in learning about?
      </h3>
      <Prompt>Select all that apply:</Prompt>
      <Container maxWidth="lg">
        <Grid
          container
          spacing={2}
          justifyContent="left"
          columns={{
            lg: 15,
            md: 9,
            xs: 3,
          }}
        >
          {topics?.results?.map((topic, index: number) => {
            const value = topic.id
            const checked = topicInterests.includes(value)
            return (
              <Grid item xs={3} key={index}>
                <ChoiceBox
                  type="checkbox"
                  label={topic.name}
                  value={value.toString()}
                  onChange={(event) =>
                    handleToggle(value, event.target.checked)
                  }
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
export default TopicInterestsStep
