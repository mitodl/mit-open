import React, { useState } from "react"
import type {
  LearningResource,
  CourseResource,
  VideoResource,
  LearningResourceTopic,
  LearningResourceImage,
  LearningResourceRun,
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
import {
  theme,
  ButtonLink,
  PlatformLogo,
  SelectField,
  MenuItem,
  SelectChangeEvent,
} from "ol-components"
import {
  RiMoneyDollarCircleFill,
  RiBarChartFill,
  RiGraduationCapFill,
  RiGlobalLine,
} from "@remixicon/react"

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

const StyledButton = styled(ButtonLink)`
  width: 220px;
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

const Topics = styled.section`
  display: flex;
  flex-direction: column;
  gap: 8px;
`

const TopicsList = styled.ul`
  display: flex;
  flex-wrap: wrap;
  padding: 0;
  margin: 0;
  gap: 8px;
`

const InfoItems = styled.section`
  display: flex;
  flex-direction: column;
  gap: 16px;
`

const InfoItem = styled.div`
  display: flex;
  align-items: flex-start;
  gap: 16px;
  align-self: stretch;
  ${{ ...theme.typography.body2 }}
  color: ${theme.custom.colors.silverGrayDark};

  svg {
    width: 20px;
    height: 20px;
    flex-shrink: 0;
  }
`

const InfoLabel = styled.div`
  width: 85px;
  flex-shrink: 0;
`

const InfoValue = styled.div`
  ${{ ...theme.typography.body2 }}
  color: ${theme.custom.colors.black};
`

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

const TopicsSection: React.FC<{ topics: LearningResourceTopic[] }> = ({
  topics,
}) => {
  return (
    <Topics>
      <Typography variant="subtitle2">Topics</Typography>
      <TopicsList>
        {topics.map((topic) => (
          <Chip
            size="medium"
            key={topic.id}
            component="li"
            label={topic.name}
            variant="outlined"
          />
        ))}
      </TopicsList>
    </Topics>
  )
}

const InfoSection = ({ run }: { run?: LearningResourceRun }) => {
  if (!run) {
    return null
  }
  return (
    <InfoItems>
      <Typography variant="subtitle2">Info</Typography>
      <InfoItem>
        <RiMoneyDollarCircleFill />
        <InfoLabel>Cost:</InfoLabel>
        <InfoValue>{run.prices?.[0] || "-"}</InfoValue>
      </InfoItem>
      <InfoItem>
        <RiBarChartFill />
        <InfoLabel>Level:</InfoLabel>
        <InfoValue>{run.level?.[0]?.name || "-"}</InfoValue>
      </InfoItem>
      <InfoItem>
        <RiGraduationCapFill />
        <InfoLabel>Instructors:</InfoLabel>
        <InfoValue>
          {run.instructors?.length
            ? run.instructors.map(({ full_name: name }) => name).join(", ")
            : "-"}
        </InfoValue>
      </InfoItem>
      <InfoItem>
        <RiGlobalLine />
        <InfoLabel>Languages:</InfoLabel>
        <InfoValue>
          {run.languages?.length ? run.languages.join(", ") : "-"}
        </InfoValue>
      </InfoItem>
    </InfoItems>
  )
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
      {resource?.topics ? <TopicsSection topics={resource.topics} /> : null}
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
  const [selectedRun, setSelectedRun] = useState(resource?.runs?.[0])
  console.log("selectedRun", selectedRun)

  const onDateChange = (event: SelectChangeEvent) => {
    console.log("event", event.target.value)
    setSelectedRun(
      resource.runs?.find(
        (run) => run.id === (event.target.value as unknown as number),
      ),
    )
  }

  const DateSection = () => {
    if (!resource) {
      return <Skeleton variant="text" />
    }
    const multipleRuns = resource.runs && resource.runs.length > 1

    const onClick = (event: React.MouseEvent<HTMLElement>) => {
      event.stopPropagation()
    }

    if (multipleRuns) {
      return (
        <Date>
          <DateLabel>Start Date:</DateLabel>
          <SelectField
            label=""
            value={selectedRun?.id as unknown as string}
            onChange={onDateChange}
            onClick={onClick}
          >
            {resource.runs!.map((run) => (
              <MenuItem key={run.id} value={run.id}>
                {formatDate(run.start_date!, "MMMM DD, YYYY")}
              </MenuItem>
            ))}
          </SelectField>
        </Date>
      )
    }

    return (
      <Date>
        <DateLabel>As taught in:</DateLabel>
        {formatDate(resource.next_start_date!, "MMMM DD, YYYY")}
      </Date>
    )
  }

  return (
    <Container>
      <DateSection />
      <ImageDisplay image={resource?.image} config={imgConfig} />
      <CallToAction>
        {resource ? (
          <StyledButton size="large" href={resource.url!}>
            Take Course
          </StyledButton>
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
      {resource?.topics ? <TopicsSection topics={resource.topics} /> : null}
      <InfoSection run={selectedRun} />
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
