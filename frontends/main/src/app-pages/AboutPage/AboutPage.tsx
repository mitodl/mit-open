"use client"

import {
  Breadcrumbs,
  Container,
  Typography,
  theme,
  styled,
} from "ol-components"
import * as urls from "@/common/urls"
import React from "react"
import domeImage from "../../../public/mit-dome-2.jpg"

const WHAT_IS_MIT_OPEN_FRAGMENT_IDENTIFIER = "what-is-mit-learn"
const NON_DEGREE_LEARNING_FRAGMENT_IDENTIFIER = "non-degree-learning"
const ACADEMIC_AND_PROFESSIONAL_CONTENT = "kinds-of-content"

const SITE_NAME = process.env.NEXT_PUBLIC_SITE_NAME

const PageContainer = styled(Container)({
  color: theme.custom.colors.darkGray2,
  paddingTop: "40px",
  paddingBottom: "80px",
  [theme.breakpoints.down("sm")]: {
    paddingTop: "28px",
    paddingBottom: "32px",
  },
})

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

const BodyContainer = styled.div({
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  alignSelf: "stretch",
  gap: "40px",
})

const HighlightContainer = styled.div({
  display: "flex",
  flexDirection: "column",
  gap: "24px",
  padding: "40px",
  borderRadius: "8px",
  border: `1px solid ${theme.custom.colors.lightGray2}`,
  backgroundColor: theme.custom.colors.white,
  [theme.breakpoints.down("md")]: {
    padding: "16px 16px",
  },
})

const SubHeaderContainer = styled.div({
  display: "flex",
  alignItems: "center",
  alignSelf: "stretch",
  gap: "30px",
  [theme.breakpoints.down("md")]: {
    flexDirection: "column-reverse",
    gap: "16px",
  },
})

const SubHeaderTextContainer = styled.div({
  display: "flex",
  flexDirection: "column",
  flex: "1 0 0",
  alignSelf: "flex-start",
})

const SubHeaderImage = styled.img({
  flexGrow: 1,
  alignSelf: "stretch",
  borderRadius: "8px",
  backgroundSize: "cover",
  backgroundPosition: "center",
  backgroundImage: `url(${domeImage.src})`,
  [theme.breakpoints.down("md")]: {
    height: "300px",
  },
})

const BodySection = styled.div({
  display: "flex",
  flexDirection: "column",
  alignSelf: "stretch",
  gap: "16px",
})

const List = styled.ul({
  "li + li": {
    marginTop: theme.typography.pxToRem(4),
  },
})

const AboutPage: React.FC = () => {
  return (
    <PageContainer>
      <BannerContainer>
        <BannerContainerInner>
          <Breadcrumbs
            variant="light"
            ancestors={[{ href: urls.HOME, label: "Home" }]}
            current="About Us"
          />
          <Typography variant="h3" component="h1">
            About Us
          </Typography>
        </BannerContainerInner>
      </BannerContainer>
      <BodyContainer>
        <Typography variant="body1">
          Since its founding in 1861, MIT has been committed to sharing
          knowledge with the world. At the beginning of the 21st century, MIT
          expanded this mission by bringing learning resources online, reaching
          a broader audience through digital platforms. Today, MIT continues to
          advance this mission by offering non-degree learning resources,
          including online, in-person, and blended courses and programs. These
          opportunities allow learners to study with MIT faculty, industry
          experts, and a global community without enrolling in a degree program.
          Through these resources, millions of learners have acquired the
          knowledge and skills needed to further their academic and professional
          goals.
        </Typography>
        <SubHeaderContainer>
          <SubHeaderTextContainer>
            <Typography variant="subtitle1">
              Our non-degree learning resources empower you to:
            </Typography>
            <List>
              <li>
                Learn for free from the same materials used by MIT students on
                campus
              </li>
              <li>
                Receive a certificate from MIT or learn for your own enjoyment
              </li>
              <li>
                Earn program credentials and apply for an accelerated master's
                degree program at MIT
              </li>
              <li>
                Download, share, and modify thousands of learning resources
              </li>
              <li>Access content from world-renowned faculty and experts</li>
              <li>
                Build job-relevant skills through application-focused offerings
              </li>
              <li>
                Experience peer-to-peer interactions and grow your network
              </li>
              <li>Continue your education at your own pace</li>
            </List>
          </SubHeaderTextContainer>
          <SubHeaderImage />
        </SubHeaderContainer>
        <BodySection>
          <HighlightContainer>
            <Typography
              variant="h4"
              component="h2"
              id={WHAT_IS_MIT_OPEN_FRAGMENT_IDENTIFIER}
            >
              What is {SITE_NAME}?
            </Typography>
            <Typography variant="body1">
              {SITE_NAME} offers a single platform for accessing all of MIT's
              non-degree learning resources. This includes courses, programs,
              and various educational materials from different MIT units such as
              MITx, MIT Bootcamps, MIT OpenCourseWare, MIT Professional
              Education, MIT Sloan Executive Education, MIT xPRO, and other
              departments across the Institute.
            </Typography>
            <Typography variant="body1">
              Learners can search and browse by topic or department to explore
              popular and upcoming courses. By creating a free account, they can
              receive personalized recommendations tailored to their interests
              and goals, create lists of learning resources, follow topics of
              interest, and more
            </Typography>
          </HighlightContainer>
        </BodySection>
        <BodySection>
          <Typography
            variant="h4"
            component="h2"
            id={NON_DEGREE_LEARNING_FRAGMENT_IDENTIFIER}
          >
            What is non-degree learning at MIT?
          </Typography>
          <Typography variant="body1">
            MIT's non-degree learning programs offer targeted skills, knowledge,
            and certifications without the extensive time commitment of a full
            degree. These programs are designed to be flexible and accessible,
            enabling professionals, students, and lifelong learners to engage
            with MIT's educational offerings from anywhere in the world. Many
            resources are available for free or at a low cost. Whether you want
            to upskill, explore a new field, or deepen your understanding of a
            subject, MIT's non-degree learning resources provide a pathway for
            personal and professional growth.
          </Typography>
        </BodySection>
        <BodySection>
          <Typography
            variant="h4"
            component="h2"
            id={ACADEMIC_AND_PROFESSIONAL_CONTENT}
          >
            Academic and Professional content
          </Typography>
          <Typography variant="body1">
            MIT's non-degree offerings include content developed from MIT's
            Academic and Professional curriculum.
          </Typography>
          <Typography variant="body1">
            MIT's Academic courses, programs, and materials mirror MIT
            curriculum and residential programs, making these available to a
            global audience. Approved by faculty committees, academic content
            furnishes a comprehensive foundation of knowledge, skills, and
            abilities for students pursuing their academic objectives. Renowned
            for its rigor and challenge, MIT's academic offerings deliver an
            experience on par with the campus environment.
          </Typography>
          <Typography variant="body1">
            MIT's Professional courses and programs are tailored for working
            professionals seeking essential practical skills across various
            industries. Led by MIT faculty and maintaining challenging
            standards, Professional courses and programs prioritize real-world
            applications, emphasize practical skills, and are directly relevant
            to today's workforce.
          </Typography>
        </BodySection>
      </BodyContainer>
    </PageContainer>
  )
}

export {
  AboutPage,
  WHAT_IS_MIT_OPEN_FRAGMENT_IDENTIFIER,
  NON_DEGREE_LEARNING_FRAGMENT_IDENTIFIER,
  ACADEMIC_AND_PROFESSIONAL_CONTENT as WHAT_KINDS_OF_CONTENT_FRAGMENT_IDENTIFIER,
}
