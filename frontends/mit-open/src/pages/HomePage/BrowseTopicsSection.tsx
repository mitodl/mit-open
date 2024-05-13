import React from "react"
import { Container, styled, theme, Button, Typography } from "ol-components"
import { Link } from "react-router-dom"
import { useTopicsList } from "api/hooks/topics"
import {
  RiPaletteLine,
  RiSeedlingLine,
  RiBriefcaseLine,
  RiMacbookLine,
  RiBarChartBoxLine,
  RiUserSearchLine,
  RiArrowRightSLine,
} from "@remixicon/react"

const ICONS = [
  RiPaletteLine,
  RiSeedlingLine,
  RiBriefcaseLine,
  RiMacbookLine,
  RiBarChartBoxLine,
  RiUserSearchLine,
  RiArrowRightSLine,
]

const Section = styled.section`
  background:
    linear-gradient(270deg, rgba(243, 244, 248, 0) 0%, #f3f4f8 100%),
    url("/static/images/open-bg-texture-wgradient.jpg") lightgray 50% / cover
      no-repeat;
  background-position: center;
  padding: 80px 0px;
`

const Topics = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 16px 24px;
  margin: 40px 0;
`

const TopicBox = styled(Link)`
  flex: 0 1 calc(100% * (1 / 3) - 16px);
  padding: 28px 30px;
  border-radius: 5px;
  border: 1px solid var(--Light-Gray-2, ${theme.custom.colors.lightGray2});
  background: var(--white-mit-brand, ${theme.custom.colors.white});
`

const TopicBoxHeading = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
  align-self: stretch;
`

const SeeAllButton = styled(Button)`
  margin: 0 auto;
  width: 152px;
  box-sizing: content-box;
`

const BrowseTopicsSection: React.FC = () => {
  const { data: topics } = useTopicsList({ is_toplevel: true })

  return (
    <Section>
      <Container>
        <Typography variant="h2">Browse by Topics</Typography>
        <Topics>
          {topics?.results.map(
            ({ id, name, channel_url: channelUrl }, index) => {
              const Icon = ICONS[index % ICONS.length]
              return (
                <TopicBox key={id} to={channelUrl!}>
                  <TopicBoxHeading>
                    <Icon />
                    {name}
                  </TopicBoxHeading>
                </TopicBox>
              )
            },
          )}
        </Topics>
        <SeeAllButton edge="rounded">See all</SeeAllButton>
      </Container>
    </Section>
  )
}

export default BrowseTopicsSection
