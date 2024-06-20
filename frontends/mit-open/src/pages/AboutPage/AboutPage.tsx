import { Breadcrumbs, Container, Typography, styled } from "ol-components"
import { MetaTags } from "ol-utilities"
import * as urls from "@/common/urls"
import React from "react"

const NON_DEGREE_LEARNING_FRAGMENT_IDENTIFIER = "non-degree-learning"

const PageContainer = styled.div(({ theme }) => ({
  display: "flex",
  flexDirection: "column",
  alignItems: "flex-start",
  alignSelf: "stretch",
  padding: "40px 84px 80px 84px",
  [theme.breakpoints.down("md")]: {
    padding: "40px 24px 80px 24px",
  },
}))

const BannerContainer = styled.div({
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  paddingBottom: "16px",
})

const BannerContainerInner = styled.div({
  display: "flex",
  flexDirection: "column",
  alignItems: "flex-start",
  alignSelf: "stretch",
  justifyContent: "center",
})

const Header = styled(Typography)(({ theme }) => ({
  alignSelf: "stretch",
  color: theme.custom.colors.black,
}))

const BodyContainer = styled.div({
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  alignSelf: "stretch",
  gap: "40px",
})

const MissionStatementContainer = styled.div(({ theme }) => ({
  display: "flex",
  padding: "24px 32px",
  flexDirection: "column",
  justifyContent: "center",
  alignItems: "flex-start",
  gap: "16px",
  alignSelf: "stretch",
  backgroundColor: theme.custom.colors.white,
}))

const MissionStatementHeader = styled(Typography)(({ theme }) => ({
  color: theme.custom.colors.mitRed,
  ...theme.typography.h5,
}))

const SubHeaderContainer = styled.div(({ theme }) => ({
  display: "flex",
  alignItems: "center",
  alignSelf: "stretch",
  gap: "30px",
  [theme.breakpoints.down("md")]: {
    flexDirection: "column-reverse",
    gap: "16px",
  },
}))

const SubHeaderTextContainer = styled.div({
  display: "flex",
  flexDirection: "column",
  flex: "1 0 0",
  alignSelf: "flex-start",
})

const SubHeaderImage = styled.img(({ theme }) => ({
  flexGrow: 1,
  alignSelf: "stretch",
  borderRadius: "8px",
  backgroundSize: "cover",
  backgroundPosition: "center",
  backgroundImage: "url('/static/images/mit-dome-2.jpg')",
  [theme.breakpoints.down("md")]: {
    height: "300px",
  },
}))

const BodySection = styled.div({
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  alignSelf: "stretch",
  gap: "16px",
})

const BodyText = styled(Typography)(({ theme }) => ({
  alignSelf: "stretch",
  color: theme.custom.colors.black,
}))

const AboutPage: React.FC = () => {
  return (
    <Container>
      <PageContainer>
        <MetaTags title="About Us" />
        <BannerContainer>
          <BannerContainerInner>
            <Breadcrumbs
              variant="light"
              ancestors={[{ href: urls.HOME, label: "Home" }]}
              current="About Us"
            />
            <Header variant="h3">About Us</Header>
          </BannerContainerInner>
        </BannerContainer>
        <BodyContainer>
          <MissionStatementContainer>
            <MissionStatementHeader>Mission</MissionStatementHeader>
            <BodyText variant="body1">
              MIT's mission to share learning with the world has been central to
              the Institute since its founding in 1861. At the start of the 21st
              century, MIT took that mission online, bringing learning resources
              to a broader audience through digital platforms. Today, MIT is
              advancing this mission further by providing non-degree learning
              resources - online, in-person, and blended courses and programs
              that offer the opportunity to learn from MIT faculty, industry
              experts, and a global community of learners without enrolling in a
              degree-seeking program. Through these resources, millions of
              learners have gained the knowledge and tools needed to advance
              their academic and professional goals.
            </BodyText>
          </MissionStatementContainer>
          <SubHeaderContainer>
            <SubHeaderTextContainer>
              <Typography variant="subtitle1">
                Our non-degree learning resources empower you to:
              </Typography>
              <ul>
                <li>
                  Access content from world-renowned faculty and experts much of
                  it for free
                </li>
                <li>
                  Build job-relevant skills through application-focused
                  offerings{" "}
                </li>
                <li>
                  Experience peer-to-peer interactions and grow your network
                </li>
                <li>
                  Receive a certificate from MIT, or just learn for your own
                  sake
                </li>
                <li>
                  Learn from the same materials used by MIT students on campus
                </li>
                <li>
                  Download, reuse and edit thousands of learning resources
                </li>
                <li>Continue your education at your own pace</li>
              </ul>
            </SubHeaderTextContainer>
            <SubHeaderImage />
          </SubHeaderContainer>
          <BodySection>
            <BodyText variant="h4">What is MIT Open?</BodyText>
            <BodyText variant="body1">
              MIT Open is the best place to explore all of MIT's non-degree
              learning programs. Learners can compare offerings across
              departments and formats and complete a profile to receive
              personalized recommendations that match their interests and goals.
              <br />
              <br />
              MIT Open makes it easy to stay up-to-date on the latest non-degree
              learning resources from MIT. Subscribe to topics, units, and
              departments of interest to be notified when new courses, programs,
              and more are added.
              <br />
              <br />
              This portal includes courses and programs from MITx, MIT
              Bootcamps, MIT OpenCourseWare, MIT Professional Education, MIT
              Sloan Executive Education, MIT xPRO, and other departments across
              MIT.
            </BodyText>
          </BodySection>
          <BodySection>
            <BodyText variant="h4" id={NON_DEGREE_LEARNING_FRAGMENT_IDENTIFIER}>
              What is non-degree learning at MIT?
            </BodyText>
            <BodyText variant="body1">
              MIT's non-degree learning programs provide specific skills,
              knowledge, or certifications without the time commitment and
              breadth of study required for a full degree. These programs are
              designed to be flexible and accessible, allowing professionals,
              students, and lifelong learners to engage with MIT's educational
              offerings from anywhere in the world. Whether you're looking to
              upskill, explore a new field, or gain a deeper understanding of a
              subject, MIT's non-degree learning resources provide a pathway for
              personal and professional growth.
            </BodyText>
          </BodySection>
          <BodySection>
            <BodyText variant="h4">
              What kinds of content are available from MIT Open?
            </BodyText>
            <BodyText variant="body1">
              MIT is dedicated to advancing knowledge beyond students enrolled
              in MIT's campus programs. Several divisions within MIT offer
              educational opportunities accessible to learners worldwide,
              catering to a diverse range of needs.
              <br />
              <br />
              MIT's ACADEMIC courses, programs, and materials mirror MIT
              curriculum and residential programs, making these available to a
              global audience. Approved by faculty committees, academic content
              furnishes a comprehensive foundation of knowledge, skills, and
              abilities for students pursuing their academic objectives.
              Renowned for its rigor and challenge, MIT's academic offerings
              deliver an experience on par with the campus environment.
              <br />
              <br />
              MIT's PROFESSIONAL courses and programs are tailored for working
              professionals seeking essential practical skills across various
              industries. Led by MIT faculty and maintaining challenging
              standards, Professional courses and programs prioritize real-world
              applications, emphasize practical skills, and are directly
              relevant to today's workforce.
            </BodyText>
          </BodySection>
        </BodyContainer>
      </PageContainer>
    </Container>
  )
}

export { AboutPage, NON_DEGREE_LEARNING_FRAGMENT_IDENTIFIER }
