import React from "react"
import {
  styled,
  Breadcrumbs,
  Banner,
  ChipLink,
  Typography,
} from "ol-components"
import { SearchSubscriptionToggle } from "@/page-components/SearchSubscriptionToggle/SearchSubscriptionToggle"
import { useChannelDetail } from "api/hooks/channels"
import ChannelMenu from "@/components/ChannelMenu/ChannelMenu"
import ChannelAvatar from "@/components/ChannelAvatar/ChannelAvatar"
import { SourceTypeEnum } from "api"
import { HOME as HOME_URL } from "../../common/urls"
import {
  CHANNEL_TYPE_BREADCRUMB_TARGETS,
  ChannelControls,
} from "./ChannelPageTemplate"
import MetaTags from "@/page-components/MetaTags/MetaTags"
import { ChannelTypeEnum } from "api/v0"
import { useLearningResourceTopics } from "api/hooks/learningResources"
import { propsNotNil } from "ol-utilities"

const ChildrenContainer = styled.div(({ theme }) => ({
  paddingTop: "40px",
  [theme.breakpoints.down("sm")]: {
    paddingTop: "24px",
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

const SubTopicsContainer = styled.div(({ theme }) => ({
  paddingTop: "30px",
  [theme.breakpoints.down("md")]: {
    paddingTop: "16px",
    paddingBottom: "16px",
  },
}))

const SubTopicsHeader = styled(Typography)(({ theme }) => ({
  marginBottom: "16px",
  ...theme.typography.subtitle1,
}))

const ChipsContainer = styled.div({
  display: "flex",
  flexWrap: "wrap",
  gap: "12px",
})

type TopicChipsInternalProps = {
  title: string
  topicId: number
  parentTopicId: number
}

const TopicChipsInternal: React.FC<TopicChipsInternalProps> = (props) => {
  const { title, topicId, parentTopicId } = props
  const subTopicsQuery = useLearningResourceTopics({
    parent_topic_id: [parentTopicId],
  })
  const topics = subTopicsQuery.data?.results
    ?.filter(propsNotNil(["channel_url"]))
    .filter((t) => t.id !== topicId)
  const totalTopics = topics?.length ?? 0
  return totalTopics > 0 ? (
    <SubTopicsContainer>
      <SubTopicsHeader data-testid="sub-topics-header">{title}</SubTopicsHeader>
      <ChipsContainer>
        {topics?.map((topic) => (
          <ChipLink
            size="large"
            variant="darker"
            key={topic.id}
            href={topic.channel_url ?? ""}
            label={topic.name}
          />
        ))}
      </ChipsContainer>
    </SubTopicsContainer>
  ) : null
}

type TopicChipsProps = {
  topicId: number
}

const TopicChips: React.FC<TopicChipsProps> = (props) => {
  const { topicId } = props
  const topicQuery = useLearningResourceTopics({
    id: [topicId],
  })
  const topic = topicQuery.data?.results?.[0]
  const isTopLevelTopic = topic?.parent === null
  if (isTopLevelTopic) {
    return (
      <TopicChipsInternal
        title="Subtopics"
        topicId={topicId}
        parentTopicId={topicId}
      />
    )
  } else if (topic?.parent) {
    return (
      <TopicChipsInternal
        title="Related Topics"
        topicId={topicId}
        parentTopicId={topic?.parent}
      />
    )
  } else return null
}

interface DefaultChannelTemplateProps {
  children: React.ReactNode
  channelType: string
  name: string
}

/**
 * Common structure for channel-oriented pages.
 *
 * Renders the channel title and avatar in a banner.
 */
const DefaultChannelTemplate: React.FC<DefaultChannelTemplateProps> = ({
  children,
  channelType,
  name,
}) => {
  const channel = useChannelDetail(String(channelType), String(name))
  const urlParams = new URLSearchParams(channel.data?.search_filter)
  const displayConfiguration = channel.data?.configuration
  return (
    <>
      <MetaTags title={channel.data?.title} />
      <Banner
        navText={
          <Breadcrumbs
            variant="dark"
            ancestors={[
              { href: HOME_URL, label: "Home" },
              {
                href: CHANNEL_TYPE_BREADCRUMB_TARGETS[channelType].href,
                label: CHANNEL_TYPE_BREADCRUMB_TARGETS[channelType].label,
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
        title={channel.data?.title}
        header={displayConfiguration?.heading}
        subHeader={displayConfiguration?.sub_heading}
        extraHeader={
          channel.data?.channel_type === ChannelTypeEnum.Topic &&
          channel.data?.topic_detail?.topic ? (
            <TopicChips topicId={channel.data?.topic_detail?.topic} />
          ) : null
        }
        backgroundUrl={
          displayConfiguration?.banner_background ??
          "/static/images/background_steps.jpeg"
        }
        extraRight={
          <ChannelControlsContainer>
            <ChannelControls>
              {channel.data?.search_filter ? (
                <SearchSubscriptionToggle
                  itemName={channel.data?.title}
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
      <ChildrenContainer>{children}</ChildrenContainer>
    </>
  )
}

export default DefaultChannelTemplate
