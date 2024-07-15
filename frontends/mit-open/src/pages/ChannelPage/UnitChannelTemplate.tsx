import React, { useMemo } from "react"
import {
  styled,
  Container,
  Box,
  Breadcrumbs,
  Stack,
  BannerBackground,
  Typography,
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
import { HOME as HOME_URL, UNITS as UNITS_URL } from "../../common/urls"
import { ChannelTypeEnum } from "api/v0"
import { ChannelControls, UNITS_LABEL } from "./ChannelPageTemplate"

const StyledBannerBackground = styled(BannerBackground)(({ theme }) => ({
  padding: "48px 0 64px 0",
  [theme.breakpoints.down("sm")]: {
    padding: "32px 0 16px 0",
  },
}))

const FeaturedCoursesCarousel = styled(ResourceCarousel)(({ theme }) => ({
  margin: "80px 0",
  [theme.breakpoints.down("sm")]: {
    marginTop: "32px",
    marginBottom: "32px",
  },
}))

const BannerContent = styled.div(({ theme }) => ({
  display: "flex",
  flexDirection: "row",
  alignItems: "center",
  justifyContent: "space-between",
  [theme.breakpoints.down("md")]: {
    flexDirection: "column",
  },
}))

const ChannelHeader = styled.h1({
  margin: 0,
  display: "flex",
  flexGrow: 1,
  flexShrink: 0,
})

const HEADER_STYLES = {
  width: { md: "80%", sm: "100%" },
}

interface UnitChannelTemplateProps {
  children: React.ReactNode
  name: string
}

/**
 * Common structure for channel-oriented pages.
 *
 * Renders the channel title and avatar in a banner.
 */
const UnitChannelTemplate: React.FC<UnitChannelTemplateProps> = ({
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
    <>
      <MetaTags title={channel.data?.title || UNITS_LABEL} />
      <StyledBannerBackground
        backgroundUrl={
          displayConfiguration?.banner_background ??
          "/static/images/background_steps.jpeg"
        }
        backgroundSize="2000px auto"
        backgroundDim={30}
      >
        <Container>
          <Breadcrumbs
            variant="dark"
            ancestors={[
              { href: HOME_URL, label: "Home" },
              {
                href: UNITS_URL,
                label: UNITS_LABEL,
              },
            ]}
            current={channel.data?.title}
          />
          <BannerContent>
            <Stack gap={{ xs: "16px", lg: "24px" }}>
              <ChannelHeader aria-label={channel.data?.title}>
                {channel.data ? (
                  <ChannelAvatar
                    imageVariant="inverted"
                    formImageUrl={displayConfiguration.logo}
                    imageSize="medium"
                    channel={channel.data}
                  />
                ) : null}
              </ChannelHeader>
              <Stack gap={{ xs: "16px", lg: "32px" }}>
                <Typography
                  typography={{ xs: "h5", md: "h4" }}
                  sx={HEADER_STYLES}
                >
                  {displayConfiguration?.heading}
                </Typography>
                <Typography
                  typography={{ xs: "body2", md: "body1" }}
                  sx={HEADER_STYLES}
                >
                  {displayConfiguration?.sub_heading}
                </Typography>
              </Stack>
              <Box
                display="flex"
                flexDirection="row"
                alignItems="end"
                sx={{
                  flexGrow: 0,
                  width: "100%",
                  flexShrink: 1,
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
            </Stack>
            {channel.data ? <ChannelDetails channel={channel.data} /> : null}
          </BannerContent>
        </Container>
      </StyledBannerBackground>
      <Container>
        <FeaturedCoursesCarousel
          title="Featured Courses"
          config={FEATURED_RESOURCES_CAROUSEL}
          isLoading={channel.isLoading}
        />
        {children}
      </Container>
    </>
  )
}

export default UnitChannelTemplate
