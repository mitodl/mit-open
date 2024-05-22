import React from "react"
import type {
  LearningResource,
  CourseResource,
  VideoResource,
  LearningResourceTopic,
  LearningResourceImage,
} from "api"
import {
  formatDate,
  resourceThumbnailSrc,
  getReadableResourceType,
} from "ol-utilities"
import type { EmbedlyConfig } from "ol-utilities"
import styled from "@emotion/styled"
import Chip from "@mui/material/Chip"
import { EmbedlyCard } from "../../EmbedlyCard/EmbedlyCard"
import Skeleton from "@mui/material/Skeleton"
import Typography from "@mui/material/Typography"
import { theme, ButtonLink, PlatformLogo } from "ol-components"

const Container = styled.div`
  display: flex;
  flex-direction: column;
  padding: 18px 32px;
  gap: 20px;
`

const Date = styled.p`
  ${{ ...theme.typography.body2 }}
  color: ${theme.custom.colors.black};
  margin: 0;
`

const DateLabel = styled.span`
  ${{ ...theme.typography.body2 }}
  color: ${theme.custom.colors.darkGray1};
  margin-right: 16px;
`

const Image = styled.img<{ aspectRatio: number }>`
  aspect-ratio: ${({ aspectRatio }) => aspectRatio};
  border-radius: 8px;
`

const CallToAction = styled.div`
  display: flex;
  justify-content: space-between;
`

const Platform = styled.div`
  display: flex;
  justify-content: flex-end;
  align-items: center;
  gap: 16px;
`

const Description = styled.p`
  ${{ ...theme.typography.body2 }}
  color: ${theme.custom.colors.darkGray2};
  margin: ${theme.typography.pxToRem(8)} 0;
`

const StyledPlatformLogo = styled(PlatformLogo)`
  height: 26px;
`

const OnPlatform = styled.span`
  ${{ ...theme.typography.body2 }}
  color: ${theme.custom.colors.black};
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

const ImageDisplay: React.FC<{
  image?: LearningResourceImage | null
  config: EmbedlyConfig
}> = ({ image, config }) => {
  if (image) {
    return (
      <Image
        src={resourceThumbnailSrc(image, config)}
        aspectRatio={config.width / config.height}
        alt={image.alt ?? ""}
      />
    )
  } else {
    return (
      <Skeleton
        variant="rectangular"
        height={config.height}
        width={config.width}
      />
    )
  }
}

const ResourceTitle = ({ resource }: { resource?: LearningResource }) => {
  if (!resource) {
    return <Skeleton variant="text" width="66%" />
  }
  return (
    <Typography variant="h5" component="h2">
      {resource.title}
    </Typography>
  )
}

const ResourceDescription = ({ resource }: { resource?: LearningResource }) => {
  if (!resource) {
    return (
      <>
        <Skeleton variant="text" width="100%" />
        <Skeleton variant="text" width="100%" />
        <Skeleton variant="text" width="100%" />
        <Skeleton variant="text" width="100%" />
        <Skeleton variant="text" width="33%" />
      </>
    )
  }
  return <Description>{resource.description}</Description>
}

const DisplayTemplate: React.FC<
  ExpandedLearningResourceDisplayProps & {
    media?: React.ReactNode
  }
> = ({ resource, imgConfig, media }) => {
  return (
    <Container>
      <Typography variant="subtitle1">
        {resource ? (
          getReadableResourceType(resource.resource_type)
        ) : (
          <Skeleton variant="text" width="50%" />
        )}
      </Typography>
      {media ?? <ImageDisplay image={resource?.image} config={imgConfig} />}
      <ResourceTitle resource={resource} />
      <ResourceDescription resource={resource} />
      {resource?.topics ? <TopicsDisplay topics={resource.topics} /> : null}
    </Container>
  )
}

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

const Course: React.FC<ResourceDisplayProps<CourseResource>> = ({
  resource,
  imgConfig,
}) => {
  return (
    <Container>
      <Date>
        <DateLabel>As taught in:</DateLabel>
        {formatDate(resource.next_start_date!, "MMMM DD, YYYY")}
      </Date>
      <ImageDisplay image={resource?.image} config={imgConfig} />
      <CallToAction>
        {resource ? (
          <ButtonLink size="large" href={resource.url!}>
            Take Course
          </ButtonLink>
        ) : null}
        <Platform>
          <OnPlatform>on</OnPlatform>
          <StyledPlatformLogo platformCode={resource?.platform?.code} />
        </Platform>
      </CallToAction>
      <div>
        <ResourceTitle resource={resource} />
        <ResourceDescription resource={resource} />
      </div>
    </Container>
  )
}

const ExpandedLearningResourceDisplay: React.FC<
  ExpandedLearningResourceDisplayProps
> = ({ resource, imgConfig }) => {
  if (resource?.resource_type === "course") {
    return <Course resource={resource} imgConfig={imgConfig} />
  }
  if (resource?.resource_type === "video") {
    return <VideoDisplay resource={resource} imgConfig={imgConfig} />
  }
  return <DisplayTemplate resource={resource} imgConfig={imgConfig} />
}

export { ExpandedLearningResourceDisplay }
export type { ExpandedLearningResourceDisplayProps }
