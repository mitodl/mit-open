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
    linear-gradient(270deg, rgba(243 244 248 / 0%) 0%, rgb(243 244 248) 100%),
    url("/static/images/open-bg-texture-wgradient.jpg") lightgray 50% / cover
      no-repeat;
  background-position: center right;
  padding: 80px 0;
  ${({ theme }) => theme.breakpoints.down("md")} {
    padding: 40px 0;
  }
`

const Title = styled(Typography)`
  ${({ theme }) => theme.breakpoints.down("md")} {
    text-align: center;
  }
`

const Topics = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 16px 24px;
  margin: 40px 0;
  ${({ theme }) => theme.breakpoints.down("md")} {
    gap: 5px;
    margin: 24px 0;
  }
`

const TopicBox = styled(Link)`
  flex: 0 1 calc(100% * (1 / 3) - 16px);
  padding: 28px 30px;
  ${({ theme }) => theme.breakpoints.down("md")} {
    flex: 0 1 100%;
    padding: 18px 15px;
  }

  border-radius: 5px;
  border: 1px solid ${theme.custom.colors.lightGray2};
  background: ${theme.custom.colors.white};
  overflow: hidden;
`

const TopicBoxContent = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;

  svg {
    flex: 0 0 20px;
  }

  font-weight: 500;
  font-size: ${theme.typography.pxToRem(16)};
  ${({ theme }) => theme.breakpoints.down("md")} {
    font-size: ${theme.typography.pxToRem(14)};
  }
`

const TopicBoxName = styled.p`
  white-space: nowrap;
  text-overflow: ellipsis;
  overflow: hidden;
  margin: 0;
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
        <Title variant="h2">Browse by Topics</Title>
        <Topics>
          {topics?.results.map(
            ({ id, name, channel_url: channelUrl }, index) => {
              const Icon = ICONS[index % ICONS.length]
              return (
                <TopicBox key={id} to={channelUrl!}>
                  <TopicBoxContent>
                    <Icon />
                    <TopicBoxName>{name}</TopicBoxName>
                  </TopicBoxContent>
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
