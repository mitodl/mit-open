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
  backgroundColor: theme.custom.colors.white,
  position: "sticky",
  top: "0",
  padding: "24px 0",
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
  width: 224px;
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
    position: "absolute",
    top: "24px",
    right: "0",
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
        <Typography
          variant="subtitle2"
          color={theme.custom.colors.silverGrayDark}
        >
          {ReadableResourceTypes[resource?.resource_category]}
        </Typography>
        <Typography variant="h4" color={theme.custom.colors.darkGray2}>
          {resource?.title}
        </Typography>
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
      <StyledLink
        target="_blank"
        size="medium"
        endIcon={<RiExternalLinkLine />}
        href={getCallToActionUrl(resource) || ""}
      >
        {cta}
      </StyledLink>
      {platformImage ? (
        <Platform>
          <OnPlatform>on</OnPlatform>
          <StyledPlatformLogo platformCode={platformCode} />
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

const LearningResourceExpanded: React.FC<LearningResourceExpandedProps> = ({
  resource,
  user,
  imgConfig,
  onAddToLearningPathClick,
  onAddToUserListClick,
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

      <ImageSection resource={resource} config={imgConfig} />
      <CallToActionSection resource={resource} hide={isVideo} />
      <DetailSection resource={resource} />
      <InfoSection
        resource={resource}
        run={selectedRun}
        user={user}
        onAddToLearningPathClick={onAddToLearningPathClick}
        onAddToUserListClick={onAddToUserListClick}
      />
      <div>
        Lorem ipsum dolor sit amet, consectetur adipiscing elit. Vestibulum
        felis nisl, imperdiet ac eros ac, vestibulum sagittis magna. Phasellus
        nunc lacus, rutrum a justo vitae, ultrices elementum sem. Nulla id
        semper erat, ac mollis diam. Duis erat eros, tempus vitae dui ac,
        elementum interdum enim. Donec ut laoreet justo, in sagittis metus.
        Phasellus nec convallis est, ac varius libero. Vivamus fringilla nunc
        sed felis tempor pulvinar. In hac habitasse platea dictumst. Aenean
        elementum nec ligula ut bibendum. Nam eu aliquam quam. Lorem ipsum dolor
        sit amet, consectetur adipiscing elit. Curabitur vestibulum est vitae
        ante fermentum, vel commodo risus aliquam. Praesent faucibus nisi a
        pharetra pulvinar. Phasellus eu bibendum urna. Sed nec congue diam, ut
        pellentesque ante. Quisque venenatis id massa sed facilisis. Orci varius
        natoque penatibus et magnis dis parturient montes, nascetur ridiculus
        mus. Morbi nibh mauris, elementum at augue a, consectetur viverra ante.
        Sed placerat velit felis, maximus pretium arcu euismod a. Duis eget mi
        massa. Vestibulum eget odio eleifend erat efficitur lobortis. Etiam quis
        tellus justo. Morbi volutpat bibendum ipsum hendrerit varius.
        Pellentesque faucibus augue nunc, non venenatis sem fringilla id. Sed
        eget lorem sed nibh rhoncus accumsan. Nulla purus nibh, maximus et
        consectetur eu, feugiat sed metus. Proin et egestas neque. Praesent
        aliquam dui vel sem suscipit, eleifend bibendum lorem sagittis. Nam quis
        metus nisl. Nam laoreet sagittis massa, in scelerisque odio fringilla
        ac. Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed
        malesuada felis at dui scelerisque egestas. Donec magna risus, mollis eu
        neque commodo, consequat tincidunt ex. Phasellus luctus condimentum
        magna auctor fermentum. Etiam aliquam justo et sagittis lacinia. Etiam
        vestibulum bibendum tortor non molestie. Orci varius natoque penatibus
        et magnis dis parturient montes, nascetur ridiculus mus. Nulla facilisi.
        Integer elementum dolor sed vulputate faucibus. Curabitur mattis
        convallis risus a fringilla. Curabitur viverra turpis sed lectus rhoncus
        luctus id nec dui. Nunc auctor vitae ligula a dictum. Nunc et metus in
        mi ultricies rhoncus in vel leo. Donec risus sapien, elementum sed orci
        eu, eleifend lobortis tellus. Mauris sit amet lorem est. Nunc eu
        vehicula ipsum, a semper diam. Sed pretium sem tempus tellus imperdiet
        dictum. Pellentesque sit amet vehicula lacus. Morbi gravida, ante vel
        varius dignissim, massa tellus tincidunt libero, non interdum mauris
        nulla vel nisi. Ut venenatis porttitor porta. Quisque tempus feugiat mi
        mollis commodo. Nunc ut libero ut arcu dictum cursus semper consequat
        mi. Morbi tempor finibus turpis, id tincidunt erat congue luctus. Aenean
        sollicitudin vel mauris quis ultricies. Proin sit amet quam a mauris
        maximus faucibus. Morbi sed justo vulputate, malesuada sapien vel,
        vulputate nisi. Aliquam sit amet mauris non eros cursus aliquet. Morbi
        in purus sit amet nulla dictum tincidunt. Nulla commodo ligula vel lorem
        facilisis, at varius tortor tristique. Sed laoreet sem vitae scelerisque
        finibus. Nunc a libero quis sem tristique sagittis dignissim a erat.
        Curabitur quis sem eget neque ultricies rutrum eget eget augue.
        Curabitur non lacus venenatis, tristique lacus fermentum, volutpat sem.
        Cras lobortis risus id leo ultrices, ut varius nulla porta. Proin a
        vulputate leo. Nullam lacinia faucibus velit vel aliquet.
      </div>
    </Container>
  )
}

export { LearningResourceExpanded }
export type { LearningResourceExpandedProps }
