import {
  useLearningResourcesSearch,
  useOfferorsList,
} from "api/hooks/learningResources"
import {
  Banner,
  Box,
  Card,
  CardContent,
  Container,
  Typography,
  styled,
} from "ol-components"
import { RiBookOpenLine, RiSuitcaseLine } from "@remixicon/react"
import React from "react"
import {
  LearningResourceOfferorDetail,
  LearningResourceSearchResponse,
  OfferedByEnum,
} from "api"

const OFFERORS_BANNER_IMAGE = "/static/images/background_steps.jpeg"

const aggregateByOfferors = (
  data: LearningResourceSearchResponse,
): Record<string, number> => {
  const buckets = data.metadata.aggregations["offered_by"] ?? []
  return Object.fromEntries(
    buckets.map((bucket) => {
      return [bucket.key, bucket.doc_count]
    }),
  )
}

const sortOfferors = (
  offerors: Array<LearningResourceOfferorDetail> | undefined,
  courseCounts: Record<string, number>,
  programCounts: Record<string, number>,
) => {
  return offerors?.sort((a, b) => {
    const courseCountA = courseCounts[a.code] || 0
    const programCountA = programCounts[a.code] || 0
    const courseCountB = courseCounts[b.code] || 0
    const programCountB = programCounts[b.code] || 0
    const totalA = courseCountA + programCountA
    const totalB = courseCountB + programCountB
    return totalB - totalA
  })
}

const Page = styled.div({
  paddingBottom: "80px",
})

const PageContent = styled.div({
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  padding: "40px 10px 0px 10px",
  gap: "80px",
})

const PageHeaderContainer = styled.div({
  display: "flex",
  flexDirection: "column",
  alignItems: "flex-start",
  gap: "24px",
  width: "1056px",
})

const PageHeaderText = styled(Typography)(({ theme }) => ({
  color: theme.custom.colors.black,
  maxWidth: "1000px",
  ...theme.typography.subtitle1,
}))

const UnitContainer = styled.div({
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  width: "1056px",
  gap: "32px",
})

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

const GridContainer = styled(Box)({
  display: "grid",
  gap: "25px",
  gridTemplateColumns: "repeat(2, 1fr)",
})

const OfferorCard = styled(Card)({
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
})

const OfferorCardContent = styled(CardContent)({
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

const OfferorLogo = styled.img({
  display: "flex",
  flexDirection: "column",
  justifyContent: "center",
  alignItems: "center",
  height: "50px",
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

const offerorLogos = {
  [OfferedByEnum.Mitx]: "/static/images/offeror_logos/mitx.svg",
  [OfferedByEnum.Ocw]: "/static/images/offeror_logos/ocw.svg",
  [OfferedByEnum.Bootcamps]: "/static/images/offeror_logos/bootcamps.svg",
  [OfferedByEnum.Xpro]: "/static/images/offeror_logos/xpro.svg",
  [OfferedByEnum.Mitpe]: "/static/images/offeror_logos/mitpe.svg",
  [OfferedByEnum.See]: "/static/images/offeror_logos/see.svg",
}

interface UnitSectionProps {
  icon: React.ReactNode
  title: string
  description: string
  offerors: LearningResourceOfferorDetail[] | undefined
  courseCounts: Record<string, number>
  programCounts: Record<string, number>
}

const UnitSection: React.FC<UnitSectionProps> = (props) => {
  const { icon, title, description, offerors, courseCounts, programCounts } =
    props
  return (
    <UnitContainer>
      <Box>
        <UnitTitleContainer>
          {icon}
          <UnitTitle>{title}</UnitTitle>
        </UnitTitleContainer>
        <UnitDescriptionContainer>
          <UnitDescription>{description}</UnitDescription>
        </UnitDescriptionContainer>
      </Box>
      <GridContainer>
        <OfferorCards
          offerors={offerors}
          courseCounts={courseCounts}
          programCounts={programCounts}
        />
      </GridContainer>
    </UnitContainer>
  )
}

interface OfferorCardsProps {
  offerors: LearningResourceOfferorDetail[] | undefined
  courseCounts: Record<string, number>
  programCounts: Record<string, number>
}

const OfferorCards: React.FC<OfferorCardsProps> = (props) => {
  const { offerors, courseCounts, programCounts } = props
  return (
    <>
      {offerors?.map((offeror) => {
        const courseCount = courseCounts[offeror.code] || 0
        const programCount = programCounts[offeror.code] || 0
        const logo = offerorLogos[offeror.code as OfferedByEnum]
        return offeror.value_prop ? (
          <OfferorCard>
            <OfferorCardContent>
              <LogoContainer>
                <OfferorLogo src={logo} alt={offeror.name} />
              </LogoContainer>
              <ValuePropContainer>
                <ValuePropText>{offeror.value_prop}</ValuePropText>
              </ValuePropContainer>
              <CountsTextContainer>
                <CountsText>
                  {courseCount > 0 ? `Courses: ${courseCount}` : ""}
                </CountsText>
                <CountsText>
                  {programCount > 0 ? `Programs: ${programCount}` : ""}
                </CountsText>
              </CountsTextContainer>
            </OfferorCardContent>
          </OfferorCard>
        ) : null
      })}
    </>
  )
}

const OfferorsPage: React.FC = () => {
  const offerorsQuery = useOfferorsList()
  const offerors = offerorsQuery.data?.results
  const courseQuery = useLearningResourcesSearch({
    resource_type: ["course"],
    aggregations: ["offered_by"],
  })
  const programQuery = useLearningResourcesSearch({
    resource_type: ["program"],
    aggregations: ["offered_by"],
  })
  const courseCounts = courseQuery.data
    ? aggregateByOfferors(courseQuery.data)
    : {}
  const programCounts = programQuery.data
    ? aggregateByOfferors(programQuery.data)
    : {}
  const academicOfferors = sortOfferors(
    offerors?.filter((offeror) => offeror.professional === false),
    courseCounts,
    programCounts,
  )
  const professionalOfferors = sortOfferors(
    offerors?.filter((offeror) => offeror.professional === true),
    courseCounts,
    programCounts,
  )

  const units = [
    {
      key: "academic",
      icon: <AcademicIcon />,
      title: "Academic Offerors",
      description:
        "MIT's Academic courses, programs and materials mirror MIT curriculum and residential programs, making these available to a global audience. Approved by faculty committees, academic content furnishes a comprehensive foundation of knowledge, skills, and abilities for students pursuing their academic objectives. Renowned for their rigor and challenge, MIT's academic offerings deliver an experience on par with the campus environment.",
      offerors: academicOfferors,
    },
    {
      key: "professional",
      icon: <ProfessionalIcon />,
      title: "Professional Offerors",
      description:
        "MIT's Professional courses and programs are tailored for working professionals seeking essential practical skills across various industries. Led by MIT faculty and maintaining challenging standards, Professional courses and programs prioritize real-world applications, emphasize practical skills and are directly relevant to today's workforce.",
      offerors: professionalOfferors,
    },
  ]

  return (
    <Page>
      <Banner
        navText="Home / MIT Units"
        title="Academic & Professional Learning"
        description="Extending MIT's knowledge to the world"
        backgroundUrl={OFFERORS_BANNER_IMAGE}
      />
      <Container>
        <PageContent>
          <PageHeaderContainer>
            <PageHeaderText>
              MIT is dedicated to advancing knowledge beyond students enrolled
              in MIT's campus programs. Several divisions within MIT offer
              educational opportunities accessible to learners worldwide,
              catering to a diverse range of needs.
            </PageHeaderText>
          </PageHeaderContainer>
          {units.map((unit) => (
            <UnitSection
              key={unit.key}
              icon={unit.icon}
              title={unit.title}
              description={unit.description}
              offerors={unit.offerors}
              courseCounts={courseCounts}
              programCounts={programCounts}
            />
          ))}
        </PageContent>
      </Container>
    </Page>
  )
}

export default OfferorsPage
