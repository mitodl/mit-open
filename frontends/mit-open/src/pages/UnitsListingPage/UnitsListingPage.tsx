import {
  useLearningResourcesSearch,
  useOfferorsList,
} from "api/hooks/learningResources"
import {
  Banner,
  Card,
  Container,
  Skeleton,
  Typography,
  styled,
  Breadcrumbs,
} from "ol-components"
import { RiBookOpenLine, RiSuitcaseLine } from "@remixicon/react"
import React from "react"
import {
  LearningResourceOfferorDetail,
  LearningResourcesSearchResponse,
  OfferedByEnum,
} from "api"
import { MetaTags } from "ol-utilities"
import { useChannelDetail } from "api/hooks/channels"
import { HOME } from "@/common/urls"

const UNITS_BANNER_IMAGE = "/static/images/background_steps.jpeg"
const DESKTOP_WIDTH = "1056px"

const aggregateByUnits = (
  data: LearningResourcesSearchResponse,
): Record<string, number> => {
  const buckets = data.metadata.aggregations["offered_by"] ?? []
  return Object.fromEntries(
    buckets.map((bucket) => {
      return [bucket.key, bucket.doc_count]
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
  gap: "80px",
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
})

const PageHeaderText = styled(Typography)(({ theme }) => ({
  color: theme.custom.colors.black,
  ...theme.typography.subtitle1,
}))

const CardStyled = styled(Card)({
  height: "100%",
})

const UnitContainer = styled.div(({ theme }) => ({
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  maxWidth: DESKTOP_WIDTH,
  gap: "32px",
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

const UnitTitle = styled(Typography)(({ theme }) => ({
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
  [theme.breakpoints.down("md")]: {
    gridTemplateColumns: "1fr",
  },
}))

const UnitCardContainer = styled.div({
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  padding: "16px",
  height: "100%",
})

const UnitCardContent = styled.div({
  display: "flex",
  flexDirection: "column",
  flexGrow: 1,
})

const LogoContainer = styled.div({
  display: "flex",
  justifyContent: "center",
  alignItems: "center",
  height: "128px",
})

const UnitLogo = styled.img({
  display: "flex",
  flexDirection: "column",
  justifyContent: "center",
  alignItems: "center",
  height: "50px",
  maxWidth: "100%",
})

const ValuePropContainer = styled.div({
  display: "flex",
  flexDirection: "column",
  alignItems: "flex-start",
  justifyContent: "flex-start",
  flexGrow: 1,
  paddingBottom: "16px",
})

const ValuePropText = styled(Typography)(({ theme }) => ({
  alignSelf: "stretch",
  color: theme.custom.colors.darkGray2,
  ...theme.typography.body2,
}))

const CountsTextContainer = styled.div({
  display: "flex",
  justifyContent: "flex-end",
  gap: "10px",
})

const CountsText = styled(Typography)(({ theme }) => ({
  textAlign: "center",
  color: theme.custom.colors.silverGrayDark,
  ...theme.typography.body3,
}))

const unitLogos = {
  [OfferedByEnum.Mitx]: "/static/images/unit_logos/mitx.svg",
  [OfferedByEnum.Ocw]: "/static/images/unit_logos/ocw.svg",
  [OfferedByEnum.Bootcamps]: "/static/images/unit_logos/bootcamps.svg",
  [OfferedByEnum.Xpro]: "/static/images/unit_logos/xpro.svg",
  [OfferedByEnum.Mitpe]: "/static/images/unit_logos/mitpe.svg",
  [OfferedByEnum.See]: "/static/images/unit_logos/see.svg",
}

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

interface UnitCardsProps {
  units: LearningResourceOfferorDetail[] | undefined
  courseCounts: Record<string, number>
  programCounts: Record<string, number>
}

const UnitCards: React.FC<UnitCardsProps> = (props) => {
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
            <ValuePropContainer>
              <ValuePropText>{unit.value_prop}</ValuePropText>
            </ValuePropContainer>
            <CountsTextContainer>
              <CountsText data-testid={`course-count-${unit.code}`}>
                {courseCount > 0 ? `Courses: ${courseCount}` : ""}
              </CountsText>
              <CountsText data-testid={`program-count-${unit.code}`}>
                {programCount > 0 ? `Programs: ${programCount}` : ""}
              </CountsText>
            </CountsTextContainer>
          </UnitCardContent>
        </UnitCardContainer>
      </Card.Content>
    </CardStyled>
  )
}

const UnitCardLoading = () => {
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

const UnitsListingPage: React.FC = () => {
  const unitsQuery = useOfferorsList()
  const units = unitsQuery.data?.results
  const courseQuery = useLearningResourcesSearch({
    resource_type: ["course"],
    aggregations: ["offered_by"],
  })
  const programQuery = useLearningResourcesSearch({
    resource_type: ["program"],
    aggregations: ["offered_by"],
  })
  const courseCounts = courseQuery.data
    ? aggregateByUnits(courseQuery.data)
    : {}
  const programCounts = programQuery.data
    ? aggregateByUnits(programQuery.data)
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
        "MIT's Academic courses, programs and materials mirror MIT curriculum and residential programs, making these available to a global audience. Approved by faculty committees, academic content furnishes a comprehensive foundation of knowledge, skills, and abilities for students pursuing their academic objectives. Renowned for their rigor and challenge, MIT's academic offerings deliver an experience on par with the campus environment.",
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
      <MetaTags title="Units" />
      <Banner
        navText={
          <Breadcrumbs
            variant="dark"
            ancestors={[{ href: HOME, label: "Home" }]}
            current="MIT Units"
          />
        }
        title="Academic & Professional Learning"
        description="Extending MIT's knowledge to the world"
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
                catering to a diverse range of needs.
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
