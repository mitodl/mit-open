import React from "react"
import {
  Container,
  styled,
  theme,
  Typography,
  Grid,
  useMuiBreakpointAtLeast,
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
    margin: 0 16px 24px 16px;
  }
`

const EventsContainer = styled.section`
  display: flex;
  width: 408px;
  flex-direction: column;
  align-items: flex-start;
  gap: 12px;
  align-self: stretch;
`

const Card = styled.a`
  border-radius: 8px;
  border: 1px solid ${theme.custom.colors.lightGray2};
  background: ${theme.custom.colors.white};
  box-shadow:
    0 2px 4px 0 rgb(37 38 43 / 10%),
    0 2px 4px 0 rgb(37 38 43 / 10%);

  :hover {
    text-decoration: none;
    color: ${theme.custom.colors.mitRed};
    border-color: ${theme.custom.colors.silverGrayLight};

    > p {
      color: ${theme.custom.colors.mitRed};
      text-decoration: underline;
    }
  }
`

const StoryCard = styled(Card)<{ mobile: boolean }>`
  display: flex;
  flex-direction: column;
  flex-shrink: 0;
  overflow: hidden;
  ${({ mobile }) => (mobile ? "width: 274px" : "")}
`

const StoriesSlider = styled.div`
  display: flex;
  align-items: flex-start;
  gap: 16px;
  overflow-x: scroll;
  padding: 0 16px 24px 16px;
`

const StoryImage = styled.img`
  display: block;
  background-size: cover;
  background-repeat: no-repeat;
  -webkit-background-position: center;
  background-position: center;
  width: 100%;
  object-fit: cover;
  height: 171px;
  border-radius:;
`

const StoryTitle = styled.p`
  ${{ ...theme.typography.subtitle1 }}
  text-overflow: ellipsis;
  height: ${theme.typography.pxToRem(40)};
  overflow: hidden;
  margin: 16px;

  @supports (-webkit-line-clamp: 2) {
    white-space: initial;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
  }
`

const StoryPublished = styled.span`
  ${{
    ...theme.typography.body3,
    color: theme.custom.colors.silverGrayDark,
  }}

  margin: 0 16px 16px;
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
`

const EventCard = styled(Card)`
  display: flex;
  align-items: center;
  gap: 16px;
  flex: 1 0 0;
  align-self: stretch;
  padding: 16px;
  justify-content: space-between;
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
  height: ${theme.typography.pxToRem(59)};
  align-self: stretch;
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

const Story: React.FC<{ item: NewsFeedItem; mobile: boolean }> = ({
  item,
  mobile,
}) => {
  return (
    <StoryCard mobile={mobile} href={item.url}>
      <StoryImage src={item.image?.url} alt={item.image?.alt} />
      <StoryTitle>{item.title}</StoryTitle>
      <StoryPublished>
        Published: {formatDate(item.news_details?.publish_date)}
      </StoryPublished>
    </StoryCard>
  )
}

const NewsEventsSection: React.FC = () => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: news }: any = useNewsEventsList({
    feed_type: [NewsEventsListFeedTypeEnum.News],
    limit: 6,
  })

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: events }: any = useNewsEventsList({
    feed_type: [NewsEventsListFeedTypeEnum.Events],
    limit: 5,
  })

  const isAboveLg = useMuiBreakpointAtLeast("lg")
  const isMobile = !useMuiBreakpointAtLeast("md")

  if (!news || !events) {
    return null
  }

  const stories = news!.results?.slice(0, isAboveLg || isMobile ? 6 : 4) || []

  const EventCards =
    events!.results?.map((item: EventFeedItem) => (
      <EventCard key={item.id} href={item.url}>
        <EventDate>
          <EventDay>
            {formatDate(item.event_details?.event_datetime, "D")}
          </EventDay>
          <EventMonth>
            {formatDate(item.event_details?.event_datetime, "MMM")}
          </EventMonth>
        </EventDate>
        <EventTitle>{item.title}</EventTitle>
        <Chevron />
      </EventCard>
    )) || []

  return (
    <Section>
      <Title variant="h2">Experience MIT</Title>
      <StrapLine>See what's happening in the world of learning.</StrapLine>
      {isMobile ? (
        <MobileContent>
          <MobileContainer>
            <Typography variant="h4">Stories</Typography>
            <StoriesSlider>
              {stories.map((item: NewsFeedItem) => (
                <Story key={item.id} mobile={isMobile} item={item} />
              ))}
            </StoriesSlider>
          </MobileContainer>
          <MobileContainer>
            <Typography variant="h4">Events</Typography>
            <MobileEvents>{EventCards}</MobileEvents>
          </MobileContainer>
        </MobileContent>
      ) : (
        <Container>
          <Content>
            <StoriesContainer>
              <Typography variant="h4">Stories</Typography>
              <Grid container columnSpacing="24px" rowSpacing="29px">
                {stories.map((item: NewsFeedItem) => (
                  <Grid item key={item.id} xs={12} sm={12} md={6} lg={4} xl={4}>
                    <Story item={item} mobile={false} />
                  </Grid>
                ))}
              </Grid>
            </StoriesContainer>
            <EventsContainer>
              <Typography variant="h4">Events</Typography>
              <Events>{EventCards}</Events>
            </EventsContainer>
          </Content>
        </Container>
      )}
    </Section>
  )
}

export default NewsEventsSection
