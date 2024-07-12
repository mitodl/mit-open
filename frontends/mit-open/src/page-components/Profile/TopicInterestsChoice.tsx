import React from "react"
import {
  CheckboxChoiceBoxField,
  ChoiceBoxChoice,
  ChoiceBoxGridProps,
} from "ol-components"

import { useLearningResourceTopics } from "api/hooks/learningResources"
import { ProfileFieldUpdateProps } from "./types"

type Props = ProfileFieldUpdateProps<"topic_interests"> & ChoiceBoxGridProps

const TopicInterestsChoiceBoxField: React.FC<Props> = ({
  value,
  label,
  gridProps,
  gridItemProps,
  onUpdate,
}) => {
  const { data: topics } = useLearningResourceTopics({ is_toplevel: true })
  const [choices, setChoices] = React.useState<ChoiceBoxChoice[]>([])
  const [topicInterests, setTopicInterests] = React.useState<string[]>(
    value?.map((topic) => topic.id.toString()) || [],
  )

  React.useEffect(() => {
    const choices = topics?.results?.map((topic) => ({
      label: topic.name,
      value: topic.id.toString(),
    }))
    setChoices(choices || [])
  }, [topics, setChoices])

  const handleToggle: React.ChangeEventHandler<HTMLInputElement> = (event) => {
    const value = event.target.value
    setTopicInterests((prevTopicInterests) => {
      if (event.target.checked) {
        return [...prevTopicInterests, value]
      } else {
        const update = prevTopicInterests.filter(
          (interest) => interest !== value,
        )
        return update
      }
    })
  }

  React.useEffect(() => {
    onUpdate("topic_interests", topicInterests.map(Number))
  }, [topicInterests, onUpdate])

  return (
    <CheckboxChoiceBoxField
      label={label}
      choices={choices}
      values={topicInterests}
      onChange={handleToggle}
      gridProps={Object.assign(
        {
          justifyContent: "left",
          columns: {
            lg: 15,
            md: 9,
            xs: 3,
          },
          maxWidth: "lg",
        },
        gridProps,
      )}
      gridItemProps={Object.assign({ xs: 3 }, gridItemProps)}
    />
  )
}

export { TopicInterestsChoiceBoxField }
