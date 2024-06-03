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
    margin-left: 1em;

    &:hover {
      text-decoration: none;
    }
  }
`

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
  return (
    <BannerPage
      src={field.data?.banner ?? ""}
      alt=""
      omitBackground={field.isLoading}
      bannerContent={
        <Container sx={{ py: 1 }}>
          <FieldTitleRow>
            {field.data && (
              <Box
                flexDirection="row"
                alignItems="start"
                sx={{
                  m: 1,
                  display: "flex",
                  flexWrap: "wrap",
                  width: "100%",
                  flexShrink: 1,
                  flexGrow: 0,
                }}
              >
                <Box
                  display="flex"
                  flexDirection="row"
                  alignItems="center"
                  sx={{ flexGrow: 1, width: "70%", flexShrink: 0, order: 1 }}
                >
                  <FieldAvatar field={field.data} imageSize="medium" />
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
                </Box>
                {channelType === "offeror" ? (
                  <Box
                    flexDirection="column"
                    justifyContent="end"
                    display="flex"
                    sx={{ order: 2, flexGrow: 0, flexShrink: 0 }}
                  >
                    <ChannelDetails field={field.data} />
                  </Box>
                ) : (
                  <Box></Box>
                )}
                <Box
                  flexDirection="row"
                  display="flex"
                  alignItems="start"
                  sx={{ flexShrink: 1, flexGrow: 1, order: 3, width: "70%" }}
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
