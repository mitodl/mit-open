import React from "react"
import {
  styled,
  Container,
  Typography,
  Breadcrumbs,
  Banner,
} from "ol-components"
import { MetaTags } from "ol-utilities"
import { SearchSubscriptionToggle } from "@/page-components/SearchSubscriptionToggle/SearchSubscriptionToggle"
import { useChannelDetail } from "api/hooks/channels"
import ChannelMenu from "@/components/ChannelMenu/ChannelMenu"
import ChannelAvatar from "@/components/ChannelAvatar/ChannelAvatar"
import { SourceTypeEnum } from "api"
import { DEPARTMENTS, HOME, TOPICS, UNITS } from "../../common/urls"

const Page = styled.div({})

const HeadingTextContainer = styled.div(({ theme }) => ({
  display: "flex",
  flexDirection: "row",
  alignItems: "center",
  flexGrow: 0,
  flexShrink: 0,
  order: 2,
  my: 1,
  [theme.breakpoints.down("sm")]: {
    width: "100%",
  },
  [theme.breakpoints.up("md")]: {
    width: "80%",
  },
}))

const ChannelControlsContainer = styled.div(({ theme }) => ({
  display: "flex",
  flexDirection: "row",
  alignItems: "end",
  flexGrow: 0,
  flexShrink: 0,
  order: 2,
  [theme.breakpoints.down("xs")]: {
    width: "100%",
  },
  [theme.breakpoints.down("sm")]: {
    mt: "8px",
    mb: "48px",
  },
  [theme.breakpoints.up("md")]: {
    mt: "0px",
    mb: "48px",
    width: "15%",
  },
}))

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

export const ChannelControls = styled.div`
  position: relative;
  min-height: 38px;
  display: flex;
`

interface DefaultChannelSkeletonProps {
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
const DefaultChannelSkeleton: React.FC<DefaultChannelSkeletonProps> = ({
  children,
  channelType,
  name,
}) => {
  const channel = useChannelDetail(String(channelType), String(name))
  const urlParams = new URLSearchParams(channel.data?.search_filter)
  const displayConfiguration = channel.data?.configuration

  return (
    <Page>
      <MetaTags title={channel.data?.title || NAV_PATH[channelType].label} />
      <Banner
        navText={
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
        }
        avatar={
          displayConfiguration?.logo &&
          channel.data && (
            <ChannelAvatar
              imageVariant="inverted"
              formImageUrl={displayConfiguration.logo}
              imageSize="medium"
              channel={channel.data}
            />
          )
        }
        header={channel.data?.title}
        subHeader={displayConfiguration?.heading}
        extraHeader={displayConfiguration?.sub_heading}
        backgroundUrl={
          displayConfiguration?.banner_background ??
          "/static/images/background_steps.jpeg"
        }
        extraRight={
          <ChannelControlsContainer>
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
          </ChannelControlsContainer>
        }
      />
      <Container>
        <ChannelTitleRow data-testid="banner">
          {displayConfiguration?.heading ? (
            <HeadingTextContainer>
              <Typography variant="h4">
                {displayConfiguration.heading}
              </Typography>
            </HeadingTextContainer>
          ) : (
            <></>
          )}
          {displayConfiguration?.sub_heading ? (
            <HeadingTextContainer>
              <Typography variant="body1">
                {displayConfiguration.sub_heading}
              </Typography>
            </HeadingTextContainer>
          ) : (
            <></>
          )}
        </ChannelTitleRow>
      </Container>
      {children}
    </Page>
  )
}

export default DefaultChannelSkeleton
