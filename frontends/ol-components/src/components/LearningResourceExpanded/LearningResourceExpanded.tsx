import React, { useEffect, useState } from "react"
import styled from "@emotion/styled"
import Skeleton from "@mui/material/Skeleton"
import Typography from "@mui/material/Typography"
import { ActionButton, ButtonLink } from "../Button/Button"
import type { LearningResource } from "api"
import { ResourceTypeEnum, PlatformEnum } from "api"
import { resourceThumbnailSrc, DEFAULT_RESOURCE_IMG } from "ol-utilities"
import { RiCloseLargeLine, RiExternalLinkLine } from "@remixicon/react"
import type { EmbedlyConfig } from "ol-utilities"
import { theme } from "../ThemeProvider/ThemeProvider"
import { EmbedlyCard } from "../EmbedlyCard/EmbedlyCard"
import { PlatformLogo, PLATFORMS } from "../Logo/Logo"
import InfoSection from "./InfoSection"
import type { User } from "api/hooks/user"
import { LearningResourceCardProps } from "../LearningResourceCard/LearningResourceCard"

const ReadableResourceTypes = {
  [ResourceTypeEnum.Course.toString()]: "Course",
  [ResourceTypeEnum.Podcast.toString()]: "Podcast",
  [ResourceTypeEnum.PodcastEpisode.toString()]: "Podcast Episode",
  [ResourceTypeEnum.Video.toString()]: "Video",
  [ResourceTypeEnum.VideoPlaylist.toString()]: "Video Playlist",
  [ResourceTypeEnum.Program.toString()]: "Program",
}

const Container = styled.div<{ padTop?: boolean }>`
  display: flex;
  flex-direction: column;
  padding: 0 32px 160px;
  gap: 20px;
  ${({ padTop }) => (padTop ? "padding-top: 64px;" : "")}
  width: 900px;
  ${({ theme }) => theme.breakpoints.down("md")} {
    width: auto;
  }
`

const TitleSectionContainer = styled.div({
  display: "flex",
  position: "sticky",
  justifyContent: "space-between",
  top: "0",
  padding: "24px 0",
  backgroundColor: theme.custom.colors.white,
})

const ContentContainer = styled.div({
  display: "flex",
  alignItems: "flex-start",
  gap: "32px",
  alignSelf: "stretch",
})

const LeftContainer = styled.div({
  display: "flex",
  flexDirection: "column",
  alignItems: "flex-start",
  gap: "24px",
  flex: "1 0 0",
})

const RightContainer = styled.div({
  display: "flex",
  flexDirection: "column",
  justifyContent: "center",
  alignItems: "flex-start",
  gap: "24px",
})

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

const CallToAction = styled.div({
  display: "flex",
  width: "350px",
  padding: "16px",
  flexDirection: "column",
  alignItems: "center",
  gap: "10px",
  borderRadius: "8px",
  border: `1px solid ${theme.custom.colors.lightGray2}`,
  boxShadow:
    "0px 2px 4px 0px rgba(37, 38, 43, 0.10), 0px 2px 4px 0px rgba(37, 38, 43, 0.10)",
})

const PlatformContainer = styled.div({
  display: "flex",
  alignItems: "center",
  gap: "16px",
  alignSelf: "stretch",
})

const StyledLink = styled(ButtonLink)`
  text-align: center;
  width: 100%;
  ${({ theme }) => theme.breakpoints.down("sm")} {
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
  lineHeight: "20px";
  color: ${theme.custom.colors.black};
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

type LearningResourceExpandedProps = {
  resource?: LearningResource
  user?: User
  imgConfig: EmbedlyConfig
  onAddToLearningPathClick?: LearningResourceCardProps["onAddToLearningPathClick"]
  onAddToUserListClick?: LearningResourceCardProps["onAddToUserListClick"]
  closeDrawer: () => void
}

const CloseButton = styled(ActionButton)(({ theme }) => ({
  "&&&": {
    flexShrink: 0,
    backgroundColor: theme.custom.colors.lightGray2,
    color: theme.custom.colors.black,
    ["&:hover"]: {
      backgroundColor: theme.custom.colors.red,
      color: theme.custom.colors.white,
    },
  },
}))

const CloseIcon = styled(RiCloseLargeLine)`
  &&& {
    width: 18px;
    height: 18px;
  }
`

const TitleSection: React.FC<{
  resource?: LearningResource
  closeDrawer: () => void
}> = ({ resource, closeDrawer }) => {
  const closeButton = (
    <CloseButton
      variant="text"
      size="medium"
      onClick={() => closeDrawer()}
      aria-label="Close"
    >
      <CloseIcon />
    </CloseButton>
  )
  if (resource) {
    return (
      <TitleSectionContainer>
        <div>
          <Typography
            variant="subtitle2"
            color={theme.custom.colors.silverGrayDark}
          >
            {ReadableResourceTypes[resource?.resource_category]}
          </Typography>
          <Typography variant="h4" color={theme.custom.colors.darkGray2}>
            {resource?.title}
          </Typography>
        </div>
        {closeButton}
      </TitleSectionContainer>
    )
  } else {
    return (
      <TitleSectionContainer>
        <Skeleton variant="text" height={20} width="66%" />
        <Skeleton variant="text" height={20} width="100%" />
        {closeButton}
      </TitleSectionContainer>
    )
  }
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
      <Image
        src={DEFAULT_RESOURCE_IMG}
        alt={resource.image?.alt ?? ""}
        aspect={config.width / config.height}
      />
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
  imgConfig,
  resource,
  hide,
}: {
  imgConfig: EmbedlyConfig
  resource?: LearningResource
  hide?: boolean
}) => {
  if (hide) {
    return null
  }

  if (!resource) {
    return (
      <PlatformContainer>
        <Skeleton height={70} width="50%" />
        <Skeleton height={50} width="25%" />
      </PlatformContainer>
    )
  }
  const { platform } = resource!
  const offeredBy = resource?.offered_by
  const platformCode =
    (offeredBy?.code as PlatformEnum) === PlatformEnum.Xpro
      ? (offeredBy?.code as PlatformEnum)
      : (platform?.code as PlatformEnum)
  const platformImage = PLATFORMS[platformCode]?.image

  const getCallToActionText = (resource: LearningResource): string => {
    if (resource?.platform?.code === PlatformEnum.Ocw) {
      return "Access Course Materials"
    } else if (
      resource?.resource_type === ResourceTypeEnum.Podcast ||
      resource?.resource_type === ResourceTypeEnum.PodcastEpisode
    ) {
      return "Listen to Podcast"
    }
    return "Learn More"
  }

  const cta = getCallToActionText(resource)
  return (
    <CallToAction>
      <ImageSection resource={resource} config={imgConfig} />
      <StyledLink
        target="_blank"
        size="medium"
        endIcon={<RiExternalLinkLine />}
        href={getCallToActionUrl(resource) || ""}
      >
        {cta}
      </StyledLink>
      <PlatformContainer>
        {platformImage ? (
          <Platform>
            <OnPlatform>on</OnPlatform>
            <StyledPlatformLogo platformCode={platformCode} />
          </Platform>
        ) : null}
      </PlatformContainer>
    </CallToAction>
  )
}

const DetailSection = ({ resource }: { resource?: LearningResource }) => {
  return (
    <Detail>
      <ResourceDescription resource={resource} />
    </Detail>
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

const LearningResourceExpanded: React.FC<LearningResourceExpandedProps> = ({
  resource,
  imgConfig,
  closeDrawer,
}) => {
  const [selectedRun, setSelectedRun] = useState(resource?.runs?.[0])

  useEffect(() => {
    if (resource) {
      const closest = resource?.runs?.reduce(function (prev, current) {
        const now = Date.now()
        return prev.start_date &&
          current.start_date &&
          Date.parse(prev.start_date) > now &&
          Date.parse(prev.start_date) - now <
            Date.parse(current.start_date) - now
          ? prev
          : current
      }, resource!.runs![0])
      setSelectedRun(closest)
    }
  }, [resource])

  const isVideo =
    resource &&
    (resource.resource_type === ResourceTypeEnum.Video ||
      resource.resource_type === ResourceTypeEnum.VideoPlaylist)

  return (
    <Container padTop={isVideo}>
      <TitleSection resource={resource} closeDrawer={closeDrawer} />
      <ContentContainer>
        <LeftContainer>
          <DetailSection resource={resource} />
          <InfoSection resource={resource} run={selectedRun} />
        </LeftContainer>
        <RightContainer>
          <CallToActionSection
            imgConfig={imgConfig}
            resource={resource}
            hide={isVideo}
          />
        </RightContainer>
      </ContentContainer>
    </Container>
  )
}

export { LearningResourceExpanded }
export type { LearningResourceExpandedProps }
