import React from "react"
import { Container, styled, theme, Typography, ButtonLink } from "ol-components"
import { Link } from "react-router-dom"
import { useLearningResourceTopics } from "api/hooks/learningResources"
import { RiArrowRightLine } from "@remixicon/react"
import RootTopicIcon from "@/components/RootTopicIcon/RootTopicIcon"

const Section = styled.section`
  background:
    url(/static/images/open-bg-texture-with-gradient.svg) no-repeat 100%,
    linear-gradient(270deg, rgba(243, 244, 248, 0) 0%, #f3f4f8 100%),
    linear-gradient(0deg, #ffffff, #ffffff);
  background-size: auto;
  background-position: left top;
  padding: 80px 0;
  ${theme.breakpoints.down("md")} {
    padding: 40px 0;
  }
`

const Title = styled(Typography)`
  text-align: center;
`

const Topics = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 16px 24px;
  margin: 40px 0;
  ${theme.breakpoints.down("md")} {
    gap: 5px;
    margin: 24px 0;
  }
`

const TopicBox = styled(Link)`
  flex: 0 1 calc(100% * (1 / 3) - 16px);
  padding: 28px 30px;
  ${theme.breakpoints.down("md")} {
    flex: 0 1 100%;
    padding: 18px 15px;
  }

  border-radius: 5px;
  border: 1px solid ${theme.custom.colors.lightGray2};
  background: ${theme.custom.colors.white};
  overflow: hidden;

  svg:last-child {
    display: none;
    flex: 0 0 20px;
  }

  :hover {
    color: ${theme.custom.colors.mitRed};
    border-color: ${theme.custom.colors.silverGrayLight};

    svg:last-child {
      color: ${theme.custom.colors.black};
      display: block;
    }
  }
`

const TopicBoxContent = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 10px;

  svg {
    flex: 0 0 22px;
  }

  ${{
    ...theme.typography.subtitle1,
    [theme.breakpoints.down("md")]: theme.typography.subtitle2,
  }}
`

const TopicBoxName = styled.p`
  flex-grow: 1;
  white-space: nowrap;
  text-overflow: ellipsis;
  overflow: hidden;
  margin: 0;
`

const SeeAllButton = styled(ButtonLink)`
  margin: 0 auto;
  box-sizing: content-box;
  display: flex;
  width: 152px;
`

const BrowseTopicsSection: React.FC = () => {
  const { data: topics } = useLearningResourceTopics({ is_toplevel: true })

  return (
    <Section>
      <Container>
        <Title variant="h2">Browse by Topics</Title>
        <Topics>
          {topics?.results.map(({ id, name, channel_url: channelUrl }) => {
            return (
              <TopicBox key={id} to={channelUrl!}>
                <TopicBoxContent>
                  <RootTopicIcon name={name} />
                  <TopicBoxName>{name}</TopicBoxName>
                  <RiArrowRightLine />
                </TopicBoxContent>
              </TopicBox>
            )
          })}
        </Topics>
        <SeeAllButton href="/topics/" edge="circular" size="large">
          See all
        </SeeAllButton>
      </Container>
    </Section>
  )
}

export default BrowseTopicsSection
