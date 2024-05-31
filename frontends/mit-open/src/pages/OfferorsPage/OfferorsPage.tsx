import {
  useLearningResourcesSearch,
  useOfferorsList,
} from "api/hooks/learningResources"
import {
  Banner,
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

const Page = styled.div({})

const PageContent = styled.div({
  display: "flex",
  flexDirection: "column",
  padding: "40px 10px 0px 10px",
  gap: "80px",
})

const PageHeaderContainer = styled.div({
  display: "flex",
  flexDirection: "column",
  alignItems: "flex-start",
  gap: "24px",
  width: "1272px",
})

const PageHeaderText = styled(Typography)(({ theme }) => ({
  color: theme.custom.colors.black,
  maxWidth: "1000px",
  ...theme.typography.subtitle1,
}))

const OfferorSection = styled.div({
  display: "flex",
  width: "1056px",
  flexDirection: "column",
  alignItems: "center",
  gap: "32px",
})

const OfferorContent = styled.div({
  display: "flex",
  flexDirection: "column",
  alignItems: "flex-start",
  alignSelf: "stretch",
  gap: "32px",
})

const SectionTitleContainer = styled.div({
  display: "flex",
  justifyContent: "center",
  alignItems: "center",
  gap: "8px",
})

const SectionTitle = styled(Typography)(({ theme }) => ({
  color: theme.custom.colors.darkGray2,
  ...theme.typography.h4,
}))

const AcademicIcon = styled(RiBookOpenLine)({
  width: "32px",
  height: "32px",
})

const ProfessionalIcon = styled(RiSuitcaseLine)({
  width: "32px",
  height: "32px",
})

const CardContainer = styled.div({
  display: "flex",
  alignItems: "flex-start",
  alignContent: "flex-start",
  alignSelf: "stretch",
  flexWrap: "wrap",
  gap: "24px",
})

const OfferorCard = styled(Card)({
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  width: "516px",
})

const LogoContainer = styled.div({
  display: "flex",
  justifyContent: "center",
  alignItems: "center",
  alignSelf: "stretch",
  height: "128px",
})

const OfferorLogo = styled.img({
  display: "flex",
  flexDirection: "column",
  justifyContent: "center",
  alignItems: "center",
  height: "50px",
})

const offerorLogos = {
  [OfferedByEnum.Mitx]: "/static/images/offeror_logos/mitx.svg",
  [OfferedByEnum.Ocw]: "/static/images/offeror_logos/ocw.svg",
  [OfferedByEnum.Bootcamps]: "/static/images/offeror_logos/bootcamps.svg",
  [OfferedByEnum.Xpro]: "/static/images/offeror_logos/xpro.svg",
  [OfferedByEnum.Mitpe]: "/static/images/offeror_logos/mitpe.svg",
  [OfferedByEnum.See]: "/static/images/offeror_logos/see.svg",
}

interface OfferorCardsProps {
  offerors: LearningResourceOfferorDetail[] | undefined
  courseCounts: Record<string, number>
  programCounts: Record<string, number>
}

const OfferorCards: React.FC<OfferorCardsProps> = (props) => {
  const { offerors, courseCounts, programCounts } = props
  return (
    <CardContainer>
      {offerors?.map((offeror) => {
        const courseCount = courseCounts[offeror.code] || 0
        const programCount = programCounts[offeror.code] || 0
        const logo = offerorLogos[offeror.code as OfferedByEnum]
        return offeror.value_prop ? (
          <OfferorCard>
            <CardContent>
              <LogoContainer>
                <OfferorLogo src={logo} alt={offeror.name} />
              </LogoContainer>
              <Typography>{offeror.value_prop}</Typography>
              <Typography>
                {courseCount > 0 ? `Courses: ${courseCount}` : ""}{" "}
                {programCount > 0 ? `Programs: ${programCount}` : ""}
              </Typography>
            </CardContent>
          </OfferorCard>
        ) : null
      })}
    </CardContainer>
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
          <OfferorSection>
            <OfferorContent>
              <SectionTitleContainer>
                <AcademicIcon />
                <SectionTitle>Academic Offerors</SectionTitle>
              </SectionTitleContainer>
              <OfferorCards
                offerors={academicOfferors}
                courseCounts={courseCounts}
                programCounts={programCounts}
              />
            </OfferorContent>
          </OfferorSection>
          <OfferorSection>
            <OfferorContent>
              <SectionTitleContainer>
                <ProfessionalIcon />
                <SectionTitle>Professional Offerors</SectionTitle>
              </SectionTitleContainer>
              <OfferorCards
                offerors={professionalOfferors}
                courseCounts={courseCounts}
                programCounts={programCounts}
              />
            </OfferorContent>
          </OfferorSection>
        </PageContent>
      </Container>
    </Page>
  )
}

export default OfferorsPage
