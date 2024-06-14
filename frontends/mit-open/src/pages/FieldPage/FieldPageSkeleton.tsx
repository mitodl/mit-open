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
import { SearchSubscriptionToggle } from "@/page-components/SearchSubscriptionToggle/SearchSubscriptionToggle"
import { ChannelDetails } from "@/page-components/ChannelDetails/ChannelDetails"
import { useChannelDetail } from "api/hooks/fields"
import FieldMenu from "@/components/FieldMenu/FieldMenu"
import FieldAvatar from "@/components/FieldAvatar/FieldAvatar"
import ResourceCarousel, {
  ResourceCarouselProps,
} from "@/page-components/ResourceCarousel/ResourceCarousel"
import { SourceTypeEnum } from "api"
import { getSearchParamMap } from "@/common/utils"
import { DEPARTMENTS, HOME, TOPICS, UNITS } from "../../common/urls"

export const FieldTitleRow = styled.div`
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
    marginTop: "0px",
    marginBottom: "32px",
  },
}))
export const FieldControls = styled.div`
  position: relative;
  min-height: 38px;
  display: flex;
`

interface FieldSkeletonProps {
  children: React.ReactNode
  channelType: string
  name: string
}
const NAV_PATH: { [key: string]: { href: string; label: string } } = {
  topic: {
    href: TOPICS,
    label: "Topics",
  },
  department: {
    href: DEPARTMENTS,
    label: "Departments",
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
 * Common structure for field-oriented pages.
 *
 * Renders the field title and avatar in a banner.
 */
const FieldSkeletonProps: React.FC<FieldSkeletonProps> = ({
  children,
  channelType,
  name,
}) => {
  const field = useChannelDetail(String(channelType), String(name))
  const urlParams = new URLSearchParams(field.data?.search_filter)
  const displayConfiguration = field.data?.configuration

  const urlParamMap: Record<string, string[] | string> = useMemo(() => {
    const urlParams = new URLSearchParams(field.data?.search_filter)
    return getSearchParamMap(urlParams)
  }, [field])

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
    <BannerPage
      src={
        displayConfiguration?.banner_background ??
        "/static/images/background_steps.jpeg"
      }
      omitBackground={field.isLoading}
      backgroundSize="2000px auto"
      dim={30}
      bannerContent={
        <Container sx={{ my: 2, py: "48px" }}>
          <Breadcrumbs
            variant="dark"
            ancestors={[
              { href: HOME, label: "Home" },
              {
                href: NAV_PATH[channelType].href,
                label: NAV_PATH[channelType].label,
              },
            ]}
            current={field.data?.title}
          />
          <FieldTitleRow data-testid="banner">
            {field.data && (
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
                    })}
                  >
                    {displayConfiguration?.logo ? (
                      <FieldAvatar
                        imageVariant="inverted"
                        formImageUrl={displayConfiguration?.logo}
                        imageSize="medium"
                        field={field.data}
                      />
                    ) : (
                      <Typography variant="h1" data-testid="header">
                        <Link
                          to={routes.makeFieldViewPath(
                            field.data.channel_type,
                            field.data.name,
                          )}
                        >
                          {field.data.title}
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
                      <FieldControls>
                        {field.data?.search_filter ? (
                          <SearchSubscriptionToggle
                            sourceType={SourceTypeEnum.ChannelSubscriptionType}
                            searchParams={urlParams}
                          />
                        ) : null}
                        {field.data?.is_moderator ? (
                          <FieldMenu
                            channelType={String(channelType)}
                            name={String(name)}
                          />
                        ) : null}
                      </FieldControls>
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
                    <ChannelDetails field={field.data} />
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
                    <FieldControls>
                      {field.data?.search_filter ? (
                        <SearchSubscriptionToggle
                          sourceType={SourceTypeEnum.ChannelSubscriptionType}
                          searchParams={urlParams}
                        />
                      ) : null}
                      {field.data?.is_moderator ? (
                        <FieldMenu
                          channelType={String(channelType)}
                          name={String(name)}
                        />
                      ) : null}
                    </FieldControls>
                  </Box>
                )}
              </Box>
            )}
          </FieldTitleRow>
        </Container>
      }
    >
      {channelType === "unit" ? (
        <Container>
          <FeaturedCoursesCarousel
            title="Featured Courses"
            config={FEATURED_RESOURCES_CAROUSEL}
          />
        </Container>
      ) : null}
      {children}
    </BannerPage>
  )
}

export default FieldSkeletonProps
