import { Breadcrumbs, Container, Typography, styled } from "ol-components"
import { MetaTags } from "ol-utilities"
import * as urls from "@/common/urls"
import React from "react"

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
  gap: "20px",
})

const BodyText = styled(Typography)(({ theme }) => ({
  alignSelf: "stretch",
  color: theme.custom.colors.black,
}))

const UnorderedList = styled.ul(({ theme }) => ({
  width: "100%",
  ...theme.typography.body1,
}))

const { SITE_NAME, MITOL_SUPPORT_EMAIL } = APP_SETTINGS

const PrivacyPage: React.FC = () => {
  return (
    <Container>
      <PageContainer>
        <MetaTags title="Privacy Policy" />
        <BannerContainer>
          <BannerContainerInner>
            <Breadcrumbs
              variant="light"
              ancestors={[{ href: urls.HOME, label: "Home" }]}
              current="Privacy Policy"
            />
            <Header variant="h3">Privacy Policy</Header>
          </BannerContainerInner>
        </BannerContainer>
        <BodyContainer>
          <BodyText variant="h4">Introduction</BodyText>
          <BodyText variant="body1">
            {SITE_NAME} provides information about MIT courses, programs, and
            learning materials to learners from across the world. This Privacy
            Statement explains how {SITE_NAME} collects, uses, and processes
            personal information about our learners.
          </BodyText>
          <BodyText variant="h4">What personal information we collect</BodyText>
          <BodyText variant="body1">
            We may collect, use, store, and transfer different kinds of personal
            information about you, which we have grouped together as follows:
          </BodyText>
          <UnorderedList>
            <li>
              Biographic information – name, email address, education level and
              other demographic info
            </li>
            <li>
              Demographics and Interests - Affinity categories, Product Purchase
              Interests, and Other Categories of interest
            </li>
            <li>IP addresses</li>
            <li>Course progress and performance</li>
          </UnorderedList>
          <BodyText variant="h4">
            How we collect personal information about you
          </BodyText>
          <BodyText variant="body1">
            We collect information, including Personal Information, when you
            create and maintain a profile and user account.
          </BodyText>
          <BodyText variant="body1">
            We also collect certain usage information about learner performance
            and patterns of learning. In addition, we track information
            indicating, among other things, which pages of our Site were
            visited, the order in which they were visited, when they were
            visited, and which hyperlinks and other user interface controls were
            used.
          </BodyText>
          <BodyText variant="body1">
            We also collect information when you fill out and submit contact
            forms, as well as from marketing data including how many emails you
            have received, opened, clicked, and unsubscribed from.
          </BodyText>
          <BodyText variant="body1">
            We may log the IP address, operating system, page visit behavior,
            and browser software used by each user of the Site, and we may be
            able to determine from an IP address a user's Internet Service
            Provider and the geographic location of his or her point of
            connectivity. Various web analytics tools, including Google
            Analytics, Google Analytics: Demographics and Interests, and
            HubSpot, are used to collect this information. Some of the
            information is collected through cookies (small text files placed on
            your computer that store information about you, which can be
            accessed by the Site). You should be able to control how and whether
            cookies will be accepted by your web browser. Most browsers offer
            instructions on how to reset the browser to reject cookies in the
            "Help" section of the toolbar. If you reject our cookies, many
            functions and conveniences of this Site may not work properly.
          </BodyText>
          <BodyText variant="h4">How we use your personal information</BodyText>
          <BodyText variant="body1">
            We collect, use, and process your personal information (1) to
            process transactions requested by you and meet our contractual
            obligations; (2) to facilitate {SITE_NAME}'s legitimate interests,
            and/or (3) with your explicit consent, where applicable. Examples of
            the ways in which we use your personal information are as follows:
          </BodyText>
          <UnorderedList>
            <li>
              For the purpose for which you specifically provided the
              information, for example, to respond to a specific inquiry or
              provide you with access to the specific course content and/or
              services you select.
            </li>
            <li>
              To archive this information and/or use it for future
              communications with you.
            </li>
            <li>
              To maintain and improve the functioning and security of the Site
              and our software, systems, and network.
            </li>
            <li>
              For purposes described elsewhere in this Privacy Policy
              (including, e.g., sharing with third parties).
            </li>
            <li>
              As otherwise described to you at the point of collection or
              pursuant to your consent.
            </li>
          </UnorderedList>
          <BodyText variant="body1">
            If you have concerns about any of these purposes, or how we
            communicate with you, please contact us at {MITOL_SUPPORT_EMAIL}. We
            will always respect a request by you to stop processing your
            personal information (subject to our legal obligations).
          </BodyText>
          <BodyText variant="h4">
            When we share your personal information
          </BodyText>
          <BodyText variant="body1">
            We may share your personal information with departments, labs, and
            centers within the MIT Community to provide information which may be
            of interest to you. User information may also be shared with
            third-party partners to the extent necessary for such third parties
            to provide services to us or to users of our services or provide.
            Any third parties who receive user information for this purpose are
            prohibited from using or sharing user information for any purpose
            other than providing services to MIT.
          </BodyText>
          <BodyText variant="body1">
            We may also provide your information to third parties in
            circumstances where we believe that doing so is necessary or
            appropriate to satisfy any applicable law, regulation, legal process
            or governmental request; to enforce our rights, to detect, prevent
            or otherwise address fraud, security or technical issues; or to
            protect the rights, property or safety of us, our users or others.
          </BodyText>
          <BodyText variant="h4">
            How your information is stored and secured
          </BodyText>
          <BodyText variant="body1">
            {SITE_NAME} is designed to protect Personal Information in its
            possession or control. This is done through a variety of privacy and
            security policies, processes, and procedures, including
            administrative, physical, and technical safeguards that reasonably
            and appropriately protect the confidentiality, integrity, and
            availability of the Personal Information that it receives,
            maintains, or transmits. Nonetheless, no method of transmission over
            the Internet or method of electronic storage is 100% secure, and
            therefore we do not guarantee its absolute security.
          </BodyText>
          <BodyText variant="body1">
            All data transferred between systems, from the moment of first
            collection, is encrypted using industry-standard TLS protocols with
            high-strength private keys. All data at rest is stored on encrypted
            media using AWS KMS encryption keys that are only accessible by
            infrastructure administrators. All data access is based on a least
            privilege model with a default deny policy. Permissions are granted
            based on verified business use cases and subject to auditing to
            verify appropriate applications.
          </BodyText>
          <BodyText variant="h4">
            How long we keep your personal information
          </BodyText>
          <BodyText variant="body1">
            We consider your relationship with the {SITE_NAME} community to be
            lifelong. This means that we will maintain a record for you until
            such time as you tell us that you no longer wish us to keep in
            touch. Requests to delete your account or personal information can
            be sent to olprivacy@mit.edu. After such time, we will retain a core
            set of information for {SITE_NAME}'s legitimate purposes, such as
            archival, scientific and historical research and for the defense of
            potential legal claims.
          </BodyText>
          <BodyText variant="h4">
            Rights for Individuals in the European Economic Area (EEA) or United
            Kingdom (UK)
          </BodyText>
          <BodyText variant="body1">
            You have the right in certain circumstances to (1) access your
            personal information; (2) to correct or erase information; (3)
            restrict processing; and (4) object to communications, direct
            marketing, or profiling. To the extent applicable, the EEA's General
            Data Protection Regulation (GDPR) provides further information about
            your rights. You also have the right to lodge complaints with your
            national or regional data protection authority.
          </BodyText>
          <BodyText variant="body1">
            If you are inclined to exercise these rights, we request an
            opportunity to discuss with you any concerns you may have. To
            protect the personal information we hold, we may also request
            further information to verify your identity when exercising these
            rights. Upon a request to erase information, we will maintain a core
            set of personal data to ensure we do not contact you inadvertently
            in the future, as well as any information necessary for MIT archival
            purposes. We may also need to retain some financial information for
            legal purposes, including US IRS compliance. In the event of an
            actual or threatened legal claim, we may retain your information for
            purposes of establishing, defending against or exercising our rights
            with respect to such claim.
          </BodyText>
          <BodyText variant="body1">
            By providing information directly to MIT, you consent to the
            transfer of your personal information outside of the European
            Economic Area to the United States. You understand that the current
            laws and regulations of the United States may not provide the same
            level of protection as the data and privacy laws and regulations of
            the EEA.
          </BodyText>
          <BodyText variant="body1">
            You are under no statutory or contractual obligation to provide any
            personal data to us. The controller for your personal information is
            MIT.
          </BodyText>
          <BodyText variant="body1">
            If you are in the EEA or UK and wish to assert any of your
            applicable GDPR rights, please contact dataprotection@mit.edu. You
            may also contact MIT's representatives listed below:
          </BodyText>
          <BodyText variant="h5">
            MIT Representative in the European Economic Area
          </BodyText>
          <BodyText variant="body1">
            <strong>PJ-PAL Europe</strong>
            <br />
            Email: jpaleurope@povertyactionlab.org
            <br />
            Address: 48 Boulevard Jourdan, 75014 Paris, France
          </BodyText>
          <BodyText variant="h5">
            MIT Representative in the United Kingdom
          </BodyText>
          <BodyText variant="body1">
            <strong>MIT Press UK</strong>
            <br />
            Address: 71 Queen Victoria Street, London, EC4V 4BE, United Kingdom
          </BodyText>
          <BodyText variant="h4">Additional Information</BodyText>
          <BodyText variant="body1">
            We may change this Privacy Statement from time to time. If we make
            any significant changes in the way we treat your personal
            information we will make this clear on our MIT websites or by
            contacting you directly.
          </BodyText>
          <BodyText variant="body1">
            <strong>This policy was last updated in July 2024.</strong>
          </BodyText>
        </BodyContainer>
      </PageContainer>
    </Container>
  )
}

export default PrivacyPage
