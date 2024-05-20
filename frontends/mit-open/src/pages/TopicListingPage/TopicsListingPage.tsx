import React, { useMemo } from "react"
import {
  Container,
  Typography,
  styled,
  Grid,
  PlainList,
  ChipLink,
} from "ol-components"
import { MetaTags } from "ol-utilities"

import {
  useLearningResourceTopics,
  useLearningResourcesSearch,
} from "api/hooks/learningResources"
import { RiEarthLine } from "@remixicon/react"
import { LearningResourceSearchResponse, LearningResourceTopic } from "api"

type ChannelSummary = {
  id: number | string
  name: string
  channel_url: string
  courses: number
  programs: number
}

const FullWidthBackground = styled.div`
  background-image: url("/static/images/background_steps.jpeg");
  background-size: cover;
  padding-top: 48px;
  padding-bottom: 48px;
  color: ${({ theme }) => theme.custom.colors.white};
`

type RootHeaderProps = {
  SvgIcon: React.ComponentType
  title: string
  href?: string
  className?: string
}
const RootTopicHeader = styled(
  ({ SvgIcon, title, href, className }: RootHeaderProps) => {
    return (
      <h3 className={className}>
        <a href={href}>
          <SvgIcon aria-hidden="true" />
          {title}
          <span>View</span>
        </a>
      </h3>
    )
  },
)(({ theme }) => ({
  ...theme.typography.h5,
  color: theme.custom.colors.black,
  marginBottom: "8px",
  a: {
    display: "flex",
    alignItems: "center",
  },
  svg: {
    marginRight: "16px",
  },
}))

const RootTopicCounts = styled.div(({ theme }) => ({
  marginLeft: "40px",
  color: theme.custom.colors.silverGrayDark,
  display: "flex",
  gap: "8px",
}))

const SubTopicsContainer = styled.div({
  marginLeft: "40px",
  marginTop: "16px",
  display: "flex",
  flexWrap: "wrap",
  gap: "12px",
})

type RootTopicItemProps = {
  SvgIcon: React.ComponentType
  topicGroup: TopicGroup
  className?: string
  courseCount?: number
  programCount?: number
}
const RootTopicItem = styled(
  ({
    SvgIcon,
    topicGroup,
    className,
    courseCount,
    programCount,
  }: RootTopicItemProps) => {
    const counts = [
      { label: "Courses", count: courseCount },
      { label: "Courses", count: programCount },
    ].filter((item) => item.count)
    const { title, href, channels } = topicGroup
    return (
      <li className={className}>
        <RootTopicHeader SvgIcon={SvgIcon} title={title} href={href} />
        <RootTopicCounts>
          {counts.map((item) => (
            <Typography key={item.label} variant="body3">
              {item.label}: {item.count}
            </Typography>
          ))}
        </RootTopicCounts>
        <SubTopicsContainer>
          {channels.map((c) => (
            <ChipLink key={c.id} href={c.channel_url} label={c.name} />
          ))}
        </SubTopicsContainer>
      </li>
    )
  },
)()

const HeaderDesription = styled(Typography)(({ theme }) => ({
  maxWidth: "700px",
  marginTop: theme.spacing(1),
}))

const Page = styled.div(({ theme }) => ({
  backgroundColor: theme.custom.colors.white,
}))

const aggregateByTopic = (
  data: LearningResourceSearchResponse,
): Record<string, number> => {
  const buckets = data.metadata.aggregations["topic"] ?? []
  return Object.fromEntries(
    buckets.map((bucket) => {
      return [bucket.key, bucket.doc_count]
    }),
  )
}

type TopicGroup = {
  id: number
  title: string
  href?: string
  channels: ChannelSummary[]
}
const groupTopics = (
  topics: LearningResourceTopic[],
  courseCounts: Record<string, number>,
  programCounts: Record<string, number>,
): TopicGroup[] => {
  const sorted = topics.sort((a, b) => {
    return a.name.localeCompare(b.name)
  })
  const groups: Record<number, TopicGroup> = Object.fromEntries(
    sorted
      .filter((topic) => !topic.parent)
      .map((topic) => [
        topic.id,
        {
          id: topic.id,
          channels: [],
          title: topic.name,
          href: topic.channel_url || undefined,
        },
      ]),
  )
  sorted.forEach((topic) => {
    if (!topic.parent) return
    if (groups[topic.parent] && topic.channel_url) {
      groups[topic.parent].channels.push({
        id: topic.id,
        name: topic.name,
        channel_url: topic.channel_url,
        courses: courseCounts[topic.name],
        programs: programCounts[topic.name],
      })
    }
  })
  return Object.values(groups)
    .filter((group) => group.channels.length > 0)
    .sort((a, b) => a.title.localeCompare(b.title))
}

const DepartmentListingPage: React.FC = () => {
  const topicsQuery = useLearningResourceTopics()
  const courseQuery = useLearningResourcesSearch({
    resource_type: ["course"],
    aggregations: ["topic"],
  })
  const programQuery = useLearningResourcesSearch({
    resource_type: ["program"],
    aggregations: ["topic"],
  })
  const channelsGroups = useMemo(() => {
    const courseCounts = courseQuery.data
      ? aggregateByTopic(courseQuery.data)
      : {}
    const programCounts = programQuery.data
      ? aggregateByTopic(programQuery.data)
      : {}
    return groupTopics(
      topicsQuery.data?.results ?? [],
      courseCounts,
      programCounts,
    )
  }, [topicsQuery.data?.results, courseQuery.data, programQuery.data])

  return (
    <Page>
      <MetaTags>
        <title>Topics</title>
      </MetaTags>
      <FullWidthBackground>
        <Container>
          <Typography variant="subtitle3">MIT / Topics</Typography>
          <Typography variant="h1">Topics</Typography>
          <HeaderDesription>
            Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do
            eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim
            ad minim veniam.
          </HeaderDesription>
        </Container>
      </FullWidthBackground>
      <Container>
        <Grid container>
          <Grid item xs={0} sm={1}></Grid>
          <Grid item xs={12} sm={10}>
            <PlainList>
              {channelsGroups.map((group) => (
                <RootTopicItem
                  SvgIcon={RiEarthLine}
                  key={group.id}
                  topicGroup={group}
                  courseCount={10}
                  programCount={100}
                />
              ))}
            </PlainList>
          </Grid>
        </Grid>
      </Container>
    </Page>
  )
}

export default DepartmentListingPage
