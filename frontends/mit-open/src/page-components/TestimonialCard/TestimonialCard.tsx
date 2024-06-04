import React, { useEffect, useState } from "react"

import { styled } from "ol-components"
import { useTestimonialList } from "api/hooks/testimonials"
import { Attestation } from "api/v0"

type TestimonialCardProps = {
  channels?: Array<number>
}

type TestimonialCardDataProps = {
  channels?: Array<number>
  children: ({
    resources,
    isLoading,
  }: {
    resources: Attestation[]
    isLoading: boolean
  }) => React.ReactNode
}

type InternalTestimonialCardProps = {
  resources: Attestation[]
  isLoading: boolean
}

const QuoteContainer = styled.section(({ theme }) => ({
  backgroundColor: theme.custom.colors.darkGray1,
  color: theme.custom.colors.white,
  overflow: "auto",
  padding: "16px 0",
}))

const Quote = styled.div(() => ({
  width: "1240px",
  margin: "0 auto",
}))

const QuoteBlock = styled.div(() => ({
  padding: "30px 0",
  display: "flex",
  justifyContent: "center",
  alignItems: "center",
}))

const QuoteLeaderContainer = styled.div(() => ({
  display: "block",
  width: "30px",
  fontSize: "90px",
  marginLeft: "95px",
  marginRight: "10px",
}))

const QuoteLeader = styled.div({
  transform: "translateY(-15px)",
  width: "29px",
  lineHeight: "26px",
})

const AttestationBody = styled.div(() => ({
  width: "837px",
}))

const Attestant = styled.div(() => ({
  marginLeft: "30px",
  marginRight: "110px",
  flexGrow: "1",
  width: "auto",
  whiteSpace: "nowrap",
}))

const TestimonialCardFilteredData: React.FC<TestimonialCardDataProps> = ({
  children,
  channels,
}) => {
  const { isLoading, data } = useTestimonialList({ channels: channels })
  return children({ resources: data?.results ?? [], isLoading })
}

const TestimonialCardData: React.FC<TestimonialCardDataProps> = ({
  children,
}) => {
  const { isLoading, data } = useTestimonialList()
  return children({ resources: data?.results ?? [], isLoading })
}

const InteriorTestimonialCard: React.FC<InternalTestimonialCardProps> = ({
  resources,
  isLoading,
}) => {
  const [randomTestimonial, setRandomTestimonial] =
    useState<Attestation | null>(null)

  useEffect(() => {
    if (!isLoading) {
      setRandomTestimonial(
        resources[Math.floor(Math.random() * resources.length)],
      )
    }
  }, [resources, isLoading])

  return isLoading ? (
    <QuoteContainer>
      <Quote>
        <QuoteBlock>
          <QuoteLeaderContainer>
            <QuoteLeader>“</QuoteLeader>
          </QuoteLeaderContainer>
          <AttestationBody>
            {randomTestimonial?.quote ??
              "You have three powerful forces coming together again, the HBCUs, and MIT, Merlot. The need is worldwide for people of all races, underrepresented populations to be able to access information, and to tap in to rich cultural resources to help them in their academic journey."}
          </AttestationBody>
          <Attestant>
            {randomTestimonial?.attestant_name ?? "Dr. Robbie Melton"}
          </Attestant>
        </QuoteBlock>
      </Quote>
    </QuoteContainer>
  ) : null
}

const TestimonialCard: React.FC<TestimonialCardProps> = ({ channels }) => {
  return channels ? (
    <TestimonialCardFilteredData channels={channels}>
      {({ resources, isLoading }) => (
        <InteriorTestimonialCard
          resources={resources}
          isLoading={isLoading}
        ></InteriorTestimonialCard>
      )}
    </TestimonialCardFilteredData>
  ) : (
    <TestimonialCardData>
      {({ resources, isLoading }) => (
        <InteriorTestimonialCard
          resources={resources}
          isLoading={isLoading}
        ></InteriorTestimonialCard>
      )}
    </TestimonialCardData>
  )
}

export default TestimonialCard
