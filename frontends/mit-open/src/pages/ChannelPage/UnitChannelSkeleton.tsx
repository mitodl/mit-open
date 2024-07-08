import React, { useMemo } from "react"
import {
  styled,
  Container,
  Typography,
  Box,
  Breadcrumbs,
  Banner,
} from "ol-components"
import { MetaTags } from "ol-utilities"
import { SearchSubscriptionToggle } from "@/page-components/SearchSubscriptionToggle/SearchSubscriptionToggle"
import { ChannelDetails } from "@/page-components/ChannelDetails/ChannelDetails"
import { useChannelDetail } from "api/hooks/channels"
import ChannelMenu from "@/components/ChannelMenu/ChannelMenu"
import ChannelAvatar from "@/components/ChannelAvatar/ChannelAvatar"
import ResourceCarousel, {
  ResourceCarouselProps,
} from "@/page-components/ResourceCarousel/ResourceCarousel"
import { SourceTypeEnum } from "api"
import { getSearchParamMap } from "@/common/utils"
import { HOME, UNITS } from "../../common/urls"
import { ChannelTypeEnum } from "api/v0"

const UNITS_LABEL = "MIT Units"

const Page = styled.div({})

export const ChannelTitleRow = styled.div`
  display: flex;
  flex-direction: row;
  align-items: center;

  h1 a {
    &:hover {
      text-decoration: none;
    }
  }
`

const FeaturedCoursesCarousel = styled(ResourceCarousel)(({ theme }) => ({
  margin: "80px 0",
  [theme.breakpoints.down("sm")]: {
    marginTop: "32px",
    marginBottom: "32px",
  },
}))
export const ChannelControls = styled.div`
  position: relative;
  min-height: 38px;
  display: flex;
`

interface UnitChannelSkeletonProps {
  children: React.ReactNode
  name: string
}

/**
 * Common structure for channel-oriented pages.
 *
 * Renders the channel title and avatar in a banner.
 */
const UnitChannelSkeleton: React.FC<UnitChannelSkeletonProps> = ({
  children,
  name,
}) => {
  const channel = useChannelDetail(ChannelTypeEnum.Unit, String(name))
  const urlParams = new URLSearchParams(channel.data?.search_filter)
  const displayConfiguration = channel.data?.configuration

  const urlParamMap: Record<string, string[] | string> = useMemo(() => {
    const urlParams = new URLSearchParams(channel.data?.search_filter)
    return getSearchParamMap(urlParams)
  }, [channel])

  const FEATURED_RESOURCES_CAROUSEL: ResourceCarouselProps["config"] = [
    {
      cardProps: { size: "medium" },
      data: {
        type: "lr_featured",
        params: { limit: 12, ...urlParamMap },
      },
      label: undefined,
    },
  ]

  return (
    <Page>
      <MetaTags title={channel.data?.title || UNITS_LABEL} />
      <Banner
        backgroundUrl={
          displayConfiguration?.banner_background ??
          "/static/images/background_steps.jpeg"
        }
        navText={
          <Breadcrumbs
            variant="dark"
            ancestors={[
              { href: HOME, label: "Home" },
              {
                href: UNITS,
                label: UNITS_LABEL,
              },
            ]}
            current={channel.data?.title}
          />
        }
        title={
          displayConfiguration?.logo && channel.data ? (
            <ChannelAvatar
              imageVariant="inverted"
              formImageUrl={displayConfiguration.logo}
              imageSize="medium"
              channel={channel.data}
            />
          ) : (
            channel.data?.title
          )
        }
        description={
          <>
            {displayConfiguration?.heading ? (
              <Box
                display="flex"
                flexDirection="row"
                alignItems="center"
                sx={{
                  flexGrow: 0,
                  flexShrink: 0,
                  order: 2,
                  width: { md: "80%", sm: "100%" },
                  my: 1,
                }}
              >
                <Typography variant="h4">
                  {displayConfiguration.heading}
                </Typography>
              </Box>
            ) : (
              <></>
            )}
            {displayConfiguration?.sub_heading ? (
              <Box
                display="flex"
                flexDirection="row"
                alignItems="center"
                sx={{
                  flexGrow: 0,
                  flexShrink: 0,
                  order: 2,
                  width: { md: "80%", sm: "100%" },
                  my: 1,
                }}
              >
                <Typography variant="body1">
                  {displayConfiguration.sub_heading}
                </Typography>
              </Box>
            ) : (
              <></>
            )}
            <Box
              display="flex"
              flexDirection="row"
              alignItems="end"
              sx={{
                flexGrow: 0,
                width: "100%",
                flexShrink: 1,
                order: 3,
                mt: { xs: "8px" },
                mb: { xs: "48px" },
              }}
            >
              <ChannelControls>
                {channel.data?.search_filter ? (
                  <SearchSubscriptionToggle
                    sourceType={SourceTypeEnum.ChannelSubscriptionType}
                    searchParams={urlParams}
                  />
                ) : null}
                {channel.data?.is_moderator ? (
                  <ChannelMenu
                    channelType={ChannelTypeEnum.Unit}
                    name={String(name)}
                  />
                ) : null}
              </ChannelControls>
            </Box>
          </>
        }
        action={
          channel.data && (
            <Box
              flexDirection="row"
              alignItems="end"
              alignSelf="center"
              display="flex"
              sx={{
                order: 2,
                flexGrow: 0,
                flexShrink: 0,
                width: { md: "408px", xs: "100%" },
              }}
            >
              <ChannelDetails channel={channel.data} />
            </Box>
          )
        }
      />
      <Container>
        <FeaturedCoursesCarousel
          title="Featured Courses"
          config={FEATURED_RESOURCES_CAROUSEL}
          isLoading={channel.isLoading}
        />
        {children}
      </Container>
    </Page>
  )
}

export default UnitChannelSkeleton
