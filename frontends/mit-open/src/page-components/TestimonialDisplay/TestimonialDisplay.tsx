import React from "react"

import { RiArrowRightLine, RiArrowLeftLine } from "@remixicon/react"
import Slider from "react-slick"
import { ActionButton, TruncateText, styled, theme } from "ol-components"
import AttestantBlock from "./AttestantBlock"
import { useTestimonialList } from "api/hooks/testimonials"
import type { Attestation } from "api/v0"

type TestimonialDisplayProps = {
  channels?: number[]
  offerors?: string[]
}

type InternalTestimonialDisplayProps = {
  attestation: Attestation
}

const TestimonialTruncateText = styled(TruncateText)({
  [theme.breakpoints.down("md")]: {
    ...theme.typography.subtitle1,
    WebkitLineClamp: 6,
    ["@supports (-webkit-line-clamp: 6)"]: {
      WebkitLineClamp: 6,
    },
  },
  [theme.breakpoints.down("sm")]: {
    ...theme.typography.subtitle2,
    WebkitLineClamp: 8,
    ["@supports (-webkit-line-clamp: 8)"]: {
      WebkitLineClamp: 8,
    },
  },
})

const QuoteContainer = styled.section(({ theme }) => ({
  backgroundColor: theme.custom.colors.darkGray2,
  color: theme.custom.colors.white,
  overflow: "auto",
  padding: "16px 0 24px 0",
  marginBottom: "80px",
  [theme.breakpoints.down("md")]: {
    marginBottom: "40px",
  },
}))

const QuoteBlock = styled.div(() => ({
  justifyContent: "center",
  alignItems: "center",
  width: "100%",
  maxWidth: "1328px",
  margin: "0 auto",
  padding: "0 22px",
}))

const QuoteLeader = styled.div(({ theme }) => ({
  width: "100%",
  height: "32px",
  fontSize: "60px",
  lineHeight: "60px",
  color: theme.custom.colors.silverGray,
}))

const QuoteBody = styled.div(({ theme }) => ({
  width: "100%",
  display: "flex",
  [theme.breakpoints.down("md")]: {
    flexDirection: "column",
  },
}))

const AttestationBlock = styled.div(({ theme }) => ({
  width: "auto",
  flexGrow: "5",
  ...theme.typography.h5,
  justifyContent: "top",
}))

const ButtonsContainer = styled.div(({ theme }) => ({
  display: "flex",
  justifyContent: "right",
  margin: "4px auto 0",
  gap: "16px",
  [theme.breakpoints.down("md")]: {
    marginTop: "16px",
  },
}))

const NoButtonsContainer = styled(ButtonsContainer)({
  height: "32px",
  margin: "0 auto",
})

const InteriorTestimonialDisplay: React.FC<InternalTestimonialDisplayProps> = ({
  attestation,
}) => {
  return (
    <QuoteBody>
      <AttestationBlock>
        <TestimonialTruncateText lineClamp={4}>
          {attestation?.quote}
        </TestimonialTruncateText>
      </AttestationBlock>
      <AttestantBlock attestation={attestation} />
    </QuoteBody>
  )
}

const TestimonialDisplay: React.FC<TestimonialDisplayProps> = ({
  channels,
  offerors,
}) => {
  const { data } = useTestimonialList({
    channels: channels,
    offerors: offerors,
  })
  const [slick, setSlick] = React.useState<Slider | null>(null)
  const responsive = [
    {
      breakpoint: theme.breakpoints.values["md"],
      settings: {
        adaptiveHeight: true,
      },
    },
  ]

  if (!data) return null
  if (data.results.length === 0) return null

  return (
    <QuoteContainer>
      <QuoteBlock>
        <QuoteLeader>“</QuoteLeader>
        {data.count > 1 ? (
          <>
            <Slider
              ref={setSlick}
              infinite={true}
              slidesToShow={1}
              arrows={false}
              centerMode={false}
              responsive={responsive}
            >
              {data?.results.map((attestation) => (
                <InteriorTestimonialDisplay
                  key={`testimonial-${attestation.id}`}
                  attestation={attestation}
                ></InteriorTestimonialDisplay>
              ))}
            </Slider>
            <ButtonsContainer>
              <ActionButton
                size="small"
                variant="tertiary"
                onClick={slick?.slickPrev}
              >
                <RiArrowLeftLine />
              </ActionButton>
              <ActionButton
                size="small"
                variant="tertiary"
                onClick={slick?.slickNext}
              >
                <RiArrowRightLine />
              </ActionButton>
            </ButtonsContainer>
          </>
        ) : (
          <>
            <InteriorTestimonialDisplay
              key={`testimonial-${data["results"][0].id}`}
              attestation={data["results"][0]}
            ></InteriorTestimonialDisplay>
            <NoButtonsContainer></NoButtonsContainer>
          </>
        )}
      </QuoteBlock>
    </QuoteContainer>
  )
}

export default TestimonialDisplay
