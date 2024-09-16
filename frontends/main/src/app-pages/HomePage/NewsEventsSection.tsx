import React from "react"
import {
  Container,
  styled,
  theme,
  Typography,
  Grid,
  Card,
  TypographyProps,
} from "ol-components"
import {
  useNewsEventsList,
  NewsEventsListFeedTypeEnum,
} from "api/hooks/newsEvents"
import type { NewsFeedItem, EventFeedItem } from "api/v0"
import { formatDate } from "ol-utilities"
import { RiArrowRightSLine } from "@remixicon/react"

const Section = styled.section`
  background: ${theme.custom.colors.white};
  padding: 80px 0;
  ${theme.breakpoints.down("md")} {
    padding: 40px 0;
  }
`

const Title = styled(Typography)<Pick<TypographyProps, "component">>`
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
  margin-top: 40px;
`

const MobileContent = styled.div`
  display: flex;
  align-items: center;
  flex-direction: column;
  gap: 40px;
  margin: 40px 0;
`

const StoriesContainer = styled.section`
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 12px;
  flex: 1 0 0;
`

const MobileContainer = styled.section`
  width: 100%;
  margin: 0 -16px;

  h4 {
    margin: 0 16px 24px;
  }
`

const EventsContainer = styled.section`
  display: flex;
  width: 408px;
  flex-direction: column;
  align-items: flex-start;
  gap: 12px;
`

const StoryCard = styled(Card)<{ mobile: boolean }>`
  display: flex;
  flex-direction: column;
  flex-shrink: 0;
  ${({ mobile }) => (mobile ? "width: 274px" : "")}
`

const StoriesSlider = styled.div`
  display: flex;
  align-items: flex-start;
  gap: 16px;
  overflow-x: scroll;
  padding: 0 16px 24px;
`

const Events = styled.div`
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 24px;
  align-self: stretch;
`

const MobileEvents = styled(Events)`
  padding: 0 16px;
  gap: 18px;
`

const EventCard = styled(Card)`
  display: flex;
  align-items: center;
  gap: 16px;
  flex: 1 0 0;
  align-self: stretch;
  justify-content: space-between;
  overflow: visible;

  > a {
    padding: 16px;
  }
`

const EventDate = styled.div`
  display: flex;
  height: 64px;
  flex-basis: 64px;
  flex-shrink: 0;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  border-radius: 4px;
  background: ${theme.custom.colors.lightGray1};
`

const EventDay = styled.p`
  color: ${theme.custom.colors.red};
  font-family: ${theme.typography.fontFamily};
  font-size: ${theme.typography.pxToRem(28)};
  font-weight: ${theme.typography.fontWeightBold};
  line-height: ${theme.typography.pxToRem(36)};
  margin: 0 0 -4px;
`
const EventMonth = styled.p`
  margin: 0;
  color: ${theme.custom.colors.silverGrayDark};
  text-transform: uppercase;
  ${{ ...theme.typography.subtitle3 }}
`

const EventTitle = styled.p`
  color: ${theme.custom.colors.darkGray2};
  ${{ ...theme.typography.subtitle1 }}
  margin: 0;
  overflow: hidden;
  margin-right: auto;

  @supports (-webkit-line-clamp: 3) {
    white-space: initial;
    display: -webkit-box;
    -webkit-line-clamp: 3;
    -webkit-box-orient: vertical;
  }
`

const Chevron = styled(RiArrowRightSLine)`
  width: 24px;
  height: 24px;
  flex-shrink: 0;
  fill: ${theme.custom.colors.silverGray};
  justify-content: flex-end;
`

const MobileTypography = styled(Typography)`
  margin: 0 16px 12px 16px;
`

const AboveMdOnly = styled.div(({ theme }) => ({
  [theme.breakpoints.down("md")]: {
    display: "none",
  },
}))

const BelowMdOnly = styled.div(({ theme }) => ({
  [theme.breakpoints.up("md")]: {
    display: "none",
  },
}))

const AboveLgOnly = styled.div(({ theme }) => ({
  [theme.breakpoints.down("lg")]: {
    display: "none",
  },
}))

const Story: React.FC<{ item: NewsFeedItem; mobile: boolean }> = ({
  item,
  mobile,
}) => {
  return (
    <StoryCard mobile={mobile} href={item.url}>
      {item.image.url ? (
        <Card.Image src={item.image.url} alt={item.image.alt || ""} />
      ) : null}
      <Card.Title lines={2} style={{ marginBottom: -13 }}>
        {item.title}
      </Card.Title>
      <Card.Footer>
        Published: {formatDate(item.news_details?.publish_date)}
      </Card.Footer>
    </StoryCard>
  )
}

const NewsEventsSection: React.FC = () => {
  const { data: news } = useNewsEventsList({
    feed_type: [NewsEventsListFeedTypeEnum.News],
    limit: 6,
    sortby: "-news_date",
  })

  const { data: events } = useNewsEventsList({
    feed_type: [NewsEventsListFeedTypeEnum.Events],
    limit: 5,
    sortby: "event_date",
  })

  if (!news || !events) {
    return null
  }

  const stories = news!.results?.slice(0, 6) || []

  const EventCards =
    events!.results?.map((item) => (
      <EventCard key={item.id} href={item.url}>
        <Card.Content>
          <EventDate>
            <EventDay>
              {formatDate(
                (item as EventFeedItem).event_details?.event_datetime,
                "D",
              )}
            </EventDay>
            <EventMonth>
              {formatDate(
                (item as EventFeedItem).event_details?.event_datetime,
                "MMM",
              )}
            </EventMonth>
          </EventDate>
          <EventTitle>{item.title}</EventTitle>
          <Chevron />
        </Card.Content>
      </EventCard>
    )) || []

  return (
    <Section>
      <Title component="h2" variant="h2">
        MIT Stories & Events
      </Title>
      <StrapLine>
        See what's happening in the world of learning with the latest news,
        insights, and upcoming events at MIT.
      </StrapLine>
      <BelowMdOnly>
        <MobileContent>
          <MobileContainer>
            <MobileTypography component="h3" variant="h4">
              Stories
            </MobileTypography>
            <StoriesSlider>
              {stories.map((item) => (
                <Story
                  key={item.id}
                  mobile={true}
                  item={item as NewsFeedItem}
                />
              ))}
            </StoriesSlider>
          </MobileContainer>
          <MobileContainer>
            <MobileTypography component="h3" variant="h4">
              Events
            </MobileTypography>
            <MobileEvents>{EventCards}</MobileEvents>
          </MobileContainer>
        </MobileContent>
      </BelowMdOnly>
      <AboveMdOnly>
        <Container>
          <Content>
            <StoriesContainer>
              <Typography component="h3" variant="h4">
                Stories
              </Typography>
              <Grid container columnSpacing="24px" rowSpacing="28px">
                {stories.map((item, index) => (
                  <Grid item key={item.id} xs={12} sm={12} md={6} lg={4} xl={4}>
                    {index >= 4 ? (
                      <AboveLgOnly>
                        <Story item={item as NewsFeedItem} mobile={false} />
                      </AboveLgOnly>
                    ) : (
                      <Story item={item as NewsFeedItem} mobile={false} />
                    )}
                  </Grid>
                ))}
              </Grid>
            </StoriesContainer>
            <EventsContainer>
              <Typography component="h3" variant="h4">
                Events
              </Typography>
              <Events>{EventCards}</Events>
            </EventsContainer>
          </Content>
        </Container>
      </AboveMdOnly>
    </Section>
  )
}

export default NewsEventsSection
