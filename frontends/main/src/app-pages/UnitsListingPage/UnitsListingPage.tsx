"use client"

import React from "react"
import { useChannelCounts } from "api/hooks/channels"
import { useOfferorsList } from "api/hooks/learningResources"
import {
  Banner,
  Container,
  Typography,
  styled,
  theme,
  Breadcrumbs,
} from "ol-components"

import { RiBookOpenLine, RiSuitcaseLine } from "@remixicon/react"
import { LearningResourceOfferorDetail } from "api"
import { HOME } from "@/common/urls"
import { UnitCards, UnitCardLoading } from "./UnitCard"
import { ChannelCounts } from "api/v0"

const UNITS_BANNER_IMAGE = "/images/backgrounds/background_steps.jpeg"
const DESKTOP_WIDTH = "1056px"

const aggregateProgramCounts = (
  data: Array<ChannelCounts>,
): Record<string, number> => {
  return Object.fromEntries(
    Object.entries(data).map(([_key, value]) => {
      return [value.name, value.counts.programs]
    }),
  )
}

const aggregateCourseCounts = (
  data: Array<ChannelCounts>,
): Record<string, number> => {
  return Object.fromEntries(
    Object.entries(data).map(([_key, value]) => {
      return [value.name, value.counts.courses]
    }),
  )
}

const sortUnits = (
  units: Array<LearningResourceOfferorDetail> | undefined,
  courseCounts: Record<string, number>,
  programCounts: Record<string, number>,
) => {
  return units?.sort((a, b) => {
    const courseCountA = courseCounts[a.code] || 0
    const programCountA = programCounts[a.code] || 0
    const courseCountB = courseCounts[b.code] || 0
    const programCountB = programCounts[b.code] || 0
    const totalA = courseCountA + programCountA
    const totalB = courseCountB + programCountB
    return totalB - totalA
  })
}

const Page = styled.div(({ theme }) => ({
  backgroundColor: theme.custom.colors.lightGray1,
}))

const PageContent = styled.div(({ theme }) => ({
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  padding: "40px 10px 80px 10px",
  gap: "48px",
  [theme.breakpoints.down("md")]: {
    padding: "40px 0px 30px 0px",
    gap: "40px",
  },
}))

const PageHeaderContainer = styled.div(({ theme }) => ({
  display: "flex",
  flexDirection: "column",
  alignItems: "flex-start",
  gap: "24px",
  maxWidth: DESKTOP_WIDTH,
  width: "100%",
  [theme.breakpoints.down("md")]: {
    width: "auto",
  },
}))

const PageHeaderContainerInner = styled.div({
  display: "flex",
  flexDirection: "column",
  maxWidth: "1000px",
  border: `1px solid ${theme.custom.colors.lightGray2}`,
  backgroundColor: theme.custom.colors.white,
  borderRadius: "8px",
  padding: "32px",
  [theme.breakpoints.down("md")]: {
    backgroundColor: "transparent",
    border: "none",
    padding: "0",
  },
})

const PageHeaderText = styled(Typography)(({ theme }) => ({
  color: theme.custom.colors.black,
  ...theme.typography.subtitle1,
}))

const UnitContainer = styled.section(({ theme }) => ({
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  maxWidth: DESKTOP_WIDTH,
  gap: "32px",
  ".MitCard-root": {
    height: "auto",
  },
  [theme.breakpoints.down("md")]: {
    width: "auto",
    padding: "0 16px",
  },
}))

const UnitTitleContainer = styled.div({
  display: "flex",
  justifyContent: "flex-start",
  alignItems: "center",
  gap: "8px",
  paddingBottom: "16px",
})

const UnitTitle = styled.h2(({ theme }) => ({
  margin: 0,
  color: theme.custom.colors.darkGray2,
  ...theme.typography.h4,
}))

const UnitDescriptionContainer = styled.div({
  display: "flex",
  flexDirection: "column",
  alignItems: "flex-start",
  paddingBottom: "8px",
})

const UnitDescription = styled(Typography)(({ theme }) => ({
  color: theme.custom.colors.darkGray2,
  ...theme.typography.body2,
}))

const AcademicIcon = styled(RiBookOpenLine)({
  width: "32px",
  height: "32px",
})

const ProfessionalIcon = styled(RiSuitcaseLine)({
  width: "32px",
  height: "32px",
})

const GridContainer = styled.div(({ theme }) => ({
  display: "grid",
  gap: "25px",
  gridTemplateColumns: "repeat(2, 1fr)",
  width: "100%",
  [theme.breakpoints.down("md")]: {
    gridTemplateColumns: "1fr",
  },
}))

interface UnitSectionProps {
  id: string
  icon: React.ReactNode
  title: string
  description: string
  units: LearningResourceOfferorDetail[] | undefined
  courseCounts: Record<string, number>
  programCounts: Record<string, number>
  isLoading?: boolean
}

const UnitSection: React.FC<UnitSectionProps> = (props) => {
  const {
    id,
    icon,
    title,
    description,
    units,
    courseCounts,
    programCounts,
    isLoading,
  } = props
  return (
    <UnitContainer data-testid={`UnitSection-${id}`}>
      <div>
        <UnitTitleContainer>
          {icon}
          <UnitTitle>{title}</UnitTitle>
        </UnitTitleContainer>
        <UnitDescriptionContainer>
          <UnitDescription>{description}</UnitDescription>
        </UnitDescriptionContainer>
      </div>
      <GridContainer>
        {isLoading ? (
          Array(4)
            .fill(null)
            .map((_null, i) => <UnitCardLoading key={`irrelevant-${i}`} />)
        ) : (
          <UnitCards
            units={units}
            courseCounts={courseCounts}
            programCounts={programCounts}
          />
        )}
      </GridContainer>
    </UnitContainer>
  )
}

const UnitsListingPage: React.FC = () => {
  const unitsQuery = useOfferorsList()
  const units = unitsQuery.data?.results
  const channelCountQuery = useChannelCounts("unit")

  const courseCounts = channelCountQuery.data
    ? aggregateCourseCounts(channelCountQuery.data)
    : {}
  const programCounts = channelCountQuery.data
    ? aggregateProgramCounts(channelCountQuery.data)
    : {}

  const academicUnits = sortUnits(
    units?.filter((unit) => unit.professional === false),
    courseCounts,
    programCounts,
  )
  const professionalUnits = sortUnits(
    units?.filter((unit) => unit.professional === true),
    courseCounts,
    programCounts,
  )

  const unitData = [
    {
      id: "academic",
      icon: <AcademicIcon />,
      title: "Academic Units",
      description:
        "MIT's Academic courses, programs, and materials mirror MIT curriculum and residential programs, making these available to a global audience. Approved by faculty committees, Academic content furnishes a comprehensive foundation of knowledge, skills, and abilities for students pursuing their academic objectives. Renowned for their rigor and challenge, MIT's Academic offerings deliver an experience on par with the campus environment.",
      units: academicUnits,
    },
    {
      id: "professional",
      icon: <ProfessionalIcon />,
      title: "Professional Units",
      description:
        "MIT's Professional courses and programs are tailored for working professionals seeking essential practical skills across various industries. Led by MIT faculty and maintaining challenging standards, Professional courses and programs prioritize real-world applications, emphasize practical skills and are directly relevant to today's workforce.",
      units: professionalUnits,
    },
  ]

  return (
    <Page>
      <Banner
        navText={
          <Breadcrumbs
            variant="dark"
            ancestors={[{ href: HOME, label: "Home" }]}
            current="MIT Units"
          />
        }
        header="Academic & Professional Learning"
        subheader="Non-degree learning resources tailored to the needs of students and working professionals."
        backgroundUrl={UNITS_BANNER_IMAGE}
      />
      <Container>
        <PageContent>
          <PageHeaderContainer>
            <PageHeaderContainerInner>
              <PageHeaderText>
                MIT is dedicated to advancing knowledge beyond students enrolled
                in MIT's campus programs. Several units within MIT offer
                educational opportunities accessible to learners worldwide,
                catering to a diverse range of needs. There are two types of
                non-degree learning content: Academic and Professional. Each
                unit and offering is tagged by content type to help learners
                choose courses and programs aligned with their learning goals.
              </PageHeaderText>
            </PageHeaderContainerInner>
          </PageHeaderContainer>
          {unitData.map((unit) => (
            <UnitSection
              key={unit.id}
              id={unit.id}
              icon={unit.icon}
              title={unit.title}
              description={unit.description}
              units={unit.units}
              courseCounts={courseCounts}
              programCounts={programCounts}
              isLoading={unitsQuery.isLoading}
            />
          ))}
        </PageContent>
      </Container>
    </Page>
  )
}

export default UnitsListingPage
