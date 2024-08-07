import React, { useEffect, useState } from "react"
import styled from "@emotion/styled"
import Skeleton from "@mui/material/Skeleton"
import Typography from "@mui/material/Typography"
import { ButtonLink } from "../Button/Button"
import Chip from "@mui/material/Chip"
import type {
  LearningResource,
  LearningResourceRun,
  LearningResourceTopic,
} from "api"
import { ResourceTypeEnum, PlatformEnum } from "api"
import {
  formatDate,
  capitalize,
  resourceThumbnailSrc,
  getReadableResourceType,
  DEFAULT_RESOURCE_IMG,
  showStartAnytime,
} from "ol-utilities"
import type { EmbedlyConfig } from "ol-utilities"
import { theme } from "../ThemeProvider/ThemeProvider"
import { SimpleSelect } from "../SimpleSelect/SimpleSelect"
import type { SimpleSelectProps } from "../SimpleSelect/SimpleSelect"
import { EmbedlyCard } from "../EmbedlyCard/EmbedlyCard"
import { PlatformLogo, PLATFORMS } from "../Logo/Logo"
import { ChipLink } from "../Chips/ChipLink"
import InfoSection from "./InfoSection"

const Container = styled.div<{ padTop?: boolean }>`
  display: flex;
  flex-direction: column;
  padding: 18px 32px 160px;
  gap: 20px;
  ${({ padTop }) => (padTop ? "padding-top: 64px;" : "")}
  width: 516px;
  ${({ theme }) => theme.breakpoints.down("sm")} {
    width: auto;
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

const Image = styled.img<{ aspect: number }>`
  aspect-ratio: ${({ aspect }) => aspect};
  border-radius: 8px;
  width: 100%;
  object-fit: cover;
`

const SkeletonImage = styled(Skeleton)<{ aspect: number }>`
  border-radius: 8px;
  padding-bottom: ${({ aspect }) => 100 / aspect}%;
`

const CallToAction = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  ${({ theme }) => theme.breakpoints.down("sm")} {
    flex-wrap: wrap;
    justify-content: center;
  }
`

const StyledLink = styled(ButtonLink)`
  text-align: center;
  width: 220px;
  ${({ theme }) => theme.breakpoints.down("sm")} {
    width: 100%;
    margin-top: 10px;
    margin-bottom: 10px;
  }
`

const Platform = styled.div`
  display: flex;
  justify-content: flex-end;
  align-items: center;
  gap: 16px;
`

const Detail = styled.section`
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
  max-width: 180px;
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

type LearningResourceExpandedProps = {
  resource?: LearningResource
  imgConfig: EmbedlyConfig
}

const ImageSection: React.FC<{
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
        aspect={config.width / config.height}
        alt={resource?.image.alt ?? ""}
      />
    )
  } else if (resource) {
    return (
      <Image src={DEFAULT_RESOURCE_IMG} aspect={config.width / config.height} />
    )
  } else {
    return (
      <SkeletonImage
        variant="rectangular"
        aspect={config.width / config.height}
      />
    )
  }
}

const getCallToActionUrl = (resource: LearningResource) => {
  switch (resource.resource_type) {
    case ResourceTypeEnum.PodcastEpisode:
      return resource.podcast_episode?.episode_link
    default:
      return resource.url
  }
}

const CallToActionSection = ({
  resource,
  hide,
}: {
  resource?: LearningResource
  hide?: boolean
}) => {
  if (hide) {
    return null
  }

  if (!resource) {
    return (
      <CallToAction>
        <Skeleton height={70} width="50%" />
        <Skeleton height={50} width="25%" />
      </CallToAction>
    )
  }

  const platformImage =
    PLATFORMS[resource?.platform?.code as PlatformEnum]?.image

  const { resource_type: type, platform } = resource!

  const cta =
    type === ResourceTypeEnum.Podcast ||
    type === ResourceTypeEnum.PodcastEpisode
      ? "Listen to Podcast"
      : `Take ${getReadableResourceType(type)}`

  return (
    <CallToAction>
      <StyledLink
        target="_blank"
        size="large"
        href={getCallToActionUrl(resource) || ""}
      >
        {cta}
      </StyledLink>
      {platformImage ? (
        <Platform>
          <OnPlatform>on</OnPlatform>
          <StyledPlatformLogo platformCode={platform?.code as PlatformEnum} />
        </Platform>
      ) : null}
    </CallToAction>
  )
}

const DetailSection = ({ resource }: { resource?: LearningResource }) => {
  return (
    <Detail>
      <ResourceTitle resource={resource} />
      <ResourceDescription resource={resource} />
    </Detail>
  )
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
  return (
    <Description
      /**
       * Resource descriptions can contain HTML. They are santiized on the
       * backend during ETL. This is safe to render.
       */
      dangerouslySetInnerHTML={{ __html: resource.description || "" }}
    />
  )
}

const TopicsSection: React.FC<{ topics?: LearningResourceTopic[] }> = ({
  topics,
}) => {
  if (!topics?.length) {
    return null
  }
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

const formatRunDate = (
  run: LearningResourceRun,
  asTaughtIn: boolean,
): string | null => {
  if (asTaughtIn) {
    const semester = capitalize(run.semester ?? "")
    if (semester && run.year) {
      return `${semester} ${run.year}`
    }
    if (semester && run.start_date) {
      return `${semester} ${formatDate(run.start_date, "YYYY")}`
    }
    if (run.start_date) {
      return formatDate(run.start_date, "MMMM, YYYY")
    }
  }
  if (run.start_date) {
    return formatDate(run.start_date, "MMMM DD, YYYY")
  }
  return null
}

const LearningResourceExpanded: React.FC<LearningResourceExpandedProps> = ({
  resource,
  imgConfig,
}) => {
  const [selectedRun, setSelectedRun] = useState(resource?.runs?.[0])

  const multipleRuns = resource?.runs && resource.runs.length > 1
  const asTaughtIn = resource ? showStartAnytime(resource) : false
  const label = asTaughtIn ? "As taught in:" : "Start Date:"

  useEffect(() => {
    if (resource) {
      setSelectedRun(resource!.runs![0])
    }
  }, [resource])

  const onDateChange: SimpleSelectProps["onChange"] = (event) => {
    const run = resource?.runs?.find(
      (run) => run.id === Number(event.target.value),
    )
    if (run) setSelectedRun(run)
  }

  const DateSection = ({ hide }: { hide?: boolean }) => {
    if (hide) {
      return null
    }
    if (!resource) {
      return <Skeleton height={40} style={{ marginTop: 0, width: "60%" }} />
    }
    const dateOptions: SimpleSelectProps["options"] =
      resource.runs?.map((run) => {
        return {
          value: run.id.toString(),
          label: formatRunDate(run, asTaughtIn),
        }
      }) ?? []

    if (
      [ResourceTypeEnum.Course, ResourceTypeEnum.Program].includes(
        resource.resource_type as "course" | "program",
      ) &&
      multipleRuns
    ) {
      return (
        <Date>
          <DateLabel>{label}</DateLabel>
          <SimpleSelect
            value={selectedRun?.id.toString() ?? ""}
            onChange={onDateChange}
            options={dateOptions}
          />
        </Date>
      )
    }

    if (!selectedRun) return <NoDateSpacer />

    const formatted = formatRunDate(selectedRun, asTaughtIn)
    if (!formatted) {
      return <NoDateSpacer />
    }

    return (
      <DateSingle>
        <DateLabel>{label}</DateLabel>
        {formatted}
      </DateSingle>
    )
  }

  const isVideo =
    resource &&
    (resource.resource_type === ResourceTypeEnum.Video ||
      resource.resource_type === ResourceTypeEnum.VideoPlaylist)

  return (
    <Container padTop={isVideo}>
      <DateSection hide={isVideo} />
      <ImageSection resource={resource} config={imgConfig} />
      <CallToActionSection resource={resource} hide={isVideo} />
      <DetailSection resource={resource} />
      <TopicsSection topics={resource?.topics} />
      <InfoSection resource={resource} run={selectedRun} />
    </Container>
  )
}

export { LearningResourceExpanded }
export type { LearningResourceExpandedProps }
