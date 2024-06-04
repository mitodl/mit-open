import React from "react"
import { Link } from "react-router-dom"
import * as routes from "../../common/urls"
import { BannerPage, styled, Container, Typography, Box } from "ol-components"
import { SearchSubscriptionToggle } from "@/page-components/SearchSubscriptionToggle/SearchSubscriptionToggle"
import { ChannelDetails } from "@/page-components/ChannelDetails/ChannelDetails"
import { useChannelDetail } from "api/hooks/fields"
import FieldMenu from "@/components/FieldMenu/FieldMenu"
import FieldAvatar from "@/components/FieldAvatar/FieldAvatar"

import { SourceTypeEnum } from "api"

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
  return (
    <BannerPage
      src={displayConfiguration?.banner_background ?? ""}
      alt=""
      omitBackground={field.isLoading}
      bannerContent={
        <Container sx={{ my: 2 }}>
          <FieldTitleRow>
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
                    sx={{ flexGrow: 1, flexShrink: 0, order: 1 }}
                  >
                    {displayConfiguration?.logo ? (
                      <FieldAvatar
                        imageVariant="inverted"
                        formImageUrl={displayConfiguration?.logo}
                        imageSize="extraLarge"
                      />
                    ) : (
                      <Typography variant="h3" component="h1">
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
                        mt: 3,
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
                      width: "90%",
                      mt: 3,
                    }}
                  >
                    <Typography variant="body2">
                      {displayConfiguration.sub_heading}
                    </Typography>
                  </Box>

                  <Box
                    display="flex"
                    flexDirection="row"
                    alignItems="end"
                    sx={{
                      flexGrow: 0,
                      width: "100%",
                      flexShrink: 1,
                      order: 3,
                      mt: 3,
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
                  <Box></Box>
                )}
              </Box>
            )}
          </FieldTitleRow>
        </Container>
      }
    >
      {children}
    </BannerPage>
  )
}

export default FieldSkeletonProps
