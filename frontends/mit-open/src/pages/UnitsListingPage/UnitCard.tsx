import React from "react"
import { LearningResourceOfferorDetail, OfferedByEnum } from "api"
import { Card, Skeleton, Typography, styled, theme } from "ol-components"
import { useChannelDetail } from "api/hooks/channels"

const CardStyled = styled(Card)({
  height: "100%",
})

const UnitCardContainer = styled.div({
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  height: "100%",
  backgroundColor: "rgba(243, 244, 248, 0.50)",
  [theme.breakpoints.down("md")]: {
    backgroundColor: theme.custom.colors.white,
  },
})

const UnitCardContent = styled.div({
  display: "flex",
  flexDirection: "column",
  flexGrow: 1,
  width: "100%",
})

const LogoContainer = styled.div({
  padding: "40px 32px",
  backgroundColor: theme.custom.colors.white,
  [theme.breakpoints.down("md")]: {
    padding: "34px 0 14px",
  },
})

const UnitLogo = styled.img({
  height: "50px",
  display: "block",
  [theme.breakpoints.down("md")]: {
    height: "40px",
    margin: "0 auto",
  },
})

const CardBottom = styled.div({
  padding: "24px",
  borderTop: `1px solid ${theme.custom.colors.lightGray2}`,
  display: "flex",
  flexGrow: 1,
  flexDirection: "column",
  gap: "24px",
  [theme.breakpoints.down("md")]: {
    padding: "16px",
    gap: "10px",
    borderTop: "none",
  },
})

const ValuePropContainer = styled.div({
  display: "flex",
  flexDirection: "column",
  alignItems: "flex-start",
  justifyContent: "flex-start",
  flexGrow: 1,
  paddingBottom: "16px",
})

const HeadingText = styled(Typography)(({ theme }) => ({
  alignSelf: "stretch",
  color: theme.custom.colors.darkGray2,
  ...theme.typography.body2,
  [theme.breakpoints.down("md")]: {
    display: "none",
  },
}))

const SubHeadingText = styled(HeadingText)(({ theme }) => ({
  alignSelf: "stretch",
  color: theme.custom.colors.darkGray2,
  ...theme.typography.body2,
  display: "none",
  [theme.breakpoints.down("md")]: {
    display: "block",
  },
}))

const CountsTextContainer = styled.div({
  display: "flex",
  gap: "10px",
  [theme.breakpoints.down("md")]: {
    justifyContent: "flex-end",
  },
})

const CountsText = styled(Typography)(({ theme }) => ({
  color: theme.custom.colors.darkGray2,
  ...theme.typography.body2,
  [theme.breakpoints.down("md")]: {
    ...theme.typography.body3,
    color: theme.custom.colors.silverGrayDark,
  },
}))

const unitLogos = {
  [OfferedByEnum.Mitx]: "/static/images/unit_logos/mitx.svg",
  [OfferedByEnum.Ocw]: "/static/images/unit_logos/ocw.svg",
  [OfferedByEnum.Bootcamps]: "/static/images/unit_logos/bootcamps.svg",
  [OfferedByEnum.Xpro]: "/static/images/unit_logos/xpro.svg",
  [OfferedByEnum.Mitpe]: "/static/images/unit_logos/mitpe.svg",
  [OfferedByEnum.See]: "/static/images/unit_logos/see.svg",
}

interface UnitCardsProps {
  units: LearningResourceOfferorDetail[] | undefined
  courseCounts: Record<string, number>
  programCounts: Record<string, number>
}

interface UnitCardProps {
  unit: LearningResourceOfferorDetail
  logo: string
  courseCount: number
  programCount: number
}

const UnitCard: React.FC<UnitCardProps> = (props) => {
  const { unit, logo, courseCount, programCount } = props
  const channelDetailQuery = useChannelDetail("unit", unit.code)
  const channelDetail = channelDetailQuery.data
  const unitUrl = channelDetail?.channel_url

  return channelDetailQuery.isLoading ? (
    <UnitCardLoading />
  ) : (
    <CardStyled href={unitUrl}>
      <Card.Content>
        <UnitCardContainer>
          <UnitCardContent>
            <LogoContainer>
              <UnitLogo src={logo} alt={unit.name} />
            </LogoContainer>
            <CardBottom>
              <ValuePropContainer>
                <HeadingText>
                  {channelDetail?.configuration?.heading}
                </HeadingText>
                <SubHeadingText>
                  {channelDetail?.configuration?.sub_heading}
                </SubHeadingText>
              </ValuePropContainer>
              <CountsTextContainer>
                <CountsText data-testid={`course-count-${unit.code}`}>
                  {courseCount > 0 ? `Courses: ${courseCount}` : ""}
                </CountsText>
                <CountsText data-testid={`program-count-${unit.code}`}>
                  {programCount > 0 ? `Programs: ${programCount}` : ""}
                </CountsText>
              </CountsTextContainer>
            </CardBottom>
          </UnitCardContent>
        </UnitCardContainer>
      </Card.Content>
    </CardStyled>
  )
}

export const UnitCardLoading = () => {
  return (
    <Card>
      <Card.Content>
        <UnitCardContainer>
          <UnitCardContent>
            <LogoContainer>
              <Skeleton variant="rectangular" width={500} height={50} />
            </LogoContainer>
            <ValuePropContainer>
              <Skeleton variant="text" width={500} height={200} />
            </ValuePropContainer>
          </UnitCardContent>
        </UnitCardContainer>
      </Card.Content>
    </Card>
  )
}

export const UnitCards: React.FC<UnitCardsProps> = (props) => {
  const { units, courseCounts, programCounts } = props
  return (
    <>
      {units?.map((unit) => {
        const courseCount = courseCounts[unit.code] || 0
        const programCount = programCounts[unit.code] || 0
        const logo =
          unitLogos[unit.code as OfferedByEnum] ||
          `/static/images/unit_logos/${unit.code}.svg`
        return unit.value_prop ? (
          <UnitCard
            key={unit.code}
            unit={unit}
            logo={logo}
            courseCount={courseCount}
            programCount={programCount}
          />
        ) : null
      })}
    </>
  )
}
