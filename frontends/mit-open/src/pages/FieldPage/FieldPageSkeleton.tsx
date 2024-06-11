import React, { useMemo } from "react"
import { Link } from "react-router-dom"
import * as routes from "../../common/urls"
import { BannerPage, styled, Container, Typography, Box } from "ol-components"
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
  margin-bottom: 1em;
`

interface FieldSkeletonProps {
  children: React.ReactNode
  channelType: string
  name: string
}
const NAV_PATH: { [key: string]: string } = {
  topic: "Topics",
  department: "Departments",
  offeror: "MIT Units",
}

const NavText = styled(Typography)(({ theme }) => ({
  color: theme.custom.colors.lightGray2,
  marginBottom: "10px",
  ".current": {
    color: theme.custom.colors.silverGrayLight,
  },
}))

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
  const memoizedUrlParams = useMemo(() => {
    const urlParams = new URLSearchParams(field.data?.search_filter)
    return urlParams
  }, [field.data?.search_filter])

  const urlParamMap: Record<string, string[] | string> = useMemo(() => {
    return getSearchParamMap(memoizedUrlParams)
  }, [memoizedUrlParams])

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
      alt=""
      omitBackground={field.isLoading}
      bannerContent={
        <Container sx={{ my: 2, py: "48px" }}>
          <NavText variant="subtitle3">
            Home / {NAV_PATH[channelType]} /{" "}
            <span className="current">{field.data?.title}</span>
          </NavText>
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
                  sx={{ flexGrow: 24, flexShrink: 0, order: 1, width: "60%" }}
                >
                  <Box
                    display="flex"
                    flexDirection="row"
                    alignItems="center"
                    sx={{ flexGrow: 1, flexShrink: 0, order: 1, mt: 3 }}
                  >
                    {displayConfiguration?.logo ? (
                      <FieldAvatar
                        imageVariant="inverted"
                        formImageUrl={displayConfiguration?.logo}
                        imageSize="medium"
                        field={field.data}
                      />
                    ) : (
                      <Typography variant="h3" data-testid="header">
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
                        width: "90%",
                        my: 2,
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
                      width: "60%",
                      my: 2,
                    }}
                  >
                    <Typography variant="body2">
                      {displayConfiguration.sub_heading}
                    </Typography>
                  </Box>
                  {channelType === "offeror" ? (
                    <Box
                      display="flex"
                      flexDirection="row"
                      alignItems="end"
                      sx={{
                        flexGrow: 0,
                        width: "100%",
                        flexShrink: 1,
                        order: 3,
                        my: 2,
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
                {channelType === "offeror" ? (
                  <Box
                    flexDirection="row"
                    alignItems="end"
                    alignSelf="center"
                    display="flex"
                    sx={{
                      order: 2,
                      flexGrow: 1,
                      flexShrink: 0,
                      width: { md: "300px", xs: "100%" },
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
                      flexGrow: 1,
                      width: { md: "15%", xs: "100%" },
                      flexShrink: 0,
                      order: 2,
                      my: 1,
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
      <Container>
        <FeaturedCoursesCarousel
          title="Featured Courses"
          config={FEATURED_RESOURCES_CAROUSEL}
        />
      </Container>
      {children}
    </BannerPage>
  )
}

export default FieldSkeletonProps
