import React, { useMemo } from "react"
import { styled, Container, Box, Breadcrumbs, Banner } from "ol-components"
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

const FeaturedCoursesCarousel = styled(ResourceCarousel)(({ theme }) => ({
  margin: "80px 0",
  [theme.breakpoints.down("sm")]: {
    marginTop: "32px",
    marginBottom: "32px",
  },
}))

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

  const headerStyles = {
    width: { md: "80%", sm: "100%" },
    my: 1,
  }

  return (
    <>
      <MetaTags title={channel.data?.title || UNITS_LABEL} />
      <Banner
        backgroundUrl={
          displayConfiguration?.banner_background ??
          "/static/images/background_steps.jpeg"
        }
        backgroundSize="2000px auto"
        backgroundDim={30}
        containerPadding={"48px 0 64px 0"}
        navText={
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
        }
        avatar={
          displayConfiguration?.logo && channel.data ? (
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
                  pt: "32px",
                  width: "100%",
                },
              })}
            >
              <ChannelAvatar
                imageVariant="inverted"
                formImageUrl={displayConfiguration.logo}
                imageSize="medium"
                channel={channel.data}
              />
            </Box>
          ) : null
        }
        header={displayConfiguration?.heading}
        headerTypography={{ xs: "h5", md: "h4" }}
        headerStyles={headerStyles}
        subheader={displayConfiguration?.sub_heading}
        subheaderStyles={headerStyles}
        subheaderTypography={{ xs: "body2", md: "body1" }}
        extraHeader={
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
        }
        extraRight={
          channel.data && (
            <Box
              flexDirection="row"
              alignItems="end"
              alignSelf="center"
              display="flex"
              sx={{
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
    </>
  )
}

export default UnitChannelTemplate
