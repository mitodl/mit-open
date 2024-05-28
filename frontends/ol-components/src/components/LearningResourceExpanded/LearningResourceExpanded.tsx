import React, { useEffect, useState } from "react"
import type {
  LearningResource,
  LearningResourceTopic,
  LearningResourceRun,
} from "api"
import { ResourceTypeEnum, PlatformEnum } from "api"
import {
  formatDate,
  resourceThumbnailSrc,
  getReadableResourceType,
} from "ol-utilities"
import type { EmbedlyConfig } from "ol-utilities"
import styled from "@emotion/styled"
import { EmbedlyCard } from "../EmbedlyCard/EmbedlyCard"
import Skeleton from "@mui/material/Skeleton"
import Typography from "@mui/material/Typography"
import {
  theme,
  ButtonLink,
  PlatformLogo,
  PLATFORMS,
  SelectField,
  MenuItem,
  SelectChangeEvent,
  ChipLink,
  Chip,
} from "ol-components"
import {
  RiMoneyDollarCircleFill,
  RiBarChartFill,
  RiGraduationCapFill,
  RiGlobalLine,
} from "@remixicon/react"

const Container = styled.div<{ isVideo: boolean }>`
  display: flex;
  flex-direction: column;
  padding: 18px 32px 160px 32px;
  gap: 20px;
  ${({ isVideo }) => (isVideo ? "padding-top: 64px;" : "")}
  width: 600px;
  ${({ theme }) => theme.breakpoints.down("md")} {
    width: 550px;
  }
  ${({ theme }) => theme.breakpoints.down("sm")} {
    width: auto;
  }
}
`

const Date = styled.div`
  display: flex;
  justify-content: start;
  align-self: stretch;
  align-items: center;
  ${{ ...theme.typography.body2 }}
  color: ${theme.custom.colors.black};
  margin: 0;

  .MuiInputBase-root {
    margin-bottom: 0;
    border-color: ${theme.custom.colors.mitRed};
    border-width: 1.5px;
    color: ${theme.custom.colors.mitRed};
    ${{ ...theme.typography.button }}
    line-height: ${theme.typography.pxToRem(20)};
    label {
      display: none;
    }
    svg {
      color: ${theme.custom.colors.mitRed};
    }
  }
`

const DateSingle = styled(Date)`
  margin-top: 10px;
`

const NoDateSpacer = styled.div`
  height: 34px;
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

const SkeletonImage = styled(Skeleton)`
  border-radius: 8px;
`

const CallToAction = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
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

const DetailSection = styled.section`
  display: flex;
  flex-direction: column;
  gap: 8px;
`

const Description = styled.p`
  ${{ ...theme.typography.body2 }}
  color: ${theme.custom.colors.darkGray2};
  margin: 0;
  white-space: pre-line;
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

type LearningResourceExpandedProps = {
  resource?: LearningResource
  imgConfig: EmbedlyConfig
}

const ImageDisplay: React.FC<{
  resource?: LearningResource
  config: EmbedlyConfig
}> = ({ resource, config }) => {
  if (resource?.resource_type === "video" && resource?.url) {
    return (
      <EmbedlyCard
        aspectRatio={config.width / config.height}
        url={resource?.url}
        embedlyKey={config.key}
      />
    )
  } else if (resource?.image) {
    return (
      <Image
        src={resourceThumbnailSrc(resource?.image, config)}
        aspectRatio={config.width / config.height}
        alt={resource?.image.alt ?? ""}
      />
    )
  } else {
    return <SkeletonImage variant="rectangular" height={220} />
  }
}

const ResourceTitle = ({ resource }: { resource?: LearningResource }) => {
  if (!resource) {
    return <Skeleton variant="text" height={20} width="66%" />
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
      <Typography variant="subtitle2" component="h3">
        Topics
      </Typography>
      <TopicsList>
        {topics.map((topic) =>
          topic.channel_url ? (
            <ChipLink
              key={topic.id}
              size="medium"
              label={topic.name}
              href={topic.channel_url}
              variant="outlined"
            />
          ) : (
            <Chip
              key={topic.id}
              size="medium"
              label={topic.name}
              variant="outlined"
            />
          ),
        )}
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
      <Typography variant="subtitle2" component="h3">
        Info
      </Typography>
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

const getCtaPrefix = (type: ResourceTypeEnum) => {
  if (type === ResourceTypeEnum.Podcast) {
    return "Listen to"
  } else {
    return "Take"
  }
}

const LearningResourceExpanded: React.FC<LearningResourceExpandedProps> = ({
  resource,
  imgConfig,
}) => {
  const [selectedRun, setSelectedRun] = useState(resource?.runs?.[0])

  const multipleRuns = resource?.runs && resource.runs.length > 1

  useEffect(() => {
    if (resource && multipleRuns) {
      setSelectedRun(resource!.runs![0])
    }
  }, [resource, multipleRuns])

  const onDateChange = (event: SelectChangeEvent) => {
    const run = resource?.runs?.find(
      (run) => run.id === Number(event.target.value),
    )
    if (run) setSelectedRun(run)
  }

  const DateSection = () => {
    if (!resource) {
      return <Skeleton height={40} style={{ marginTop: 0, width: "60%" }} />
    }

    if (multipleRuns) {
      return (
        <Date>
          <DateLabel>Start Date:</DateLabel>
          <SelectField
            label={null}
            value={selectedRun?.id as unknown as string}
            onChange={onDateChange}
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

    if (!resource.next_start_date) {
      return <NoDateSpacer />
    }

    return (
      <DateSingle>
        <DateLabel>
          {resource?.resource_type === "course"
            ? "As taught in:"
            : "Start Date:"}
        </DateLabel>
        {formatDate(resource.next_start_date!, "MMMM DD, YYYY")}
      </DateSingle>
    )
  }

  const isVideo = resource && resource.resource_type === ResourceTypeEnum.Video
  const platformImage = PLATFORMS.find(
    (platform) => platform.code === resource?.platform?.code,
  )?.image

  return (
    <Container isVideo={!!isVideo}>
      {!isVideo ? <DateSection /> : null}
      <ImageDisplay resource={resource} config={imgConfig} />
      {!isVideo ? (
        <CallToAction>
          {resource ? (
            <StyledButton size="large" href={resource.url!}>
              {getCtaPrefix(resource.resource_type)}{" "}
              {getReadableResourceType(resource.resource_type)}
            </StyledButton>
          ) : (
            <Skeleton height={70} width="50%" />
          )}
          {resource ? (
            platformImage ? (
              <Platform>
                <OnPlatform>on</OnPlatform>
                <StyledPlatformLogo
                  platformCode={resource?.platform?.code as PlatformEnum}
                />
              </Platform>
            ) : null
          ) : (
            <Skeleton height={50} width="25%" />
          )}
        </CallToAction>
      ) : null}
      <DetailSection>
        <ResourceTitle resource={resource} />
        <ResourceDescription resource={resource} />
      </DetailSection>
      {resource?.topics ? <TopicsSection topics={resource.topics} /> : null}
      <InfoSection run={selectedRun} />
    </Container>
  )
}

export { LearningResourceExpanded }
export type { LearningResourceExpandedProps }
