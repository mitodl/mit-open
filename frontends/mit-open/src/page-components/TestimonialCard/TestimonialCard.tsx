import React from "react"

import { styled, theme } from "ol-components"
// import { useTestimonialList } from "api/hooks/testimonials"

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

const Attestation = styled.div(() => ({
  width: "837px",
}))

const Attestant = styled.div(() => ({
  marginLeft: "30px",
  marginRight: "110px",
  flexGrow: "1",
  width: "auto",
  whiteSpace: "nowrap",
}))

const TestimonialCard: React.FC = () => {
  // const { isLoading, data: testimonials } = useTestimonialList()
  const isLoading = true
  const testimonials: Array<any> = []

  return isLoading ? (
    <QuoteContainer>
      <Quote>
        <QuoteBlock>
          <QuoteLeaderContainer>
            <QuoteLeader>“</QuoteLeader>
          </QuoteLeaderContainer>
          <Attestation>
            {testimonials[0]?.quote ??
              "You have three powerful forces coming together again, the HBCUs, and MIT, Merlot. The need is worldwide for people of all races, underrepresented populations to be able to access information, and to tap in to rich cultural resources to help them in their academic journey."}
          </Attestation>
          <Attestant>
            {testimonials[0]?.attestant_name ?? "Dr. Robbie Melton"}
          </Attestant>
        </QuoteBlock>
      </Quote>
    </QuoteContainer>
  ) : null
}

export default TestimonialCard
