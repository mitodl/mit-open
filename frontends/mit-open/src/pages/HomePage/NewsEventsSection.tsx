import React from "react"
import { Container, styled, theme, Typography } from "ol-components"
import {
  useNewsEventsList,
  NewsEventsListFeedTypeEnum,
} from "api/hooks/newsEvents"
// import LearningResourceCard from "@/page-components/LearningResourceCard/LearningResourceCard"
// import { LearningResource } from "api"

const Section = styled.section`
  background: ${theme.custom.colors.white};
  padding: 80px 0;
  ${theme.breakpoints.down("md")} {
    padding: 40px 0;
  }
`

const Title = styled(Typography)`
  text-align: center;
  margin-bottom: 8px;
`

const StrapLine = styled(Typography)`
  ${{ ...theme.typography.body1 }}
  color: ${theme.custom.colors.silverGrayDark};
  text-align: center;
`

const Content = styled.div`
  display: flex;
  align-items: flex-start;
  gap: 24px;
`

const StoriesContainer = styled.div``

const EventsContainer = styled.div``

const NewsEventsSection: React.FC = () => {
  const { data: news } = useNewsEventsList({
    feed_type: [NewsEventsListFeedTypeEnum.News],
    limit: 6,
  })

  const { data: events } = useNewsEventsList({
    feed_type: [NewsEventsListFeedTypeEnum.Events],
    limit: 6,
  })

  if (!news || !events) {
    return null
  }
  return (
    <Section>
      <Container>
        <Title variant="h2">Experience MIT</Title>
        <StrapLine>See what’s happening in the world of learning.</StrapLine>
        <Content>
          <StoriesContainer>
            <Typography variant="h4">Stories</Typography>
            {/* {news!.results.map((item) => (
            ))} */}
          </StoriesContainer>
          <EventsContainer>
            <Typography variant="h4">Events</Typography>
            {/* {events.results.map((item) => (
            ))} */}
          </EventsContainer>
        </Content>
      </Container>
    </Section>
  )
}

export default NewsEventsSection
