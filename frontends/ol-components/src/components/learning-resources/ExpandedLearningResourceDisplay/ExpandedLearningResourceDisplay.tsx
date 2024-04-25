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
import Typography from "@mui/material/Typography"

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
      <Typography variant="subtitle1">Subjects</Typography>
      <TopicsList>
        {topics.map((topic) => (
          <Chip
            size="medium"
            key={topic.id}
            component="li"
            label={topic.name}
          />
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
    <Typography variant="h5" component="h2">
      {resource.url ? (
        <Link href={resource.url} color="text.primary">
          {resource.title}
        </Link>
      ) : (
        resource.title
      )}
    </Typography>
  )
}

const Container = styled.div`
  display: flex;
  flex-direction: column;
`

const Image = styled.img<{ aspectRatio: number }>`
  aspect-ratio: ${({ aspectRatio }) => aspectRatio};
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
        aspectRatio={imgConfig.width / imgConfig.height}
        alt={resource.image.alt ?? ""}
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
      <Typography variant="subtitle1">
        {resource ? (
          getReadableResourceType(resource.resource_type)
        ) : (
          <Skeleton variant="text" width="50%" />
        )}
      </Typography>
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
          <EmbedlyCard
            aspectRatio={imgConfig.width / imgConfig.height}
            url={resource.url}
            embedlyKey={imgConfig.key}
          />
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
