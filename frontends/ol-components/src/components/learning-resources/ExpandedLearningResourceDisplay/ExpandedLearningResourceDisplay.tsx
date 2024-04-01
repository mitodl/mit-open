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
import Skeleton from "@mui/material/Skeleton"

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

type ExpandedLearningResourceDisplayProps = {
  resource?: LearningResource
  imgConfig: EmbedlyConfig
}

type ResourceDisplayProps<R extends LearningResource> =
  ExpandedLearningResourceDisplayProps & {
    resource: R
  }

const ResourceTitle = ({ resource }: { resource?: LearningResource }) => {
  if (!resource) {
    return <Skeleton variant="text" width="66%" />
  }
  return (
    <h2>
      {resource.url ? (
        <Link href={resource.url} color="text.primary">
          {resource.title}
        </Link>
      ) : (
        resource.title
      )}
    </h2>
  )
}

const Container = styled.div`
  display: flex;
  flex-direction: column;
`

const Image = styled.img<{ aspectRation: number }>`
  aspect-ratio: ${({ aspectRation }) => aspectRation};
`

const DisplayTemplate: React.FC<
  ExpandedLearningResourceDisplayProps & {
    media?: React.ReactNode
  }
> = ({ resource, imgConfig, media }) => {
  const mediaSlot =
    media ??
    (resource?.image ? (
      <Image
        src={resourceThumbnailSrc(resource.image, imgConfig)}
        aspectRation={imgConfig.width / imgConfig.height}
      />
    ) : (
      <Skeleton
        variant="rectangular"
        height={imgConfig.height}
        width={imgConfig.width}
      />
    ))
  return (
    <Container>
      <SectionTitle>
        {resource ? (
          getReadableResourceType(resource.resource_type)
        ) : (
          <Skeleton variant="text" width="50%" />
        )}
      </SectionTitle>
      {mediaSlot}
      <ResourceTitle resource={resource} />
      {resource ? (
        <p>{resource.description}</p>
      ) : (
        <>
          <Skeleton variant="text" width="100%" />
          <Skeleton variant="text" width="100%" />
          <Skeleton variant="text" width="100%" />
          <Skeleton variant="text" width="100%" />
          <Skeleton variant="text" width="33%" />
        </>
      )}
      {resource?.topics ? <TopicsDisplay topics={resource.topics} /> : null}
    </Container>
  )
}

const FallbackDisplay: React.FC<ExpandedLearningResourceDisplayProps> = ({
  resource,
  imgConfig,
}) => <DisplayTemplate resource={resource} imgConfig={imgConfig} />

const VideoDisplay: React.FC<ResourceDisplayProps<VideoResource>> = ({
  resource,
  imgConfig,
}) => {
  return (
    <DisplayTemplate
      resource={resource}
      imgConfig={imgConfig}
      media={
        resource?.url ? (
          <EmbedlyCard url={resource.url} embedlyKey={imgConfig.key} />
        ) : undefined
      }
    />
  )
}

const ExpandedLearningResourceDisplay: React.FC<
  ExpandedLearningResourceDisplayProps
> = ({ resource, imgConfig }) => {
  if (resource?.resource_type === "video") {
    return <VideoDisplay resource={resource} imgConfig={imgConfig} />
  }
  return <FallbackDisplay resource={resource} imgConfig={imgConfig} />
}

export { ExpandedLearningResourceDisplay }
export type { ExpandedLearningResourceDisplayProps }
