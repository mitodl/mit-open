import React from "react"
import type {
  LearningResource,
  VideoResource,
  LearningResourceTopic,
} from "api"
import type { EmbedlyConfig } from "ol-utilities"
import { resourceThumbnailSrc, getReadableResourceType } from "ol-utilities"
import styled from "@emotion/styled"
import Chip from "@mui/material/Chip"
import Link from "@mui/material/Link"
import { EmbedlyCard } from "../../EmbedlyCard/EmbedlyCard"

const SectionTitle = styled.div<{ light?: boolean }>`
  font-size: ${({ theme }) => theme.custom.fontNormal};
  font-weight: ${({ theme }) => theme.custom.fontWeightBold};
  margin-bottom: 0.5em;
  ${({ light, theme }) => light && `color: ${theme.palette.text.secondary};`}
`

const TopicsList = styled.ul`
  display: flex;
  flex-wrap: wrap;
  padding: 0;
  margin: 0;

  li {
    margin: 0.5em;
  }
`

const TopicsDisplay: React.FC<{ topics: LearningResourceTopic[] }> = ({
  topics,
}) => {
  return (
    <div>
      <SectionTitle>Subjects</SectionTitle>
      <TopicsList>
        {topics.map((topic) => (
          <Chip size="small" key={topic.id} component="li" label={topic.name} />
        ))}
      </TopicsList>
    </div>
  )
}

type ExpandedLearningResourceDisplayProps<
  R extends LearningResource = LearningResource,
> = {
  resource: R
  imgConfig: EmbedlyConfig
}

const DisplayTemplate: React.FC<
  ExpandedLearningResourceDisplayProps & {
    media?: React.ReactNode
  }
> = ({ resource, imgConfig, media }) => {
  const mediaSlot = media ?? (
    <img src={resourceThumbnailSrc(resource.image, imgConfig)} />
  )
  return (
    <div>
      <SectionTitle>
        {getReadableResourceType(resource.resource_type)}
      </SectionTitle>
      {mediaSlot}
      <h2>
        {resource.url ? (
          <Link href={resource.url} color="text.primary">
            {resource.title}
          </Link>
        ) : (
          resource.title
        )}
      </h2>
      <p>{resource.description}</p>
      {resource.topics ? <TopicsDisplay topics={resource.topics} /> : null}
    </div>
  )
}

const FallbackDisplay: React.FC<ExpandedLearningResourceDisplayProps> = ({
  resource,
  imgConfig,
}) => <DisplayTemplate resource={resource} imgConfig={imgConfig} />

const VideoDisplay: React.FC<
  ExpandedLearningResourceDisplayProps<VideoResource>
> = ({ resource, imgConfig }) => {
  return (
    <DisplayTemplate
      resource={resource}
      imgConfig={imgConfig}
      media={
        resource.url ? (
          <EmbedlyCard url={resource.url} embedlyKey={imgConfig.key} />
        ) : undefined
      }
    />
  )
}

const ExpandedLearningResourceDisplay: React.FC<
  ExpandedLearningResourceDisplayProps
> = ({ resource, imgConfig }) => {
  if (resource.resource_type === "video") {
    return <VideoDisplay resource={resource} imgConfig={imgConfig} />
  }
  return <FallbackDisplay resource={resource} imgConfig={imgConfig} />
}

export { ExpandedLearningResourceDisplay }
export type { ExpandedLearningResourceDisplayProps }
