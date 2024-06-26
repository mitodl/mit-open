import React, { useMemo } from "react"
import { Link } from "react-router-dom"
import * as routes from "../../common/urls"
import {
  BannerPage,
  styled,
  Container,
  Typography,
  Box,
  Breadcrumbs,
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
import { DEPARTMENTS, HOME, TOPICS, UNITS } from "../../common/urls"

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

interface ChannelSkeletonProps {
  children: React.ReactNode
  channelType: string
  name: string
}
const NAV_PATH: { [key: string]: { href: string; label: string } } = {
  topic: {
    href: TOPICS,
    label: "Browse by Topic",
  },
  department: {
    href: DEPARTMENTS,
    label: "Browse by Academic Department",
  },
  unit: {
    href: UNITS,
    label: "MIT Units",
  },
  pathway: {
    href: "",
    label: "Pathways",
  },
}

/**
 * Common structure for channel-oriented pages.
 *
 * Renders the channel title and avatar in a banner.
 */
const ChannelSkeletonProps: React.FC<ChannelSkeletonProps> = ({
  children,
  channelType,
  name,
}) => {
  const channel = useChannelDetail(String(channelType), String(name))
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
    <>
      <MetaTags title={channel.data?.title || NAV_PATH[channelType].label} />
      <BannerPage
        src={
          displayConfiguration?.banner_background ??
          "/static/images/background_steps.jpeg"
        }
        omitBackground={channel.isLoading}
        backgroundSize="2000px auto"
        dim={30}
        bannerContent={
          <Container sx={{ pt: "48px", pb: "64px" }}>
            <Breadcrumbs
              variant="dark"
              ancestors={[
                { href: HOME, label: "Home" },
                {
                  href: NAV_PATH[channelType].href,
                  label: NAV_PATH[channelType].label,
                },
              ]}
              current={channel.data?.title}
            />
            <ChannelTitleRow data-testid="banner">
              {channel.data && (
                <Box
                  flexDirection="row"
                  alignItems="start"
                  sx={{
                    display: "flex",
                    flexWrap: "wrap",
                    width: "100%",
                    color: "white",
                    flexShrink: 1,
                    flexGrow: 0,
                  }}
                >
                  <Box
                    display="flex"
                    flexDirection="column"
                    alignItems="start"
                    sx={{
                      flexGrow: 1,
                      flexShrink: 0,
                      order: 1,
                      width: "50%",
                    }}
                  >
                    <Box
                      display="flex"
                      flexDirection="row"
                      alignItems="center"
                      sx={(theme) => ({
                        flexGrow: 1,
                        flexShrink: 0,
                        order: 1,
                        py: "24px",

                        [theme.breakpoints.down("md")]: {
                          py: 0,
                          pb: "8px",
                        },
                        [theme.breakpoints.down("sm")]: {
                          width: "100%",
                        },
                      })}
                    >
                      {displayConfiguration?.logo ? (
                        <ChannelAvatar
                          imageVariant="inverted"
                          formImageUrl={displayConfiguration?.logo}
                          imageSize="medium"
                          channel={channel.data}
                        />
                      ) : (
                        <Typography variant="h1" data-testid="header">
                          <Link
                            to={routes.makeChannelViewPath(
                              channel.data.channel_type,
                              channel.data.name,
                            )}
                          >
                            {channel.data.title}
                          </Link>
                        </Typography>
                      )}
                    </Box>
                    {displayConfiguration.heading ? (
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
                    {channelType === "unit" ? (
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
                              sourceType={
                                SourceTypeEnum.ChannelSubscriptionType
                              }
                              searchParams={urlParams}
                            />
                          ) : null}
                          {channel.data?.is_moderator ? (
                            <ChannelMenu
                              channelType={String(channelType)}
                              name={String(name)}
                            />
                          ) : null}
                        </ChannelControls>
                      </Box>
                    ) : null}
                  </Box>
                  {channelType === "unit" ? (
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
                  ) : (
                    <Box
                      display="flex"
                      flexDirection="row"
                      alignItems="end"
                      sx={{
                        flexGrow: 0,
                        width: { md: "15%", xs: "100%" },
                        flexShrink: 0,
                        order: 2,
                        mt: { md: "0px", sm: "8px" },
                        mb: { md: "0px", sm: "48px" },
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
                            channelType={String(channelType)}
                            name={String(name)}
                          />
                        ) : null}
                      </ChannelControls>
                    </Box>
                  )}
                </Box>
              )}
            </ChannelTitleRow>
          </Container>
        }
      >
        {channelType === "unit" ? (
          <Container>
            <FeaturedCoursesCarousel
              title="Featured Courses"
              config={FEATURED_RESOURCES_CAROUSEL}
              isLoading={channel.isLoading}
            />
          </Container>
        ) : null}
        {children}
      </BannerPage>
    </>
  )
}

export default ChannelSkeletonProps
